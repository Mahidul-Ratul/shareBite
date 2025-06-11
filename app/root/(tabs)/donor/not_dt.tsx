import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, Link } from "expo-router";

interface TimelineEvent {
  title: string;
  time: string;
  date: string;
  description: string;
  status?: 'completed' | 'pending' | 'in_progress';
}

interface DonationItem {
  name: string;
  quantity: string;
}

interface NotificationDetails {
  id: string;
  type: 'accepted' | 'pickup' | 'completed' | 'cancelled';
  title: string;
  message: string;
  timestamp: string;
  isread?: boolean;
  details: {
    organizationName: string;
    organizationImage: any;
    items: DonationItem[];
    timeline: TimelineEvent[];
    volunteer?: {
      name: string;
      phone: string;
      image: any;
    };
  };
}

export default function NotificationDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  // Ensure id is always a string
  const notification: NotificationDetails = {
    id: Array.isArray(id) ? id[0] : id ?? '',
    type: 'accepted',
    title: 'Donation Request Accepted',
    message: 'Food Bank Bangladesh has accepted your donation request',
    timestamp: '2024-04-27T10:30:00Z',
    details: {
      organizationName: 'Food Bank Bangladesh',
      organizationImage: require('@/assets/images/ngo.jpg'),
      items: [
        { name: 'Rice', quantity: '10 kg' },
        { name: 'Dal', quantity: '5 kg' }
      ],
      volunteer: {
        name: 'Abdul Karim',
        phone: '+880 1712345678',
        image: require('@/assets/images/hasi.jpg')
      },
      timeline: [
        {
          title: 'Donation Posted',
          time: '10:00 AM',
          date: 'April 27, 2024',
          description: 'You posted a new donation request',
          status: 'completed'
        },
        {
          title: 'Request Accepted',
          time: '10:30 AM',
          date: 'April 27, 2024',
          description: 'Food Bank Bangladesh has accepted your donation',
          status: 'completed'
        },
        {
          title: 'Volunteer Assigned',
          time: '10:35 AM',
          date: 'April 27, 2024',
          description: 'Abdul Karim has been assigned to collect your donation',
          status: 'in_progress'
        },
        {
          title: 'Pickup Scheduled',
          time: '11:00 AM',
          date: 'April 27, 2024',
          description: 'Volunteer will arrive for pickup',
          status: 'pending'
        }
      ]
    },
    isread: false // Add default read status
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
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

      <ScrollView className="flex-1 p-4">
        <View className={`bg-white rounded-xl p-4 mb-4 border border-gray-100 ${notification.isread ? '' : 'bg-orange-50 border-orange-200'}`}>
          <Text className="text-xl font-rubik-bold text-gray-800">
            {notification.title}
          </Text>
          <Text className="text-gray-600 mt-2">
            {notification.message}
          </Text>
          <Text className="text-gray-400 text-sm mt-2">
            {new Date(notification.timestamp).toLocaleString()}
          </Text>
        </View>

        {/* Organization Info */}
        <View className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
          <Text className="font-rubik-bold text-gray-800 mb-3">Organization</Text>
          <View className="flex-row items-center">
            <Image 
              source={notification.details.organizationImage}
              className="w-12 h-12 rounded-full"
            />
            <Text className="ml-3 font-rubik-medium text-gray-700">
              {notification.details.organizationName}
            </Text>
          </View>
        </View>

        {/* Donated Items */}
        <View className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
          <Text className="font-rubik-bold text-gray-800 mb-3">Donated Items</Text>
          {notification.details.items.map((item, index) => (
            <View key={index} className="flex-row items-center mb-2">
              <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
              <Text className="text-gray-600">
                {item.quantity} {item.name}
              </Text>
            </View>
          ))}
        </View>

        {/* Timeline */}
        <View className="bg-white rounded-xl p-4 border border-gray-100">
          <Text className="font-rubik-bold text-gray-800 mb-3">Timeline</Text>
          {notification.details.timeline.map((event, index) => (
            <View key={index} className="flex-row mb-4 last:mb-0">
              <View className="items-center mr-4">
                <View className={`w-3 h-3 rounded-full ${getStatusColor(event.status)}`} />
                {index !== notification.details.timeline.length - 1 && (
                  <View className="w-0.5 h-full bg-green-200 my-1" />
                )}
              </View>
              <View className="flex-1">
                <Text className="font-rubik-medium text-gray-800">
                  {event.title}
                </Text>
                <Text className="text-gray-600 text-sm">
                  {event.description}
                </Text>
                <Text className="text-gray-400 text-xs mt-1">
                  {event.time} • {event.date}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Accept/Reject Buttons */}
        {notification.type === 'accepted' && !notification.isread && (
          <View className="flex-row justify-center mt-6 space-x-4">
            <TouchableOpacity
              className="bg-green-500 px-6 py-3 rounded-lg"
              onPress={() => {/* handle accept logic here */}}
            >
              <Text className="text-white font-bold">Accept Collection</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-red-500 px-6 py-3 rounded-lg"
              onPress={() => {/* handle reject logic here */}}
            >
              <Text className="text-white font-bold">Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

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