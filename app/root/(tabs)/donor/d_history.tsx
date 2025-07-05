import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { supabase } from '../../../../constants/supabaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DonationHistory() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('all');
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDonations = async () => {
      setLoading(true);
      const donorId = await AsyncStorage.getItem('userId');
      if (!donorId) {
        setDonations([]);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('donation')
        .select('*')
        .eq('donor_id', donorId)
        .order('Producing', { ascending: false });
      if (!error && data) setDonations(data);
      setLoading(false);
    };
    fetchDonations();
  }, []);

  const getStatus = (status: string | null) => {
    if (!status) return { label: 'Pending', color: '#facc15', icon: 'hourglass-start' };
    if (status === 'delivered the food') return { label: 'Completed', color: '#22c55e', icon: 'check-circle' };
    return { label: 'In Progress', color: '#3b82f6', icon: 'clock' };
  };

  const filteredDonations = activeFilter === 'all' 
    ? donations 
    : donations.filter(d => {
        const statusObj = getStatus(d.status);
        return statusObj.label.toLowerCase().replace(' ', '_') === activeFilter;
      });

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header with Filters */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-xl font-rubik-bold text-gray-800">My Donations</Text>
          <TouchableOpacity 
            className="p-2 rounded-full bg-gray-100"
            onPress={() => router.back()}
          >
            <MaterialIcons name="keyboard-arrow-left" size={24} color="#4B5563" />
          </TouchableOpacity>
        </View>
        {/* Filter Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="flex-row space-x-2"
        >
          {['all', 'completed', 'in_progress', 'pending'].map((filter) => (
            <TouchableOpacity 
              key={filter} 
              onPress={() => setActiveFilter(filter)} 
              className={`px-4 py-2 rounded-full border ${
                activeFilter === filter 
                  ? 'bg-green-50 border-green-500' 
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <Text className={`font-rubik-medium capitalize ${
                activeFilter === filter ? 'text-green-700' : 'text-gray-600'
              }`}>
                {filter.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      {/* Donation List */}
      {loading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#22c55e" /></View>
      ) : (
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="space-y-4">
          {filteredDonations.map((donation) => {
            const statusObj = getStatus(donation.status);
            let images: string[] = [];
            if (donation.Image) {
              try {
                images = typeof donation.Image === 'string' ? JSON.parse(donation.Image) : donation.Image;
                if (!Array.isArray(images)) images = [images];
              } catch {
                images = [donation.Image];
              }
            }
            return (
            <TouchableOpacity 
              key={donation.id}
              className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100"
              onPress={() => router.push({ pathname: './not_dt', params: { donation_id: donation.id } })}
            >
              <View className="flex-row items-center mb-3">
                {images[0] ? (
                  <Image 
                    source={{ uri: images[0].startsWith('data:') ? images[0] : `data:image/jpeg;base64,${images[0]}` }}
                    className="w-16 h-16 rounded-xl"
                  />
                ) : (
                  <View className="w-16 h-16 rounded-xl bg-gray-200 items-center justify-center">
                    <FontAwesome5 name="image" size={24} color="#9ca3af" />
                  </View>
                )}
                <View className="flex-1 ml-3">
                  <Text className="font-rubik-bold text-gray-800">
                    {donation.Location}
                  </Text>
                  <Text className="text-xs font-rubik text-gray-500 mt-1">
                    {donation.Producing ? new Date(donation.Producing).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : ''}
                  </Text>
                </View>
                <View className={`px-3 py-1 rounded-full`} style={{ backgroundColor: statusObj.color }}>
                  <View className="flex-row items-center space-x-1">
                    <FontAwesome5 
                      name={statusObj.icon} 
                      size={12} 
                      color="#fff" 
                      solid 
                    />
                    <Text className={`text-xs font-rubik-medium`} style={{ color: '#fff' }}>
                      {statusObj.label}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity 
                className="flex-row items-center justify-end mt-3"
                onPress={() => router.push({ pathname: './not_dt', params: { donation_id: donation.id } })}
              >
                <Text className="text-green-600 font-rubik-medium mr-1">
                  View Details
                </Text>
                <MaterialIcons name="arrow-forward-ios" size={14} color="#16a34a" />
              </TouchableOpacity>
            </TouchableOpacity>
          )})}
        </View>
      </ScrollView>
      )}

    </View>
  );
}