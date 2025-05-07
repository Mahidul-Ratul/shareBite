import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";

interface Notification {
  id: string;
  type: 'accepted' | 'pickup' | 'completed' | 'cancelled' | 'assigned';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  donationId: string;
  details: {
    organizationName?: string;
    organizationImage?: any;
    volunteerName?: string;
    volunteerImage?: any;
    items?: Array<{ name: string; quantity: string }>;
  };
}

export default function NotificationList() {
  const router = useRouter();
  const [notifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'accepted',
      title: 'Donation Request Accepted',
      message: 'Food Bank Bangladesh has accepted your donation request',
      timestamp: '2024-04-27T10:30:00Z',
      isRead: false,
      donationId: 'DON001',
      details: {
        organizationName: 'Food Bank Bangladesh',
        organizationImage: require('@/assets/images/ngo.jpg'),
        items: [
          { name: 'Rice', quantity: '10 kg' },
          { name: 'Dal', quantity: '5 kg' }
        ]
      }
    },
    {
      id: '2',
      type: 'assigned',
      title: 'Volunteer Assigned',
      message: 'Abdul Karim has been assigned to collect your donation',
      timestamp: '2024-04-27T10:35:00Z',
      isRead: false,
      donationId: 'DON001',
      details: {
        volunteerName: 'Abdul Karim',
        volunteerImage: require('@/assets/images/hasi.jpg'),
      }
    },
    {
      id: '3',
      type: 'completed',
      title: 'Donation Completed',
      message: 'Your donation has been successfully delivered',
      timestamp: '2024-04-27T11:45:00Z',
      isRead: true,
      donationId: 'DON001',
      details: {
        organizationName: 'Food Bank Bangladesh',
        organizationImage: require('@/assets/images/ngo.jpg'),
      }
    }
  ]);

  const getNotificationStyle = (type: Notification['type']) => {
    switch (type) {
      case 'accepted':
        return { bg: 'bg-blue-100', icon: 'check-circle', color: '#2563eb' };
      case 'assigned':
        return { bg: 'bg-yellow-100', icon: 'user-check', color: '#d97706' };
      case 'pickup':
        return { bg: 'bg-purple-100', icon: 'truck', color: '#7c3aed' };
      case 'completed':
        return { bg: 'bg-green-100', icon: 'check-double', color: '#16a34a' };
      case 'cancelled':
        return { bg: 'bg-red-100', icon: 'times-circle', color: '#dc2626' };
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <Text className="text-2xl font-rubik-bold text-gray-800">Notifications</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="p-4 space-y-3">
          {notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              className={`p-4 rounded-xl border border-gray-100 ${
                notification.isRead ? 'bg-white' : 'bg-green-50'
              }`}
              onPress={() => router.push('./not_dt')}
            >
              <View className="flex-row">
                <View className={`${getNotificationStyle(notification.type)?.bg} p-3 rounded-full`}>
                  <FontAwesome5 
                    name={getNotificationStyle(notification.type)?.icon!} 
                    size={20} 
                    color={getNotificationStyle(notification.type)?.color}
                    solid 
                  />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="font-rubik-bold text-gray-800">
                    {notification.title}
                  </Text>
                  <Text className="text-gray-600 text-sm mt-1">
                    {notification.message}
                  </Text>
                  <Text className="text-gray-400 text-xs mt-2">
                    {new Date(notification.timestamp).toLocaleString()}
                  </Text>
                </View>
                {!notification.isRead && (
                  <View className="w-2 h-2 rounded-full bg-green-500" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
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

        <Link href="./notifications" asChild>
          <TouchableOpacity className="items-center flex-1">
            <Ionicons name="notifications" size={24} color="#F97316" />
            <Text className="text-orange-500 text-xs mt-1 font-rubik-medium">Notifications</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}