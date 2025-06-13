import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, Link } from "expo-router";
import { supabase } from '../../../../constants/supabaseConfig';

export default function NotificationDetail() {
  const router = useRouter();
  const { donation_id } = useLocalSearchParams();
  const [donation, setDonation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [receiver, setReceiver] = useState<any>(null);

  useEffect(() => {
    const fetchDonation = async () => {
      setLoading(true);
      if (!donation_id) return;
      const { data, error } = await supabase
        .from('donation')
        .select('*')
        .eq('id', donation_id)
        .single();
      if (!error && data) {
        setDonation(data);
        if (data.ngo_id) {
          const { data: recData } = await supabase
            .from('receiver')
            .select('*')
            .eq('id', data.ngo_id)
            .single();
          setReceiver(recData);
        }
      }
      setLoading(false);
    };
    fetchDonation();
  }, [donation_id]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
      case 'delivered the food':
        return 'bg-green-500';
      case 'in_progress':
      case 'on the way to receive food':
      case 'on the way to deliver food':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Parse images and types
  let images: string[] = [];
  if (donation?.Image) {
    images = typeof donation.Image === 'string' ? donation.Image.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
  }
  let types: string[] = [];
  if (donation?.Types) {
    types = typeof donation.Types === 'string' ? donation.Types.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
  }

  // Timeline events with thoughtful design and all possible statuses
  const STATUS_STAGES = [
    { key: 'pending', label: 'Donation Posted', description: 'You posted a new donation request.' },
    { key: 'approved', label: 'Donation Approved', description: 'Your donation was approved by admin.' },
    { key: 'approvedF', label: 'Ready for Assignment', description: 'Donation is ready to be assigned to a volunteer or NGO.' },
    { key: 'volunteer is assigned', label: 'Volunteer Assigned', description: 'A volunteer has been assigned to collect your donation.' },
    { key: 'on the way to receive food', label: 'Volunteer On The Way', description: 'Volunteer is on the way to collect your donation.' },
    { key: 'food collected', label: 'Food Collected', description: 'The food has been collected by the volunteer.' },
    { key: 'on the way to deliver food', label: 'On The Way To Receiver', description: 'Volunteer is delivering the food to the receiver.' },
    { key: 'delivered the food', label: 'Donation Delivered', description: 'Your donation has been delivered to the receiver.' },
  ];

  // Find the current status index
  const currentStatusIndex = STATUS_STAGES.findIndex(s => s.key === donation?.status);

  // Status banner design
  const getStatusBanner = () => {
    if (!donation?.status) return null;
    const statusObj = STATUS_STAGES.find(s => s.key === donation.status);
    let color = '#fbbf24', bg = 'bg-yellow-100', icon = 'hourglass-empty', textColor = 'text-yellow-800';
    switch (donation.status) {
      case 'pending':
        color = '#fbbf24'; bg = 'bg-yellow-100'; icon = 'hourglass-empty'; textColor = 'text-yellow-800'; break;
      case 'approved':
        color = '#6366f1'; bg = 'bg-indigo-100'; icon = 'check-circle'; textColor = 'text-indigo-800'; break;
      case 'approvedF':
        color = '#16a34a'; bg = 'bg-green-100'; icon = 'assignment-turned-in'; textColor = 'text-green-800'; break;
      case 'volunteer is assigned':
        color = '#3b82f6'; bg = 'bg-blue-100'; icon = 'person'; textColor = 'text-blue-800'; break;
      case 'on the way to receive food':
        color = '#f59e42'; bg = 'bg-orange-100'; icon = 'directions-run'; textColor = 'text-orange-800'; break;
      case 'food collected':
        color = '#f97316'; bg = 'bg-orange-200'; icon = 'restaurant'; textColor = 'text-orange-900'; break;
      case 'on the way to deliver food':
        color = '#6366f1'; bg = 'bg-indigo-100'; icon = 'local-shipping'; textColor = 'text-indigo-800'; break;
      case 'delivered the food':
        color = '#16a34a'; bg = 'bg-green-100'; icon = 'check-circle'; textColor = 'text-green-800'; break;
      default:
        color = '#9ca3af'; bg = 'bg-gray-100'; icon = 'info'; textColor = 'text-gray-700'; break;
    }
    return (
      <View className={`flex-row items-center rounded-xl px-4 py-3 mb-4 shadow ${bg}`}
        style={{ alignSelf: 'center', marginTop: 16, marginBottom: 16 }}>
        <MaterialIcons name={icon as any} size={28} color={color} />
        <Text className={`ml-4 font-bold text-lg ${textColor}`}>{statusObj?.label || donation.status}</Text>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="p-2 rounded-full bg-gray-100 mr-3"
          >
            <MaterialIcons name="arrow-back" size={24} color="#4B5563" />
          </TouchableOpacity>
          <Text className="text-xl font-rubik-bold text-gray-800">
            Notification Details
          </Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : donation ? (
        <ScrollView className="flex-1 p-4">
          {getStatusBanner()}
          {/* Notification Card */}
          <View className={`bg-white rounded-xl p-4 mb-4 border border-gray-100 ${donation.status === 'pending' ? 'bg-orange-50 border-orange-200' : ''}`}>
            <Text className="text-xl font-rubik-bold text-gray-800">
              {donation.Details}
            </Text>
            <Text className="text-gray-600 mt-2">
              Status: {donation.status}
            </Text>
            <Text className="text-gray-400 text-sm mt-2">
              {donation.Producing ? new Date(donation.Producing).toLocaleString() : ''}
            </Text>
          </View>

          {/* Organization Info */}
          {receiver && (
            <View className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
              <Text className="font-rubik-bold text-gray-800 mb-3">Organization</Text>
              <View className="flex-row items-center">
                {receiver.image_url ? (
                  <Image 
                    source={{ uri: receiver.image_url }}
                    className="w-12 h-12 rounded-full"
                  />
                ) : null}
                <Text className="ml-3 font-rubik-medium text-gray-700">
                  {receiver.name}
                </Text>
              </View>
            </View>
          )}

          {/* Donated Items */}
          <View className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
            <Text className="font-rubik-bold text-gray-800 mb-3">Donated Items</Text>
            {types.length > 0 ? types.map((item, index) => (
              <View key={index} className="flex-row items-center mb-2">
                <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                <Text className="text-gray-600">
                  {item}
                </Text>
              </View>
            )) : <Text className="text-gray-500">No items listed.</Text>}
          </View>

          {/* Timeline */}
          <View className="bg-white rounded-xl p-4 border border-gray-100">
            <Text className="font-rubik-bold text-gray-800 mb-3">Timeline</Text>
            {STATUS_STAGES.map((stage, index) => {
              const isCompleted = index < currentStatusIndex;
              const isCurrent = index === currentStatusIndex;
              return (
                <View key={stage.key} className="flex-row mb-4 last:mb-0 items-center">
                  <View className="items-center mr-4">
                    <View className={`w-4 h-4 rounded-full ${isCompleted ? 'bg-green-500' : isCurrent ? 'bg-blue-500' : 'bg-gray-300'} border-2 border-white shadow`} />
                    {index !== STATUS_STAGES.length - 1 && (
                      <View className={`w-0.5 h-8 ${isCompleted ? 'bg-green-200' : isCurrent ? 'bg-blue-200' : 'bg-gray-200'} my-1`} />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className={`font-rubik-medium text-base ${isCompleted ? 'text-green-700' : isCurrent ? 'text-blue-700' : 'text-gray-400'}`}>{stage.label}</Text>
                    <Text className={`text-sm ${isCompleted ? 'text-green-600' : isCurrent ? 'text-blue-600' : 'text-gray-400'}`}>{stage.description}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-400">Donation not found.</Text>
        </View>
      )}

      {/* Add Bottom Navigation */}
      <View className="flex-row justify-between items-center bg-white py-3 px-6 border-t border-gray-200">
        <Link href="./desh" asChild>
          <TouchableOpacity className="items-center flex-1">
            <FontAwesome5 name="home" size={24} color="#6B7280" />
            <Text className="text-gray-600 text-xs mt-1 font-rubik-medium">Home</Text>
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

        <Link href="./notification" asChild>
          <TouchableOpacity className="items-center flex-1">
            <Ionicons name="notifications" size={24} color="#F97316" />
            <Text className="text-orange-500 text-xs mt-1 font-rubik-medium">Notifications</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}