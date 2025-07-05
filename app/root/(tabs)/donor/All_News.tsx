import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../../../constants/supabaseConfig';

interface NewsItem {
  id: string;
  title: string;
  news: string;
  tag: string;
  created_at: string;
  picture: string;
  Location?: string;
}

export default function DonorAllNews() {
  const router = useRouter();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) setNews(data);
      setLoading(false);
    };
    fetchNews();
  }, []);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-rubik-bold text-gray-800">News & Events</Text>
          <TouchableOpacity 
            className="p-2 rounded-full bg-gray-100"
            onPress={() => router.back()}
          >
            <MaterialIcons name="keyboard-arrow-left" size={24} color="#4B5563" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <ScrollView className="flex-1 p-4">
          <View className="space-y-4">
            {news.map((item) => (
              <TouchableOpacity
                key={item.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                onPress={() => router.push({ pathname: '../news_details', params: { id: item.id } })}
              >
                <Image
                  source={item.picture.startsWith('data:') ? { uri: item.picture } : { uri: `data:image/jpeg;base64,${item.picture}` }}
                  className="w-full h-48"
                  resizeMode="cover"
                />
                <View className="p-4">
                  <View className="flex-row justify-between items-center mb-2">
                    <View className={`px-3 py-1 rounded-full ${item.tag === 'Featured' ? 'bg-blue-50' : item.tag === 'Holiday Special' ? 'bg-orange-50' : 'bg-green-50'}`}>
                      <Text className={`font-rubik-medium text-sm ${item.tag === 'Featured' ? 'text-blue-600' : item.tag === 'Holiday Special' ? 'text-orange-600' : 'text-green-600'}`}>
                        {item.tag || 'Latest Update'}
                      </Text>
                    </View>
                    <Text className="text-gray-500 text-xs">
                      {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text className="text-lg font-rubik-bold text-gray-800 mb-2">
                    {item.title}
                  </Text>
                  <Text className="text-gray-600 text-sm leading-5" numberOfLines={3}>
                    {item.news}
                  </Text>
                  {item.Location && (
                    <View className="flex-row items-center mt-3">
                      <MaterialIcons name="location-on" size={16} color="#6B7280" />
                      <Text className="text-gray-500 text-sm ml-1">{item.Location}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
} 