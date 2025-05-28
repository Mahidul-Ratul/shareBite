import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../../../constants/supabaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Link } from 'expo-router';

interface Notification {
  id: string;
  title: string;
  message: string;
  donation_id: string;
  created_at: string;
  status: 'pending' | 'accepted' | 'unavailable';
  type: 'donation' | 'event' | 'system';
  location?: string;
  meals?: number;
  donorName?: string;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      const email = await AsyncStorage.getItem('userEmail');
      if (!email) return;

      const { data, error } = await supabase
        .from('volunteer_notifications')
        .select('*')
        .eq('volunteer_email', email)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    }
  };

  const handleAcceptDonation = async (notificationId: string, donationId: string) => {
    setLoading(true);
    try {
      // Check if donation is still available
      const { data: donationData, error: donationError } = await supabase
        .from('donations')
        .select('status')
        .eq('id', donationId)
        .single();

      if (donationError) throw donationError;

      if (donationData.status !== 'available') {
        Alert.alert('Sorry', 'This donation is no longer available');
        // Update notification status to unavailable
        await supabase
          .from('volunteer_notifications')
          .update({ status: 'unavailable' })
          .eq('id', notificationId);
        
        await fetchNotifications();
        return;
      }

      // Get volunteer details
      const email = await AsyncStorage.getItem('userEmail');
      
      // Update donation status and assign volunteer
      const { error: updateError } = await supabase
        .from('donations')
        .update({ 
          status: 'assigned',
          assigned_volunteer: email
        })
        .eq('id', donationId);

      if (updateError) throw updateError;

      // Update notification status
      await supabase
        .from('volunteer_notifications')
        .update({ status: 'accepted' })
        .eq('id', notificationId);

      Alert.alert('Success', 'Donation accepted successfully!');
      await fetchNotifications();
    } catch (error) {
      console.error('Error accepting donation:', error);
      Alert.alert('Error', 'Failed to accept donation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchNotifications().finally(() => setRefreshing(false));
  }, []);

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'donation': return 'green';
      case 'event': return 'blue';
      default: return 'gray';
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white pt-12 pb-4 px-6 shadow-sm">
        <Text className="text-2xl font-rubik-bold text-gray-900">Notifications</Text>
      </View>

      <ScrollView 
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="p-6">
          {notifications.map((notification) => (
            <View 
              key={notification.id}
              className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden border border-gray-100"
            >
              <View className="p-4">
                <View className="flex-row items-start">
                  <View className={`bg-${getNotificationColor(notification.type)}-100 p-2 rounded-full mr-3`}>
                    <MaterialIcons 
                      name={notification.type === 'donation' ? 'volunteer-activism' : 'event'} 
                      size={20} 
                      color={`#${notification.type === 'donation' ? '16A34A' : '2563EB'}`}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 font-rubik-bold mb-1">
                      {notification.title}
                    </Text>
                    <Text className="text-gray-600 text-sm mb-3">
                      {notification.message}
                    </Text>
                    {notification.location && (
                      <View className="flex-row items-center mb-3">
                        <MaterialIcons name="location-on" size={16} color="#6B7280" />
                        <Text className="text-gray-600 text-sm ml-1">{notification.location}</Text>
                      </View>
                    )}
                    <View className="flex-row justify-between items-center">
                      <Text className="text-gray-500 text-xs">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </Text>
                      <View className={`bg-${notification.status === 'pending' ? 'blue' : notification.status === 'accepted' ? 'green' : 'gray'}-100 px-3 py-1 rounded-full`}>
                        <Text className={`text-${notification.status === 'pending' ? 'blue' : notification.status === 'accepted' ? 'green' : 'gray'}-600 text-xs font-rubik-medium capitalize`}>
                          {notification.status}
                        </Text>
                      </View>
                      {notification.type === 'donation' && notification.status === 'pending' && (
                        <TouchableOpacity
                          onPress={() => handleAcceptDonation(notification.id, notification.donation_id)}
                          disabled={loading}
                          className="bg-green-500 px-4 py-2 rounded-full"
                        >
                          <Text className="text-white font-rubik-medium">Accept</Text>
                        </TouchableOpacity>
                      )}
                      {notification.status === 'accepted' && (
                        <View className="bg-green-100 px-3 py-1 rounded-full">
                          <Text className="text-green-600 text-xs font-rubik-medium">Accepted</Text>
                        </View>
                      )}
                      {notification.status === 'unavailable' && (
                        <View className="bg-gray-100 px-3 py-1 rounded-full">
                          <Text className="text-gray-600 text-xs font-rubik-medium">Unavailable</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            </View>
          ))}
          
          {notifications.length === 0 && (
            <View className="items-center justify-center py-12">
              <MaterialIcons name="notifications-none" size={48} color="#9CA3AF" />
              <Text className="text-gray-500 mt-4">No notifications yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}