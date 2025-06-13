import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../../../constants/supabaseConfig';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STATUS_STAGES = [
  'volunteer is assigned',
  'on the way to receive food',
  'food collected',
  'on the way to deliver food',
  'delivered the food',
];

// Add type for donation
interface Donation {
  id: string;
  Details: string;
  Location: string;
  Quantity: string;
  Instructions: string;
  status: string;
  donor_id: string;
  ngo_id: string;
  volunteer_id: string;
  [key: string]: any;
}

export default function OngoingDonation() {
  const [donation, setDonation] = useState<Donation | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Helper to get volunteer id from volunteer table using email
  const getVolunteerId = async () => {
    let userEmail = null;
    try {
      const { data, error } = await supabase.auth.getSession();
      if (!error && data?.session?.user?.email) {
        userEmail = data.session.user.email;
      }
    } catch (e) {}
    if (!userEmail) {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (!error && data?.user?.email) {
          userEmail = data.user.email;
        }
      } catch (e) {}
    }
    if (!userEmail) throw new Error('Not logged in');
    const { data: volunteerRow, error: volunteerRowError } = await supabase
      .from('volunteer')
      .select('id')
      .eq('email', userEmail)
      .maybeSingle();
    if (volunteerRowError || !volunteerRow) throw new Error('Volunteer not found');
    return volunteerRow.id;
  };

  // Fetch the current ongoing donation for the logged-in volunteer
  useEffect(() => {
    const fetchOngoingDonation = async () => {
      setLoading(true);
      setError('');
      try {
        // Get volunteer id from volunteer table using email
        const volunteerId = await getVolunteerId();
        // Fetch ongoing donation
        const { data: donationData, error: donationError } = await supabase
          .from('donation')
          .select('*')
          .eq('volunteer_id', volunteerId)
          .in('status', ['volunteer is assigned', 'on the way to receive food', 'food collected', 'on the way to deliver food'])
          .limit(1)
          .single();
        if (donationError && donationError.code !== 'PGRST116') throw donationError;
        setDonation(donationData || null);
      } catch (err) {
        setError('Failed to fetch ongoing donation.');
        setDonation(null);
        console.error('Ongoing donation fetch error:', err); // DEBUG
      } finally {
        setLoading(false);
      }
    };
    fetchOngoingDonation();
  }, []);

  // Handle status update
  const handleStatusUpdate = async (nextStatus: string) => {
    if (!donation) return;
    setUpdating(true);
    setError('');
    try {
      // Update donation status
      const { error: updateError } = await supabase
        .from('donation')
        .update({ status: nextStatus })
        .eq('id', donation.id);
      if (updateError) throw updateError;
      // Send notifications to admin, donor, and receiver
      const { error: notifError } = await supabase.from('notifications').insert([
        {
          title: 'Donation Status Updated',
          message: `Donation status updated to: ${nextStatus}`,
          type: 'status',
          isread: false,
          for: 'admin',
          donation_id: donation.id,
          created_at: new Date().toISOString(),
        },
        {
          title: 'Donation Status Updated',
          message: `Your donation status is now: ${nextStatus}`,
          type: 'status',
          isread: false,
          for: 'donor',
          donation_id: donation.id,
          created_at: new Date().toISOString(),
          donor_id: donation.donor_id,
        },
        {
          title: 'Donation Status Updated',
          message: `Donation you will receive is now: ${nextStatus}`,
          type: 'status',
          isread: false,
          for: 'receiver',
          donation_id: donation.id,
          created_at: new Date().toISOString(),
          ngo_id: donation.ngo_id,
        },
        // Extra notification for donor after every update
        {
          title: 'Donation Progress',
          message: `A volunteer has updated the donation status to: ${nextStatus}.`,
          type: 'status',
          isread: false,
          for: 'donor',
          donation_id: donation.id,
          created_at: new Date().toISOString(),
          donor_id: donation.donor_id,
        },
      ]);
      if (notifError) {
        console.error('Notification insert error:', notifError);
        Alert.alert('Warning', 'Status updated, but notification failed to send.');
      }
      setDonation({ ...donation, status: nextStatus });
      Alert.alert('Success', `Status updated to: ${nextStatus}`);
    } catch (err) {
      setError('Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#f97316" />
        <Text className="mt-4 text-gray-600">Loading ongoing donation...</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-red-600">{error}</Text>
      </View>
    );
  }
  if (!donation) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-600">No ongoing donation found.</Text>
      </View>
    );
  }

  // Find the next status in the workflow
  const currentIndex = STATUS_STAGES.indexOf(donation.status);
  const nextStatus = STATUS_STAGES[currentIndex + 1];

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6 pt-10">
        <Text className="text-2xl font-bold text-gray-900 mb-4">Ongoing Donation</Text>
        <View className="bg-white rounded-xl p-4 shadow mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-2">{donation.Details || 'No details'}</Text>
          <Text className="text-gray-600 mb-1">Status: <Text className="font-bold text-indigo-700">{donation.status}</Text></Text>
          <Text className="text-gray-600 mb-1">Location: {donation.Location}</Text>
          <Text className="text-gray-600 mb-1">Quantity: {donation.Quantity}</Text>
          <Text className="text-gray-600 mb-1">Instructions: {donation.Instructions}</Text>
        </View>
        <View className="mb-6">
          <Text className="text-base font-medium mb-2">Update Status</Text>
          {nextStatus ? (
            <TouchableOpacity
              className="bg-orange-500 rounded-xl py-4"
              onPress={() => handleStatusUpdate(nextStatus)}
              disabled={updating}
            >
              <Text className="text-white text-center text-lg font-bold">
                {updating ? 'Updating...' : `Mark as "${nextStatus}"`}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text className="text-green-700 font-bold">Donation process completed!</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
