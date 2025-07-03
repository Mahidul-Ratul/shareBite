import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../../constants/supabaseConfig';
import { MaterialIcons } from '@expo/vector-icons';

const DonationDetails = () => {
  const { donation_id } = useLocalSearchParams();
  const [donation, setDonation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchDonation = async () => {
      setLoading(true);
      if (!donation_id) return;
      const { data, error } = await supabase
        .from('donation')
        .select('*')
        .eq('id', donation_id)
        .single();
      if (!error && data) setDonation(data);
      setLoading(false);
    };
    fetchDonation();
  }, [donation_id]);

  const getStatus = (status: string | null) => {
    if (!status) return { label: 'Pending', color: '#facc15' };
    if (status === 'delivered the food') return { label: 'Completed', color: '#22c55e' };
    return { label: 'In Progress', color: '#3b82f6' };
  };

  let images: string[] = [];
  if (donation?.Image) {
    try {
      images = typeof donation.Image === 'string' ? JSON.parse(donation.Image) : donation.Image;
      if (!Array.isArray(images)) images = [images];
    } catch {
      images = [donation.Image];
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 18, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f1f5f9' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <MaterialIcons name="arrow-back" size={26} color="#22223b" />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#22223b' }}>Donation Details</Text>
      </View>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      ) : donation ? (
        <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <View style={{ backgroundColor: getStatus(donation.status).color, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, marginRight: 10 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>{getStatus(donation.status).label}</Text>
              </View>
              <Text style={{ color: '#6b7280', fontSize: 13 }}>{donation.Producing ? new Date(donation.Producing).toLocaleString() : ''}</Text>
            </View>
            <Text style={styles.title}>{donation.Details}</Text>
            <Text style={styles.subtitle}>Type: <Text style={{ color: '#16a34a' }}>{donation.Types}</Text></Text>
            <Text style={styles.subtitle}>Quantity: <Text style={{ color: '#16a34a' }}>{donation.Quantity}</Text></Text>
            <Text style={styles.subtitle}>Instructions: <Text style={{ color: '#374151' }}>{donation.Instructions || 'N/A'}</Text></Text>
            <Text style={styles.subtitle}>Location: <Text style={{ color: '#374151' }}>{donation.Location}</Text></Text>
            <Text style={styles.subtitle}>Lasting Time: <Text style={{ color: '#374151' }}>{donation.Lasting ? new Date(donation.Lasting).toLocaleTimeString() : 'N/A'}</Text></Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 }}>
              {images.map((img, idx) => (
                <Image
                  key={idx}
                  source={{ uri: img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}` }}
                  style={{ width: 90, height: 90, borderRadius: 12, marginRight: 10, marginBottom: 10, backgroundColor: '#f1f5f9' }}
                  resizeMode="cover"
                />
              ))}
            </View>
          </View>
        </ScrollView>
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#dc2626', fontSize: 16 }}>Donation not found.</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 18, shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 4, marginBottom: 18 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#22223b', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#374151', marginBottom: 2 },
});

export default DonationDetails;
