import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../../constants/supabaseConfig';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const AllNews = () => {
  const [newsList, setNewsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) setNewsList(data);
      setLoading(false);
    };
    fetchNews();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Modern, minimal header */}
      <View style={{ paddingTop: 32, paddingBottom: 12, paddingHorizontal: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f1f5f9', marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#22223b', letterSpacing: 0.5 }}>All News</Text>
        <MaterialIcons name="feed" size={28} color="#16a34a" />
      </View>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {newsList.map((item, idx) => (
            <View key={item.id || idx} style={[styles.card, { minHeight: 120, maxWidth: width * 0.97, marginBottom: 16 }]}> 
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image
                  source={{ uri: item.picture.startsWith('data:') ? item.picture : `data:image/jpeg;base64,${item.picture}` }}
                  style={{ width: 90, height: 90, borderRadius: 16, marginRight: 14, backgroundColor: '#f1f5f9' }}
                  resizeMode="cover"
                />
                <View style={{ flex: 1, minHeight: 90, justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                    <View style={[styles.tag, item.tag === 'Featured' ? styles.tagBlue : item.tag === 'Holiday Special' ? styles.tagOrange : styles.tagGreen, { marginRight: 8 }]}> 
                      <Text style={[styles.tagText, item.tag === 'Featured' ? styles.textBlue : item.tag === 'Holiday Special' ? styles.textOrange : styles.textGreen]}>{item.tag || 'Latest Update'}</Text>
                    </View>
                    <Text style={styles.dateText}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</Text>
                  </View>
                  <Text style={{ fontSize: 17, fontWeight: 'bold', color: '#22223b', marginBottom: 2 }} numberOfLines={1}>{item.title}</Text>
                  <Text numberOfLines={2} style={{ color: '#374151', fontSize: 14, marginBottom: 4 }}>{item.news}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <MaterialIcons name="location-on" size={15} color="#6B7280" />
                      <Text style={{ color: '#6b7280', fontSize: 13, marginLeft: 2 }}>{item.Location || 'N/A'}</Text>
                    </View>
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#16a34a', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5 }} onPress={() => router.push({ pathname: '../news_details', params: { news_id: item.id, from: 'receiver' } })}>
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14, marginRight: 4 }}>Details</Text>
                      <MaterialIcons name="arrow-forward-ios" size={15} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: { backgroundColor: '#16a34a', paddingTop: 48, paddingBottom: 24, paddingHorizontal: 24, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, marginBottom: 12 },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 4, letterSpacing: 1 },
  headerSubtitle: { color: '#d1fae5', fontSize: 16, fontWeight: '500' },
  card: { backgroundColor: '#fff', borderRadius: 18, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 4, overflow: 'hidden' },
  cardImage: { width: '100%', height: width * 0.48, borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  cardContent: { padding: 16 },
  tagRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  tag: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  tagBlue: { backgroundColor: '#dbeafe' },
  tagGreen: { backgroundColor: '#bbf7d0' },
  tagOrange: { backgroundColor: '#fed7aa' },
  tagText: { fontWeight: 'bold', fontSize: 13 },
  textBlue: { color: '#2563eb' },
  textGreen: { color: '#16a34a' },
  textOrange: { color: '#ea580c' },
  dateText: { color: '#6b7280', fontSize: 12 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#22223b', marginBottom: 4, marginTop: 2 },
  cardDesc: { color: '#374151', fontSize: 15, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  locationText: { color: '#6b7280', fontSize: 14, marginLeft: 4 },
  detailsBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16a34a', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 7 },
  detailsBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15, marginRight: 6 },
});

export default AllNews; 