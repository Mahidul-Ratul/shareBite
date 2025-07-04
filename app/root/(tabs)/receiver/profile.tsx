import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { supabase } from '../../../../constants/supabaseConfig';

const { width } = Dimensions.get('window');

export default function ReceiverProfile() {
  const [receiver, setReceiver] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReceiver = async () => {
      setLoading(true);
      // Get logged in user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      // Get receiver info by email
      const { data, error } = await supabase
        .from('receiver')
        .select('*')
        .eq('email', user.email)
        .single();
      if (!error && data) setReceiver(data);
      setLoading(false);
    };
    fetchReceiver();
  }, []);

 

  const handleEditProfile = () => {
    // Navigate to edit profile page (implement this page if needed)
    // router.push('/root/(tabs)/receiver/edit-profile');
  };

  if (loading) {
    return (
      <View style={styles.centered}><ActivityIndicator size="large" color="#6366f1" /></View>
    );
  }
  if (!receiver) {
    return (
      <View style={styles.centered}><Text style={{ color: '#dc2626' }}>Receiver profile not found.</Text></View>
    );
  }

  // Prepare image
  let imageUri = receiver.image_url;
  if (imageUri && !imageUri.startsWith('data:image')) {
    imageUri = `data:image/jpeg;base64,${imageUri}`;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff7ed' }}>
      <ScrollView style={{ flex: 1, backgroundColor: '#fff7ed' }} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Smart Profile Header with Actions */}
        <View style={{
          backgroundColor: '#fff',
          borderBottomLeftRadius: 36,
          borderBottomRightRadius: 36,
          overflow: 'hidden',
          alignItems: 'center',
          paddingTop: 48,
          paddingBottom: 24,
          shadowColor: '#f97316',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.18,
          shadowRadius: 16,
          elevation: 8,
          marginBottom: 12,
        }}>
          <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'flex-end', paddingHorizontal: 24, marginBottom: 8 }}>
            <TouchableOpacity onPress={handleEditProfile} style={{ marginRight: 18 }}>
              <MaterialIcons name="edit" size={26} color="#f97316" />
            </TouchableOpacity>
            <TouchableOpacity >
              <MaterialIcons name="logout" size={26} color="#f97316" />
            </TouchableOpacity>
          </View>
          <View style={{ alignItems: 'center' }}>
            <View style={{
              borderWidth: 4,
              borderColor: '#f97316',
              borderRadius: 100,
              overflow: 'hidden',
              width: 120,
              height: 120,
              backgroundColor: '#fff',
              marginBottom: 10,
              shadowColor: '#f97316',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.18,
              shadowRadius: 8,
              elevation: 6,
            }}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={{ width: 120, height: 120 }} resizeMode="cover" />
              ) : (
                <FontAwesome5 name="user-alt" size={60} color="#f97316" style={{ marginTop: 30 }} />
              )}
            </View>
            <Text style={{ color: '#f97316', fontSize: 28, fontWeight: 'bold', marginTop: 8, letterSpacing: 1 }}>{receiver.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, backgroundColor: '#fff7ed', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 4 }}>
              <MaterialIcons name="groups" size={20} color="#f97316" />
              <Text style={{ color: '#f97316', fontSize: 17, marginLeft: 8, fontWeight: '700', textTransform: 'capitalize', letterSpacing: 0.5 }}>{receiver.type}</Text>
            </View>
          </View>
        </View>

        {/* Smart Info Grid */}
        <View style={{ paddingHorizontal: 18, marginTop: 8 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <View style={styles.smartCard}>
              <MaterialIcons name="badge" size={28} color="#f97316" />
              <Text style={smartCardLabel}>Registration</Text>
              <Text style={smartCardValue}>{receiver.registration}</Text>
            </View>
            <View style={styles.smartCard}>
              <MaterialIcons name="person" size={28} color="#f97316" />
              <Text style={smartCardLabel}>Contact</Text>
              <Text style={smartCardValue}>{receiver.contact_person}</Text>
            </View>
            <View style={styles.smartCard}>
              <MaterialIcons name="phone" size={28} color="#f97316" />
              <Text style={smartCardLabel}>Phone</Text>
              <Text style={smartCardValue}>{receiver.phone}</Text>
            </View>
            <View style={styles.smartCard}>
              <MaterialIcons name="email" size={28} color="#f97316" />
              <Text style={smartCardLabel}>Email</Text>
              <Text style={smartCardValue}>{receiver.email}</Text>
            </View>
            <View style={styles.smartCard}>
              <MaterialIcons name="groups" size={28} color="#f97316" />
              <Text style={smartCardLabel}>Capacity</Text>
              <Text style={smartCardValue}>{receiver.capacity}</Text>
            </View>
            <View style={styles.smartCard}>
              <MaterialIcons name="location-on" size={28} color="#f97316" />
              <Text style={smartCardLabel}>Location</Text>
              <Text style={smartCardValue}>{receiver.location}</Text>
            </View>
            <View style={styles.smartCard}>
              <MaterialIcons name="area-chart" size={28} color="#f97316" />
              <Text style={smartCardLabel}>Areas</Text>
              <Text style={smartCardValue}>{receiver.areas}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  smartCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    alignItems: 'center',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 2,
  },
});
const smartCardLabel = {
  fontSize: 15,
  color: '#f97316',
  fontWeight: '700' as const,
  marginTop: 10,
};
const smartCardValue = {
  fontSize: 16,
  color: '#374151',
  marginTop: 2,
  fontWeight: '500' as const,
  textAlign: 'center' as const,
};
