import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../../constants/supabaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapView, { Marker } from 'react-native-maps';

interface DonationDetails {
  id: string;
  title: string;
  description: string;
  donorName: string;
  location: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  meals: number;
  pickupTime: string;
  expiryTime: string;
  status: string;
  requirements: string[];
  images: string[];
}

export default function DonationDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<DonationDetails | null>(null);

  useEffect(() => {
    fetchDonationDetails();
  }, [id]);

  const fetchDonationDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setDetails(data);
    } catch (error) {
      console.error('Error fetching donation details:', error);
      Alert.alert('Error', 'Failed to load donation details');
    }
  };

  const handleAccept = async () => {
    setLoading(true);
    try {
      // Check if still available
      const { data, error } = await supabase
        .from('donations')
        .select('status')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data.status !== 'available') {
        Alert.alert('Sorry', 'This donation is no longer available');
        router.back();
        return;
      }

      const email = await AsyncStorage.getItem('userEmail');
      
      // Update donation status
      const { error: updateError } = await supabase
        .from('donations')
        .update({ 
          status: 'assigned',
          assigned_volunteer: email
        })
        .eq('id', id);

      if (updateError) throw updateError;

      Alert.alert('Success', 'Donation accepted successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to accept donation');
    } finally {
      setLoading(false);
    }
  };

  if (!details) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView>
        {/* Header with back button */}
        <View className="bg-white pt-12 pb-4 px-6 shadow-sm">
          <View className="flex-row items-center">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="mr-4"
            >
              <MaterialIcons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="text-xl font-rubik-bold text-gray-900">Donation Details</Text>
          </View>
        </View>

        {/* Images */}
        {details.images && details.images.length > 0 && (
          <ScrollView 
            horizontal 
            pagingEnabled 
            className="h-64"
          >
            {details.images.map((image, index) => (
              <Image 
                key={index}
                source={{ uri: image }}
                className="w-screen h-64"
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        )}

        <View className="p-6">
          {/* Basic Info */}
          <View className="bg-white rounded-xl p-4 mb-4">
            <Text className="text-2xl font-rubik-bold text-gray-900 mb-2">
              {details.title}
            </Text>
            <Text className="text-gray-600 mb-4">{details.description}</Text>
            
            <View className="flex-row items-center mb-3">
              <MaterialIcons name="person" size={20} color="#6B7280" />
              <Text className="text-gray-700 ml-2">{details.donorName}</Text>
            </View>
            
            <View className="flex-row items-center mb-3">
              <MaterialIcons name="restaurant" size={20} color="#16A34A" />
              <Text className="text-green-600 ml-2">{details.meals} meals available</Text>
            </View>
          </View>

          {/* Location */}
          <View className="bg-white rounded-xl p-4 mb-4">
            <Text className="font-rubik-bold text-gray-900 mb-3">Location</Text>
            <MapView
              className="w-full h-40 rounded-xl mb-3"
              initialRegion={{
                ...details.coordinates,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker coordinate={details.coordinates} />
            </MapView>
            <Text className="text-gray-600">{details.location}</Text>
          </View>

          {/* Timing */}
          <View className="bg-white rounded-xl p-4 mb-4">
            <Text className="font-rubik-bold text-gray-900 mb-3">Timing</Text>
            <View className="flex-row justify-between items-center mb-2">
              <View className="flex-row items-center">
                <MaterialIcons name="access-time" size={20} color="#6B7280" />
                <Text className="text-gray-600 ml-2">Pickup Time</Text>
              </View>
              <Text className="text-gray-900">{details.pickupTime}</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <MaterialIcons name="timer-off" size={20} color="#DC2626" />
                <Text className="text-gray-600 ml-2">Expiry Time</Text>
              </View>
              <Text className="text-red-600">{details.expiryTime}</Text>
            </View>
          </View>

          {/* Requirements */}
          <View className="bg-white rounded-xl p-4 mb-6">
            <Text className="font-rubik-bold text-gray-900 mb-3">Requirements</Text>
            {details.requirements.map((req, index) => (
              <View key={index} className="flex-row items-center mb-2">
                <MaterialIcons name="check-circle" size={20} color="#16A34A" />
                <Text className="text-gray-600 ml-2">{req}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View className="bg-white px-6 py-4 border-t border-gray-200">
        <View className="flex-row space-x-4">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="flex-1 py-3 border border-gray-300 rounded-xl"
          >
            <Text className="text-gray-700 text-center font-rubik-medium">Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleAccept}
            disabled={loading}
            className="flex-1 py-3 bg-green-500 rounded-xl"
          >
            <Text className="text-white text-center font-rubik-medium">
              {loading ? 'Accepting...' : 'Accept'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}