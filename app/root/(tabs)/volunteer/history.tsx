import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { supabase } from '../../../../constants/supabaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface HistoryItem {
  id: string;
  title: string;
  donorName: string;
  location: string;
  date: string;
  time: string;
  meals: number;
  status: 'completed' | 'ongoing';
  imageUrl?: string;
}

export default function MyTasksScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'completed' | 'ongoing'>('all');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const email = await AsyncStorage.getItem('userEmail');
      console.log('Email from storage:', email);
      if (!email) {
        Alert.alert('Error', 'No email found in storage.');
        return;
      }

      // Get volunteer id
      const { data: volunteerData, error: volunteerError } = await supabase
        .from('volunteer')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      console.log('Volunteer data:', volunteerData);
      console.log('Volunteer error:', volunteerError);

      if (volunteerError || !volunteerData) {
        Alert.alert('Error', 'Failed to fetch volunteer data.');
        return;
      }

      // Fetch donations where this volunteer assisted
      const { data: donations, error: donationsError } = await supabase
        .from('donation')
        .select('id, Details, Quantity, Location, Image, status')
        .eq('volunteer_id', volunteerData.id)
        .order('id', { ascending: false });

      console.log('Donations data:', donations);
      console.log('Donations error:', donationsError);

      if (donationsError) {
        console.error('Donations error details:', donationsError);
        Alert.alert('Error', 'Failed to fetch donation history.');
        return;
      }

      if (donations) {
        const mappedHistory = donations.map((d: any) => {
          // Handle image data
          let imageData = undefined;
          if (d.Image) {
            try {
              const imageArray = JSON.parse(d.Image);
              if (Array.isArray(imageArray) && imageArray.length > 0) {
                imageData = imageArray[0];
              } else {
                imageData = d.Image;
              }
            } catch (e) {
              imageData = d.Image;
            }
          }

          // Map status to our interface
          let mappedStatus: HistoryItem['status'] = 'completed';
          if (d.status === 'delivered the food') {
            mappedStatus = 'completed';
          } else if (d.status === 'on the way to deliver food' || d.status === 'on the way to receive food') {
            mappedStatus = 'completed'; // Treat as completed since it's in progress
          } else {
            mappedStatus = 'ongoing'; // Previously 'cancelled', now 'ongoing'
          }

          // Fallbacks for all fields
          const title = d.Details && d.Details.trim() ? d.Details : 'No title specified';
          const location = d.Location && d.Location.trim() ? d.Location : 'No location specified';
          const meals = d.Quantity && !isNaN(parseInt(d.Quantity)) && parseInt(d.Quantity) > 0 ? parseInt(d.Quantity) : 0;
          const date = '-'; // No created_at
          const time = '-'; // No created_at
          const donorName = d.Name && d.Name.trim() ? d.Name : 'Not specified';

          return {
            id: d.id,
            title,
            donorName,
            location,
            date,
            time,
            meals,
            status: mappedStatus,
            imageUrl: imageData,
          };
        });

        console.log('Mapped history:', mappedHistory);
        setHistory(mappedHistory);
      }
    } catch (error) {
      console.error('Fetch history error:', error);
      Alert.alert('Error', 'Failed to load history.');
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'completed') return item.status === 'completed';
    if (filter === 'ongoing') return item.status === 'ongoing';
    return true;
  });

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white pt-12 pb-4 px-6 shadow-sm">
        <Text className="text-2xl font-rubik-bold text-gray-900">Donation History</Text>
      </View>

      {/* Filters */}
      <View className="flex-row px-6 py-4 bg-white border-b border-gray-200">
        {(['all', 'completed', 'ongoing'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            onPress={() => setFilter(type)}
            className={`flex-1 items-center py-2 border-b-2 ${
              filter === type ? 'border-orange-500' : 'border-transparent'
            }`}
          >
            <Text className={`${
              filter === type ? 'text-orange-500 font-rubik-medium' : 'text-gray-600'
            } capitalize`}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* History List */}
      <ScrollView className="flex-1">
        <View className="p-6">
          {loading ? (
            <View className="items-center justify-center py-12">
              <ActivityIndicator size="large" color="#F97316" />
              <Text className="text-gray-500 mt-4">Loading history...</Text>
            </View>
          ) : filteredHistory.length > 0 ? (
            filteredHistory.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => router.push({
                  pathname: '/root/(tabs)/volunteer/history_details',
                  params: { id: item.id }
                })}
                activeOpacity={0.8}
                className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden border border-gray-100"
              >
                <View className="flex-row">
                  {item.imageUrl ? (
                    <Image
                      source={
                        item.imageUrl.startsWith('data:') 
                          ? { uri: item.imageUrl }
                          : { uri: `data:image/jpeg;base64,${item.imageUrl}` }
                      }
                      className="w-24 h-24"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-24 h-24 bg-gray-200 items-center justify-center">
                      <MaterialIcons name="image" size={32} color="#9CA3AF" />
                    </View>
                  )}
                  <View className="flex-1 p-4">
                    <View className="flex-row justify-between items-start">
                      <Text className="text-gray-900 font-rubik-bold mb-1 flex-1 mr-2">
                        {item.title || 'No title specified'}
                      </Text>
                      <View className={`bg-${item.status === 'completed' ? 'green' : 'orange'}-100 px-2 py-1 rounded-full`}>
                        <Text className={`text-${item.status === 'completed' ? 'green' : 'orange'}-600 text-xs font-rubik-medium capitalize`}>
                          {item.status}
                        </Text>
                      </View>
                    </View>
                    
                    <View className="flex-row items-center mb-2">
                      <MaterialIcons name="business" size={16} color="#6B7280" />
                      <Text className="text-gray-600 text-sm ml-1">{item.donorName || 'Not specified'}</Text>
                    </View>

                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <MaterialIcons name="restaurant" size={16} color="#16A34A" />
                        <Text className="text-green-600 text-sm ml-1">{item.meals > 0 ? `${item.meals} meals` : 'No meals'}</Text>
                      </View>
                      <Text className="text-gray-500 text-sm">{item.date && item.date !== '-' ? item.date : 'Not specified'}</Text>
                    </View>
                    <View className="flex-row items-center mt-1">
                      <MaterialIcons name="location-on" size={16} color="#6B7280" />
                      <Text className="text-gray-600 text-sm ml-1">{item.location || 'No location specified'}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View className="items-center justify-center py-12">
              <MaterialIcons name="history" size={48} color="#9CA3AF" />
              <Text className="text-gray-500 mt-4">No {filter} donations found</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}