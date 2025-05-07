import React, { useEffect, useState } from 'react';
import { View, ScrollView, TextInput, Image, Text, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../../../../constants/supabaseConfig';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const ManageDonations = () => {
  const [donations, setDonations] = useState<{ 
    id: number; 
    Name?: string; 
    Location?: string; 
    Image?: string; 
    Details?: string; 
    Types?: string; 
    Quantity?: number; 
    Instructions?: string; 
    Contact?: string; 
    Producing?: string; 
    Lasting?: string; 
    status?: string;
  }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  // Fetch donations from the "donation" table
  const fetchDonations = async () => {
    try {
      const { data, error } = await supabase.from('donation').select('*');
      if (error) throw error;
      setDonations(data || []);
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  // Filter donations based on the search query
  const filteredDonations = donations.filter(
    (donation) =>
      donation.Name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      donation.Location?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  type Donation = {
    id: number; // Changed to match the type in donations array
    Name?: string;
    Location?: string;
    Image?: string;
    Details?: string;
    Types?: string;
    Quantity?: number; // Changed to match the type in donations array
    Instructions?: string;
    Contact?: string;
    Producing?: string;
    Lasting?: string;
    status?: string;
  };
  const renderDonationItem = (donation: Donation) => (
    <TouchableOpacity
      key={donation.id}
      className="bg-white rounded-2xl mb-4 shadow-sm border border-gray-100"
      onPress={() => router.push({
        pathname: "/root/(tabs)/admin/donation-detail",
        params: donation
      })}
    >
      <View className="p-4">
        <View className="flex-row items-center">
          {donation.Image ? (
            <Image
              source={{ uri: donation.Image }}
              className="w-20 h-20 rounded-xl"
              resizeMode="cover"
            />
          ) : (
            <View className="w-20 h-20 rounded-xl bg-indigo-50 items-center justify-center">
              <MaterialIcons name="fastfood" size={28} color="#6366f1" />
            </View>
          )}
          
          <View className="flex-1 ml-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-900 font-bold text-lg">{donation.Name || 'N/A'}</Text>
              <View className={`px-3 py-1 rounded-full ${
                donation.status === 'pending' ? 'bg-yellow-100' :
                donation.status === 'approved' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <Text className={`text-xs font-medium ${
                  donation.status === 'pending' ? 'text-yellow-800' :
                  donation.status === 'approved' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {donation.status?.toUpperCase() || 'PENDING'}
                </Text>
              </View>
            </View>
            
            <View className="flex-row items-center mt-2">
              <MaterialIcons name="location-on" size={16} color="#6366f1" />
              <Text className="text-gray-500 ml-1 text-sm flex-1">{donation.Location || 'N/A'}</Text>
            </View>
            
            <View className="flex-row items-center justify-between mt-2">
              <View className="flex-row items-center">
                <MaterialIcons name="access-time" size={16} color="#6366f1" />
                <Text className="text-gray-500 ml-1 text-sm">
                  {donation.Producing ? new Date(donation.Producing).toLocaleDateString() : 'N/A'}
                </Text>
              </View>
              <View className="flex-row items-center">
                <MaterialIcons name="inventory" size={16} color="#6366f1" />
                <Text className="text-gray-500 ml-1 text-sm">{donation.Quantity} items</Text>
              </View>
            </View>
          </View>
        </View>

        <View className="flex-row mt-4 pt-4 border-t border-gray-100">
          <View className="flex-row items-center flex-1">
            <MaterialIcons name="category" size={16} color="#6366f1" />
            <Text className="text-gray-600 ml-1 text-sm">{donation.Types}</Text>
          </View>
          <TouchableOpacity 
            className="flex-row items-center bg-indigo-50 px-4 py-2 rounded-lg"
            onPress={() => router.push({
              pathname: "/root/(tabs)/admin/donation-detail",
              params: donation
            })}
          >
            <MaterialIcons name="visibility" size={16} color="#6366f1" />
            <Text className="text-indigo-600 ml-1 text-sm font-medium">View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <LinearGradient
        colors={['#4f46e5', '#6366f1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="pt-12 pb-24 rounded-b-[32px]"
      >
        <View className="px-6">
          <View className="flex-row justify-between items-center mb-8">
            <View>
              <Text className="text-white/80 text-sm font-medium">Manage and track</Text>
              <Text className="text-white text-2xl font-bold mt-1">Available Donations</Text>
            </View>
            <TouchableOpacity 
              className="bg-white/20 p-3 rounded-full"
              onPress={fetchDonations}
            >
              <MaterialIcons name="refresh" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center bg-white/10 rounded-xl p-3 mb-4">
            <MaterialIcons name="search" size={24} color="#fff" />
            <TextInput
              className="flex-1 ml-3 text-base text-white font-medium"
              placeholder="Search by name or location..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View className="flex-row justify-between">
            <View className="flex-row items-center bg-white/10 px-4 py-2 rounded-xl">
              <MaterialIcons name="ballot" size={20} color="#fff" />
              <Text className="text-white ml-2">{donations.length} Total</Text>
            </View>
            <View className="flex-row space-x-2">
              <TouchableOpacity className="bg-white/10 px-4 py-2 rounded-xl">
                <Text className="text-white">All</Text>
              </TouchableOpacity>
              <TouchableOpacity className="bg-white/10 px-4 py-2 rounded-xl">
                <Text className="text-white">Pending</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        className="flex-1 px-6" 
        style={{ marginTop: -64 }}
        showsVerticalScrollIndicator={false}
      >
        {filteredDonations.length > 0 ? (
          <View className="pt-2">
            {filteredDonations.map(renderDonationItem)}
          </View>
        ) : (
          <View className="items-center justify-center py-12 bg-white rounded-2xl">
            <MaterialIcons name="search-off" size={48} color="#94a3b8" />
            <Text className="text-gray-500 text-lg mt-4">No donations found</Text>
            <TouchableOpacity 
              className="mt-4 bg-indigo-50 px-4 py-2 rounded-lg"
              onPress={fetchDonations}
            >
              <Text className="text-indigo-600">Refresh List</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default ManageDonations;