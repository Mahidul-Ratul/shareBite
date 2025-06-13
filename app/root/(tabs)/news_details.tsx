import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../constants/supabaseConfig';
import { MaterialIcons } from '@expo/vector-icons';

const NewsDetails = () => {
  const { news_id } = useLocalSearchParams();
  const [news, setNews] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      if (!news_id) return;
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('id', news_id)
        .single();
      if (!error && data) setNews(data);
      setLoading(false);
    };
    fetchNews();
  }, [news_id]);

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 18, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f1f5f9' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <MaterialIcons name="arrow-back" size={26} color="#22223b" />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#22223b' }}>News Details</Text>
      </View>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      ) : news ? (
        <ScrollView contentContainerStyle={{ padding: 0, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* News Image */}
          <Image
            source={{ uri: news.picture.startsWith('data:') ? news.picture : `data:image/jpeg;base64,${news.picture}` }}
            style={{ width: '100%', height: 240, backgroundColor: '#f1f5f9' }}
            resizeMode="cover"
          />
          {/* Tag and Date */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 18 }}>
            <View style={[styles.tag, news.tag === 'Featured' ? styles.tagBlue : news.tag === 'Holiday Special' ? styles.tagOrange : styles.tagGreen]}> 
              <Text style={[styles.tagText, news.tag === 'Featured' ? styles.textBlue : news.tag === 'Holiday Special' ? styles.textOrange : styles.textGreen]}>{news.tag || 'Latest Update'}</Text>
            </View>
            <Text style={styles.dateText}>{news.created_at ? new Date(news.created_at).toLocaleDateString() : ''}</Text>
          </View>
          {/* Title */}
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#22223b', marginTop: 10, marginBottom: 8, paddingHorizontal: 18, lineHeight: 34 }}>{news.title}</Text>
          {/* Location */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, marginBottom: 10 }}>
            <MaterialIcons name="location-on" size={18} color="#6B7280" />
            <Text style={{ color: '#6b7280', fontSize: 15, marginLeft: 4 }}>{news.Location || 'N/A'}</Text>
          </View>
          {/* Body */}
          <View style={{ borderTopWidth: 1, borderColor: '#e5e7eb', marginHorizontal: 18, marginTop: 8, marginBottom: 0 }} />
          <Text style={{ color: '#374151', fontSize: 17, lineHeight: 28, paddingHorizontal: 18, marginTop: 18, marginBottom: 24, textAlign: 'justify' }}>{news.news}</Text>
        </ScrollView>
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#dc2626', fontSize: 16 }}>News not found.</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  tag: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  tagBlue: { backgroundColor: '#dbeafe' },
  tagGreen: { backgroundColor: '#bbf7d0' },
  tagOrange: { backgroundColor: '#fed7aa' },
  tagText: { fontWeight: 'bold', fontSize: 13 },
  textBlue: { color: '#2563eb' },
  textGreen: { color: '#16a34a' },
  textOrange: { color: '#ea580c' },
  dateText: { color: '#6b7280', fontSize: 12 },
});

export default NewsDetails;
