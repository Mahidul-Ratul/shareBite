import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { supabase } from '../../../../constants/supabaseConfig';

interface RequestDetails {
  id: string;
  food_type: string;
  quantity: string;
  services: string;
  description: string;
  pickup_address: string;
  created_at: string;
  status: string;
  ngo_id?: string;
}

interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  isread: boolean;
  request_id: string;
  ngo_id?: string;
}

interface ReceiverInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  type: string;
  areas: string;
  image_url?: string;
}

export default function RequestDetails() {
  const router = useRouter();
  const { request_id, from } = useLocalSearchParams();
  const [requestDetails, setRequestDetails] = useState<RequestDetails | null>(null);
  const [receiverInfo, setReceiverInfo] = useState<ReceiverInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [ngoId, setNgoId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequestDetails = async () => {
      if (!request_id) {
        setLoading(false);
        return;
      }

      try {
        // First, get the notification to find the ngo_id
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: notificationData, error: notificationError } = await supabase
          .from('notifications')
          .select('*')
          .eq('request_id', request_id)
          .eq('for', user.email)
          .single();

        if (!notificationError && notificationData) {
          setNgoId(notificationData.ngo_id);
        }

        // Fetch request details
        const { data, error } = await supabase
          .from('request')
          .select('*')
          .eq('id', request_id)
          .single();

        if (error) {
          console.error('Error fetching request details:', error);
        } else {
          setRequestDetails(data);
          
          // Fetch receiver information using ngo_id from notification
          if (notificationData?.ngo_id) {
            const { data: receiverData, error: receiverError } = await supabase
              .from('receiver')
              .select('*')
              .eq('id', notificationData.ngo_id)
              .single();
            
            if (!receiverError && receiverData) {
              setReceiverInfo(receiverData);
            }
          }
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequestDetails();
  }, [request_id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePhoneCall = async (phoneNumber: string) => {
    if (phoneNumber) {
      try {
        await Linking.openURL(`tel:${phoneNumber}`);
      } catch (error) {
        console.error('Error making phone call:', error);
      }
    }
  };

  const handleDonate = async () => {
    // Navigate to location selection page
    router.push({
      pathname: './select_location',
      params: { 
        request_id: request_id as string,
        receiver_id: receiverInfo?.id || '',
        receiver_name: receiverInfo?.name || ''
      }
    });
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!requestDetails) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <Text className="text-gray-600">Request not found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-xl font-rubik-bold text-gray-800">Request Details</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="p-4 space-y-4">
          {/* Status Badge */}
          <View className="bg-white p-4 rounded-xl">
            <View className="flex-row items-center justify-between">
              <Text className="font-rubik-medium text-gray-700">Status</Text>
              <View className={`px-3 py-1 rounded-full ${getStatusColor(requestDetails.status)}`}>
                <Text className={`font-rubik-medium text-sm capitalize`}>
                  {requestDetails.status || 'Pending'}
                </Text>
              </View>
            </View>
          </View>

          {/* Food Type */}
          <View className="bg-white p-4 rounded-xl">
            <View className="flex-row items-center mb-2">
              <FontAwesome5 name="utensils" size={16} color="#6b7280" className="mr-2" />
              <Text className="font-rubik-medium text-gray-700">Food Type</Text>
            </View>
            <Text className="font-rubik text-gray-800 text-lg">{requestDetails.food_type}</Text>
          </View>

          {/* Quantity and Servings */}
          <View className="bg-white p-4 rounded-xl">
            <View className="flex-row items-center mb-3">
              <FontAwesome5 name="weight" size={16} color="#6b7280" className="mr-2" />
              <Text className="font-rubik-medium text-gray-700">Quantity & Servings</Text>
            </View>
            <View className="flex-row space-x-4">
              <View className="flex-1">
                <Text className="text-gray-600 text-sm">Quantity</Text>
                <Text className="font-rubik text-gray-800">{requestDetails.quantity}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-gray-600 text-sm">Servings</Text>
                <Text className="font-rubik text-gray-800">{requestDetails.services}</Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <View className="bg-white p-4 rounded-xl">
            <View className="flex-row items-center mb-2">
              <FontAwesome5 name="info-circle" size={16} color="#6b7280" className="mr-2" />
              <Text className="font-rubik-medium text-gray-700">Description</Text>
            </View>
            <Text className="font-rubik text-gray-800">{requestDetails.description}</Text>
          </View>

          {/* Pickup Address */}
          <View className="bg-white p-4 rounded-xl">
            <View className="flex-row items-center mb-2">
              <FontAwesome5 name="map-marker-alt" size={16} color="#6b7280" className="mr-2" />
              <Text className="font-rubik-medium text-gray-700">Pickup Address</Text>
            </View>
            <Text className="font-rubik text-gray-800">{requestDetails.pickup_address}</Text>
          </View>

          {/* Request Date */}
          <View className="bg-white p-4 rounded-xl">
            <View className="flex-row items-center mb-2">
              <FontAwesome5 name="calendar-alt" size={16} color="#6b7280" className="mr-2" />
              <Text className="font-rubik-medium text-gray-700">Request Date</Text>
            </View>
            <Text className="font-rubik text-gray-800">
              {new Date(requestDetails.created_at).toLocaleDateString()} at{' '}
              {new Date(requestDetails.created_at).toLocaleTimeString()}
            </Text>
          </View>

          {/* Receiver Information */}
          {receiverInfo && (
            <View className="bg-purple-50 p-4 rounded-xl">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-lg font-rubik-bold text-gray-900">Receiver Information</Text>
                <TouchableOpacity onPress={() => handlePhoneCall(receiverInfo.phone)}>
                  <FontAwesome5 name="phone" size={20} color="#9333ea" />
                </TouchableOpacity>
              </View>
              <View className="space-y-3">
                <View className="flex-row items-center">
                  <FontAwesome5 name="building" size={16} color="#9333ea" />
                  <View className="ml-3">
                    <Text className="text-gray-900 font-rubik-medium">{receiverInfo.name}</Text>
                    <Text className="text-gray-600 text-sm mt-1">{receiverInfo.type}</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  className="flex-row items-center"
                  onPress={() => handlePhoneCall(receiverInfo.phone)}
                >
                  <FontAwesome5 name="phone" size={16} color="#9333ea" />
                  <Text className="text-purple-600 ml-3 underline font-rubik">
                    {receiverInfo.phone}
                  </Text>
                </TouchableOpacity>
                <View className="flex-row items-center">
                  <FontAwesome5 name="envelope" size={16} color="#9333ea" />
                  <Text className="text-gray-600 ml-3 font-rubik">{receiverInfo.email}</Text>
                </View>
                <View className="flex-row items-center">
                  <FontAwesome5 name="map-marker-alt" size={16} color="#9333ea" />
                  <Text className="text-gray-600 ml-3 font-rubik">{receiverInfo.location}</Text>
                </View>
                <View className="flex-row items-center">
                  <FontAwesome5 name="users" size={16} color="#9333ea" />
                  <Text className="text-gray-600 ml-3 font-rubik">{receiverInfo.areas}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View className="space-y-3 pt-4">
            {from !== 'admin' && (
              <TouchableOpacity 
                className="bg-orange-500 py-4 rounded-xl items-center"
                onPress={handleDonate}
              >
                <Text className="text-white font-rubik-bold text-lg">Donate</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              className="bg-gray-200 py-4 rounded-xl items-center"
              onPress={() => router.back()}
            >
              <Text className="text-gray-700 font-rubik-bold text-lg">Back to Notifications</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
} 