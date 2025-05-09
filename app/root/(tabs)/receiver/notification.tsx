import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from '../../../../constants/supabaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';



interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  donation_id: string;
  type: 'accepted' | 'pickup' | 'completed' | 'cancelled' | 'assigned';
  isread: boolean;
  for:string
  ngo_id:string
}
  
   
export default function NotificationList() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNotifications = async () => {
      const ngo_id = await AsyncStorage.getItem("ngo_id");
      console.log("Fetched ngo_id:", ngo_id);
  
      if (!ngo_id) {
        console.error("ngo_id not found in AsyncStorage.");
        setLoading(false);
        return;
      }
  
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .in('for', ['receiver', 'all'])
        .eq('ngo_id', ngo_id) // Use the actual value from storage
        .order('created_at', { ascending: false });
  
      if (error) {
        console.error('Error fetching notifications:', error.message);
      } else {
        setNotifications(data as Notification[]);
        console.log('Fetched notifications:', data);
      }
  
      setLoading(false);
    };
  
    loadNotifications(); // ✅ call the async function inside useEffect
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
        notification.isread ? 'bg-white' : 'bg-green-50' // Different background for unread notifications
      }`}
      
      onPress={() => {
        markAsRead(notification.id);
         // Mark notification as read
        router.push({
          pathname: './DonationDetailN',
          params: { id: notification.donation_id }, // Pass the donation ID to the detail page
        });
       
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
