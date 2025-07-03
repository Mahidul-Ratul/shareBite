import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../../constants/supabaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface HistoryDetails {
  id: string;
  title: string;
  donorName: string;
  donorAddress: string;
  recipientName: string;
  recipientAddress: string;
  date: string;
  startTime: string;
  endTime: string;
  meals: number;
  status: 'completed' | 'cancelled' | 'delivered the food' | 'on the way to deliver food' | 'on the way to receive food';
  notes: string;
  images: string[];
  rating?: number;
  feedback?: string;
}

export default function HistoryDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [details, setDetails] = useState<HistoryDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchHistoryDetails();
    }
  }, [id]);

  const fetchReceiverAddress = async (ngo_id: string): Promise<string> => {
    try {
      console.log('fetchReceiverAddress called with ngo_id:', ngo_id);
      // Fetch receiver row
      const { data: receiver, error: receiverError } = await supabase
        .from('receiver')
        .select('location')
        .eq('id', ngo_id)
        .maybeSingle();
      if (receiverError || !receiver || !receiver.location) {
        console.log('No receiver data found:', { receiverError, receiver });
        return 'No receiver address available';
      }
      console.log('Raw receiver location:', receiver.location);
      const loc = receiver.location.trim();
      console.log('Trimmed location:', loc);
      
      // First, try to parse as JSON (for {"latitude":x,"longitude":y} format)
      try {
        const jsonLocation = JSON.parse(loc);
        if (jsonLocation.latitude && jsonLocation.longitude) {
          console.log('Location is JSON with lat/lng, calling OpenCage API');
          const apiKey = 'ceea64097b1646c4b18647701f0a60dc';
          const url = `https://api.opencagedata.com/geocode/v1/json?q=${jsonLocation.latitude}+${jsonLocation.longitude}&key=${apiKey}`;
          console.log('OpenCage URL:', url);
          const response = await fetch(url);
          const data = await response.json();
          console.log('OpenCage response:', data);
          if (data && data.results && data.results.length > 0) {
            const formattedAddress = data.results[0].formatted;
            console.log('Formatted address from OpenCage:', formattedAddress);
            return formattedAddress;
          } else {
            console.log('No results from OpenCage API');
            return 'No receiver address available';
          }
        }
      } catch (jsonError) {
        // Not JSON, continue with other checks
        console.log('Not JSON format, checking other formats');
      }
      
      // Check if it's a lat,long string
      const latLngMatch = loc.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
      console.log('LatLng match result:', latLngMatch);
      if (latLngMatch) {
        // It's lat,long, call OpenCage
        console.log('Location is lat,long, calling OpenCage API');
        const [lat, lng] = loc.split(',').map((v: string) => v.trim());
        const apiKey = 'ceea64097b1646c4b18647701f0a60dc';
        const url = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${apiKey}`;
        console.log('OpenCage URL:', url);
        const response = await fetch(url);
        const data = await response.json();
        console.log('OpenCage response:', data);
        if (data && data.results && data.results.length > 0) {
          const formattedAddress = data.results[0].formatted;
          console.log('Formatted address from OpenCage:', formattedAddress);
          return formattedAddress;
        } else {
          console.log('No results from OpenCage API');
          return 'No receiver address available';
        }
      } else {
        // It's a human-readable address
        console.log('Location is human-readable address:', loc);
        return loc;
      }
    } catch (e) {
      console.log('Error in fetchReceiverAddress:', e);
      return 'No receiver address available';
    }
  };

  const fetchHistoryDetails = async () => {
    try {
      setLoading(true);
      const email = await AsyncStorage.getItem('userEmail');
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

      if (volunteerError || !volunteerData) {
        Alert.alert('Error', 'Failed to fetch volunteer data.');
        return;
      }

      // Fetch specific donation details
      const { data: donation, error: donationError } = await supabase
        .from('donation')
        .select('*')
        .eq('id', id)
        .eq('volunteer_id', volunteerData.id)
        .single();

      if (donationError || !donation) {
        Alert.alert('Error', 'Donation not found or access denied.');
        return;
      }

      console.log('Full donation object:', donation);

      // Fetch receiver address if ngo_id exists
      let receiverAddr = 'No receiver address available';
      if (donation.ngo_id) {
        console.log('Fetching receiver address for ngo_id:', donation.ngo_id);
        receiverAddr = await fetchReceiverAddress(donation.ngo_id);
        console.log('Fetched receiver address:', receiverAddr);
      }

      // Process images
      let images: string[] = [];
      if (donation.Image) {
        try {
          const imageArray = JSON.parse(donation.Image);
          if (Array.isArray(imageArray)) {
            images = imageArray;
          } else {
            images = [donation.Image];
          }
        } catch (e) {
          images = [donation.Image];
        }
      }

      // Map status
      let mappedStatus: HistoryDetails['status'] = 'completed';
      if (donation.status === 'delivered the food') {
        mappedStatus = 'completed';
      } else if (donation.status === 'on the way to deliver food' || donation.status === 'on the way to receive food') {
        mappedStatus = 'completed';
      } else {
        mappedStatus = 'cancelled';
      }

      const historyDetails: HistoryDetails = {
        id: donation.id,
        title: donation.Details || 'Donation',
        donorName: 'Donor', // We don't have donor name in current schema
        donorAddress: donation.Location || 'Location not specified',
        recipientName: 'Recipient', // We don't have recipient name in current schema
        recipientAddress: receiverAddr,
        date: '-', // No created_at field
        startTime: '-',
        endTime: '-',
        meals: parseInt(donation.Quantity) || 0,
        status: mappedStatus,
        notes: `Status: ${donation.status || 'Unknown'}. Location: ${donation.Location || 'Not specified'}. Quantity: ${donation.Quantity || '0'} meals.`,
        images: images,
        rating: 5, // Default rating since we don't have this in schema
        feedback: 'Thank you for your service!', // Default feedback
      };

      console.log('Final historyDetails.recipientAddress:', historyDetails.recipientAddress);
      setDetails(historyDetails);
    } catch (error) {
      console.error('Fetch history details error:', error);
      Alert.alert('Error', 'Failed to load donation details.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <Text className="text-gray-600">Loading details...</Text>
      </View>
    );
  }

  if (!details) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <Text className="text-gray-600">Donation not found</Text>
      </View>
    );
  }

  console.log('Rendering with details.recipientAddress:', details.recipientAddress);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white pt-12 pb-4 px-6 shadow-sm">
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="mr-4"
          >
            <MaterialIcons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-rubik-bold text-gray-900">Delivery Details</Text>
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* Images */}
        {details.images.length > 0 && (
          <ScrollView 
            horizontal 
            pagingEnabled 
            className="h-48 bg-gray-100"
          >
            {details.images.map((image, index) => (
              <Image 
                key={index}
                source={
                  image.startsWith('data:') 
                    ? { uri: image }
                    : { uri: `data:image/jpeg;base64,${image}` }
                }
                className="w-screen h-48"
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        )}

        <View className="p-6">
          {/* Basic Info */}
          <View className="bg-white rounded-xl p-4 mb-4">
            <View className="flex-row justify-between items-start mb-4">
              <Text className="text-xl font-rubik-bold text-gray-900 flex-1 mr-2">
                {details.donorAddress && details.donorAddress !== 'No location specified'
                  ? details.donorAddress
                  : details.donorName && details.donorName !== 'Not specified'
                    ? details.donorName
                    : 'Donation Details'}
              </Text>
              <View className={`bg-${details.status === 'completed' ? 'green' : 'red'}-100 px-3 py-1 rounded-full`}>
                <Text className={`text-${details.status === 'completed' ? 'green' : 'red'}-600 text-xs font-rubik-medium capitalize`}>
                  {details.status}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center mb-2">
              <MaterialIcons name="schedule" size={16} color="#6B7280" />
              <Text className="text-gray-600 ml-2">
                {details.meals > 0 ? `${details.meals} meals` : details.type && details.type !== 'Not specified' ? details.type : 'Not specified'}
              </Text>
            </View>
          </View>

          {/* Locations */}
          <View className="bg-white rounded-xl p-4 mb-4">
            <Text className="font-rubik-bold text-gray-900 mb-3">Pickup & Delivery</Text>
            
            <View className="mb-4">
              <Text className="text-gray-600 mb-1">From:</Text>
              <View className="flex-row items-start">
                <MaterialIcons name="location-on" size={20} color="#16A34A" />
                <View className="flex-1 ml-2">
                  <Text className="text-gray-900 font-rubik-medium">{details.donorName}</Text>
                  <Text className="text-gray-600">{details.donorAddress}</Text>
                </View>
              </View>
            </View>

            <View>
              <Text className="text-gray-600 mb-1">To:</Text>
              <View className="flex-row items-start">
                <MaterialIcons name="flag" size={20} color="#DC2626" />
                <View className="flex-1 ml-2">
                  <Text className="text-gray-900 font-rubik-medium">{details.recipientName}</Text>
                  <Text className="text-gray-600">{details.recipientAddress}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Notes */}
          {details.notes && (
            <View className="bg-white rounded-xl p-4 mb-4">
              <Text className="font-rubik-bold text-gray-900 mb-2">Delivery Notes</Text>
              <Text className="text-gray-600">{details.notes}</Text>
            </View>
          )}

          {/* Feedback */}
          {details.rating && (
            <View className="bg-white rounded-xl p-4">
              <Text className="font-rubik-bold text-gray-900 mb-2">Feedback</Text>
              <View className="flex-row mb-2">
                {[...Array(5)].map((_, i) => (
                  <MaterialIcons 
                    key={i}
                    name="star"
                    size={20}
                    color={i < details.rating! ? '#F59E0B' : '#D1D5DB'}
                  />
                ))}
              </View>
              {details.feedback && (
                <Text className="text-gray-600">{details.feedback}</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}