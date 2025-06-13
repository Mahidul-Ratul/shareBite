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
      {/* Bottom Navigation */}
      <View className="flex-row justify-between items-center bg-white py-3 px-6 border-t border-gray-200">
        <Link href="./desh" asChild>
          <TouchableOpacity className="items-center flex-1">
            <FontAwesome5 name="home" size={24} color="#6B7280" />
            <Text className="text-gray-600 text-xs mt-1 font-rubik-medium">Home</Text>
          </TouchableOpacity>
        </Link>
        <Link href="./news" asChild>
          <TouchableOpacity className="items-center flex-1">
            <FontAwesome5 name="newspaper" size={24} color="#6B7280" />
            <Text className="text-gray-600 text-xs mt-1 font-rubik-medium">News</Text>
          </TouchableOpacity>
        </Link>
        <Link href=".././Donate" asChild>
          <TouchableOpacity className="items-center flex-1">
            <View className="bg-orange-500 p-3 rounded-full -mt-8 border-4 border-white shadow-lg">
              <FontAwesome5 name="plus" size={24} color="white" />
            </View>
            <Text className="text-gray-600 text-xs mt-1 font-rubik-medium">Donate</Text>
          </TouchableOpacity>
        </Link>
        <Link href="./notifications" asChild>
          <TouchableOpacity className="items-center flex-1">
            <View className="relative">
              <Ionicons name="notifications-outline" size={24} color="#6B7280" />
              <View className="absolute -top-1 -right-1 bg-orange-500 w-4 h-4 rounded-full items-center justify-center">
                <Text className="text-white text-xs font-rubik-bold">2</Text>
              </View>
            </View>
            <Text className="text-gray-600 text-xs mt-1 font-rubik-medium">Alerts</Text>
          </TouchableOpacity>
        </Link>
        <Link href="./d_history" asChild>
          <TouchableOpacity className="items-center flex-1">
            <FontAwesome5 name="history" size={24} color="#F97316" />
            <Text className="text-orange-500 text-xs mt-1 font-rubik-medium">History</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}