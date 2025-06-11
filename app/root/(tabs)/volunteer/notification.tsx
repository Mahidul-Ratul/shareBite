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
  type: 'donation' | 'event' | 'system' | 'volunteer-confirm';
  location?: string;
  meals?: number;
  donorName?: string;
  isread?: boolean;
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

      // Fetch notifications for this volunteer (direct or broadcast)
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`volunteer_id.eq.${email},for.eq.volunteer,for.eq.all`)
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
          .from('notifications')
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
        .from('notifications')
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

  const handleAcceptVolunteerDelivery = async (notificationId: string, donationId: string) => {
    setLoading(true);
    try {
      // Check if a volunteer is already assigned for this donation
      const { data: donationData, error: donationError } = await supabase
        .from('donation')
        .select('volunteer_id, status')
        .eq('id', donationId)
        .single();
      if (donationError) throw donationError;
      if (donationData.volunteer_id) {
        Alert.alert('Sorry', 'Another volunteer has already accepted this delivery.');
        // Mark this notification as unavailable
        await supabase
          .from('notifications')
          .update({ status: 'unavailable' })
          .eq('id', notificationId);
        await fetchNotifications();
        return;
      }
      // Get volunteer details
      const email = await AsyncStorage.getItem('userEmail');
      // Assign this volunteer to the donation
      const { error: updateError } = await supabase
        .from('donation')
        .update({ 
          status: 'assigned',
          volunteer_id: email
        })
        .eq('id', donationId);
      if (updateError) throw updateError;
      // Mark this notification as accepted
      await supabase
        .from('notifications')
        .update({ status: 'accepted' })
        .eq('id', notificationId);
      // Mark all other volunteer notifications for this donation as unavailable
      await supabase
        .from('notifications')
        .update({ status: 'unavailable' })
        .eq('donation_id', donationId)
        .neq('id', notificationId);
      Alert.alert('Success', 'You have been assigned to deliver this donation!');
      await fetchNotifications();
    } catch (error) {
      console.error('Error accepting delivery:', error);
      Alert.alert('Error', 'Failed to accept delivery');
    } finally {
      setLoading(false);
    }
  };

  interface AcceptNotification {
    id: string;
    donation_id: string;
    volunteer_id: string;
  }

  const handleAccept = async (notification: AcceptNotification): Promise<void> => {
    // Check if donation is already assigned
    const { data: donation, error }: { data: { volunteer_id: string; status: string } | null; error: any } = await supabase
      .from('donation')
      .select('volunteer_id, status')
      .eq('id', notification.donation_id)
      .single();
    if (error) {
      Alert.alert('Error', 'Could not check donation status.');
      return;
    }
    if (donation && donation.volunteer_id && donation.volunteer_id !== notification.volunteer_id) {
      Alert.alert('Sorry', 'This delivery has already been accepted by another volunteer.');
      // Optionally mark notification as read
      await supabase.from('notifications').update({ isread: true }).eq('id', notification.id);
      return;
    }
    if (donation && donation.volunteer_id === notification.volunteer_id) {
      Alert.alert('Info', 'You have already accepted this delivery.');
      return;
    }
    // Assign this volunteer
    const { error: assignError }: { error: any } = await supabase
      .from('donation')
      .update({ volunteer_id: notification.volunteer_id, status: 'assigned' })
      .eq('id', notification.donation_id);
    if (assignError) {
      Alert.alert('Error', 'Could not assign you to this delivery.');
      return;
    }
    // Mark all notifications for this donation as read for this volunteer
    await supabase.from('notifications').update({ isread: true }).eq('id', notification.id);
    Alert.alert('Success', 'You have been assigned to this delivery!');
    // Optionally, refresh notifications or navigate
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
            <TouchableOpacity
              key={notification.id}
              className={`rounded-xl shadow-sm mb-4 overflow-hidden border border-gray-100 ${notification.isread ? 'bg-white' : 'bg-blue-50 border-blue-200'}`}
              onPress={async () => {
                if (!notification.isread) {
                  await supabase.from('notifications').update({ isread: true }).eq('id', notification.id);
                }
                router.push({
                  pathname: '/root/(tabs)/volunteer/details_not',
                  params: { donationId: notification.donation_id, notificationId: notification.id }
                });
              }}
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
                      {/* Only show Accept for volunteer-confirm notifications with pending status */}
                      {notification.type === 'volunteer-confirm' && notification.status === 'pending' && (
                        <TouchableOpacity
                          onPress={() => handleAcceptVolunteerDelivery(notification.id, notification.donation_id)}
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
            </TouchableOpacity>
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