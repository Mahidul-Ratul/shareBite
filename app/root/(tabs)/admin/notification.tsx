import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from '../../../../constants/supabaseConfig';

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  donation_id: string;
  type: 'accepted' | 'pickup' | 'completed' | 'cancelled' | 'assigned' | 'request';
  isread: boolean;
  for:string;
  request_id?: string;
}
  
   
export default function NotificationList() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    
    
  

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*') // make sure all fields are selected
        .in('for', ['admin', 'all'])
        .order('created_at', { ascending: false });
  
      if (error) {
        console.error('Error fetching notifications:', error.message);
      } else {
        setNotifications(data as Notification[]);
      }
      setLoading(false);
    };

    fetchNotifications();
  }, []);
  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ isread: true })
      .eq('id', id);
  
    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    }
  };

  const getNotificationStyle = (type: Notification['type']) => {
    switch (type) {
      case 'accepted':
        return { bg: 'bg-green-100', icon: 'bell', color: '#2563eb' };
      case 'assigned':
        return { bg: 'bg-yellow-100', icon: 'user-check', color: '#d97706' };
      case 'pickup':
        return { bg: 'bg-purple-100', icon: 'truck', color: '#7c3aed' };
      case 'completed':
        return { bg: 'bg-green-100', icon: 'check-double', color: '#16a34a' };
      case 'cancelled':
        return { bg: 'bg-red-100', icon: 'times-circle', color: '#dc2626' };
      case 'request':
        return { bg: 'bg-blue-100', icon: 'file-alt', color: '#2563eb' };
      default:
        return { bg: 'bg-gray-100', icon: 'bell', color: '#6b7280' }; // fallback
    }
  };
  

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <Text className="text-2xl font-rubik-bold text-gray-800">Notifications</Text>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <ScrollView className="flex-1">
         <View className="p-4 space-y-3">
  {notifications.map((notification) => (
    <TouchableOpacity
      key={notification.id}
      className={`p-4 rounded-xl border border-gray-100 ${
        notification.isread ? 'bg-white' : 'bg-green-50'
      }`}
      onPress={async () => {
        await markAsRead(notification.id);
        if (notification.type === 'request') {
          router.push({
            pathname: '/root/(tabs)/admin/request_details',
            params: { request_id: notification.request_id },
          });
        } else {
          router.push({
            pathname: '/root/(tabs)/admin/DonationDetailN',
            params: { id: notification.donation_id },
          });
        }
      }}
    >
      <View className="flex-row items-center space-x-4">
        {/* Icon Section */}
        <View className={`${getNotificationStyle(notification.type).bg} p-3 rounded-full`}>
          <FontAwesome5
            name={getNotificationStyle(notification.type).icon}
            size={20}
            color={getNotificationStyle(notification.type).color}
            solid
          />
        </View>

        {/* Text Section */}
        <View className="flex-1">
          <Text className="font-semibold text-gray-800">{notification.title}</Text>
          <Text className="text-gray-600">{notification.message}</Text>
          <Text className="text-gray-400 text-xs">
            {new Date(notification.created_at).toLocaleString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  ))}
</View>



        </ScrollView>
      )}
    </View>
  );
}
