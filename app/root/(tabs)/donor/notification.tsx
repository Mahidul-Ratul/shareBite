import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { supabase } from '../../../../constants/supabaseConfig';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  isread: boolean;
  donation_id: string;
  status?: string;
}

export default function NotificationList() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [donorId, setDonorId] = useState<string | null>(null);

  useEffect(() => {
    const fetchDonorIdAndNotifications = async () => {
      setLoading(true);
      // Get logged in user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      // Get donor id from donor table by matching email
      const { data: donorData } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single();
      if (!donorData) {
        setLoading(false);
        return;
      }
      setDonorId(donorData.id);
      // Fetch notifications for this donor
      console.log(donorData.id)
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('for', 'donor')
        .eq('donor_id', donorData.id)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setNotifications(data);
      }
      setLoading(false);
    };
    fetchDonorIdAndNotifications();
  }, []);

  const getNotificationStyle = (type: string) => {
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
      default:
        return { bg: 'bg-gray-100', icon: 'bell', color: '#6B7280' };
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <Text className="text-2xl font-rubik-bold text-gray-800">Notifications</Text>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <ScrollView className="flex-1">
          <View className="p-4 space-y-3">
            {notifications.length === 0 && (
              <Text className="text-gray-400 text-center mt-8">No notifications found.</Text>
            )}
            {notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                className={`p-4 rounded-xl border border-gray-100 ${
                  notification.isread ? 'bg-white' : 'bg-green-50'
                }`}
                onPress={async () => {
                  // Mark notification as read in the backend
                  if (!notification.isread) {
                    await supabase
                      .from('notifications')
                      .update({ isread: true })
                      .eq('id', notification.id);
                    setNotifications((prev) => prev.map((n) => n.id === notification.id ? { ...n, isread: true } : n));
                  }
                  router.push({
                    pathname: './not_dt',
                    params: { donation_id: notification.donation_id }
                  });
                }}
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
                      {new Date(notification.created_at).toLocaleString()}
                    </Text>
                  </View>
                  {!notification.isread && (
                    <View className="w-2 h-2 rounded-full bg-green-500" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}


    </View>
  );
}