import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Linking, Dimensions } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../../constants/supabaseConfig';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

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
  const [donorData, setDonorData] = useState<any>(null);
  const [receiverData, setReceiverData] = useState<any>(null);
  const [contactPersonData, setContactPersonData] = useState<any>(null);
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

        // Fetch donor information
        if (donationData?.donor_id) {
          const { data: donorInfo, error: donorError } = await supabase
            .from('users')
            .select('*')
            .eq('id', donationData.donor_id)
            .single();
          if (!donorError) setDonorData(donorInfo);
        }

        // Fetch receiver information
        if (donationData?.ngo_id) {
          const { data: receiverInfo, error: receiverError } = await supabase
            .from('receiver')
            .select('*')
            .eq('id', donationData.ngo_id)
            .single();
          if (!receiverError) setReceiverData(receiverInfo);
        }

        // Set contact person data from donation
        if (donationData) {
          setContactPersonData({
            name: donationData.Name,
            contact: donationData.Contact,
            location: donationData.Location
          });
        }
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

  // Phone call functionality
  const handlePhoneCall = async (phoneNumber: string) => {
    if (!phoneNumber) {
      Alert.alert('Error', 'No phone number available');
      return;
    }
    
    try {
      const url = `tel:${phoneNumber}`;
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Phone calls are not supported on this device');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to make phone call');
    }
  };

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
  const nextStatus = currentIndex >= 0 && currentIndex < STATUS_STAGES.length - 1 ? STATUS_STAGES[currentIndex + 1] : null;

  return (
    <View className="flex-1 bg-gray-50">
      <LinearGradient 
        colors={['#f97316', '#ea580c', '#dc2626']} 
        className="pt-12 pb-6 px-6"
        style={{ borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="p-2 rounded-full bg-white/20"
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Active Mission</Text>
          <View className="w-10" />
        </View>
        
        <View className="bg-white/20 rounded-2xl p-4 backdrop-blur-sm">
          <Text className="text-white text-lg font-bold mb-2">{donation.Details || 'Donation Details'}</Text>
          <View className="flex-row items-center">
            <View className="bg-white/30 rounded-full px-3 py-1">
              <Text className="text-white text-sm font-medium">{donation.status}</Text>
            </View>
            <View className="ml-3 bg-white/20 rounded-full px-3 py-1">
              <Text className="text-white text-sm">Qty: {donation.Quantity}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {/* Simple & Clear Action Button */}
        <View className="mb-6 bg-white rounded-xl p-4 shadow-lg border-2 border-orange-200">
          <Text className="text-center text-gray-700 font-semibold mb-3">Update Mission Status</Text>
          {nextStatus ? (
            <TouchableOpacity
              onPress={() => handleStatusUpdate(nextStatus)}
              disabled={updating}
              className="bg-orange-500 rounded-lg py-3 px-4"
              style={{ elevation: 4 }}
            >
              <View className="flex-row items-center justify-center">
                <MaterialIcons name="arrow-forward" size={20} color="#fff" />
                <Text className="text-white text-center font-bold ml-2">
                  {updating ? 'Updating...' : `Next: ${nextStatus || 'Unknown'}`}
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View className="bg-green-500 rounded-lg py-3 px-4">
              <View className="flex-row items-center justify-center">
                <MaterialIcons name="check-circle" size={20} color="#fff" />
                <Text className="text-white text-center font-bold ml-2">Mission Completed!</Text>
              </View>
            </View>
          )}
        </View>

        {/* Progress Timeline */}
        <View className="bg-white rounded-2xl p-6 mb-6 shadow-lg">
          <Text className="text-lg font-bold text-gray-900 mb-4">Mission Progress</Text>
          {STATUS_STAGES.map((stage, index) => {
            const isCompleted = STATUS_STAGES.indexOf(donation.status) >= index;
            const isCurrent = donation.status === stage;
            
            return (
              <View key={stage} className="flex-row items-center mb-4 last:mb-0">
                <View className="items-center mr-4">
                  <View className={`w-6 h-6 rounded-full border-2 ${isCompleted ? 'bg-orange-500 border-orange-500' : 'bg-gray-200 border-gray-300'} items-center justify-center`}>
                    {isCompleted && <MaterialIcons name="check" size={16} color="#fff" />}
                  </View>
                  {index < STATUS_STAGES.length - 1 && (
                    <View className={`w-0.5 h-8 ${isCompleted ? 'bg-orange-200' : 'bg-gray-200'} my-1`} />
                  )}
                </View>
                <View className="flex-1">
                  <Text className={`font-semibold ${isCompleted ? 'text-orange-700' : 'text-gray-400'}`}>
                    {stage.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </Text>
                  {isCurrent && (
                    <Text className="text-orange-600 text-sm font-medium">Current Step</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Donor Information */}
        {donorData && (
          <View className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6 shadow-lg border border-blue-100">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-gray-900">Donor Information</Text>
              <TouchableOpacity onPress={() => handlePhoneCall(donorData.phoneNumber || '')}>
                <MaterialIcons name="phone" size={28} color="#6366f1" />
              </TouchableOpacity>
            </View>
            <View className="space-y-3">
              <View className="flex-row items-center">
                <View className="bg-blue-100 rounded-full p-2 mr-3">
                  <MaterialIcons name="person" size={20} color="#6366f1" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-semibold">{donorData.fullName || 'No name available'}</Text>
                  {donorData.address && (
                    <Text className="text-gray-600 text-sm mt-1">{donorData.address}</Text>
                  )}
                </View>
              </View>
              <TouchableOpacity 
                className="flex-row items-center"
                onPress={() => handlePhoneCall(donorData.phoneNumber || '')}
              >
                <View className="bg-blue-100 rounded-full p-2 mr-3">
                  <MaterialIcons name="phone" size={20} color="#6366f1" />
                </View>
                <Text className="text-blue-600 font-medium">
                  {donorData.phoneNumber || 'No phone number available'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Contact Person Information */}
        {contactPersonData && (
          <View className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 mb-6 shadow-lg border border-purple-100">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-gray-900">Contact Person</Text>
              <TouchableOpacity onPress={() => handlePhoneCall(contactPersonData.contact || '')}>
                <MaterialIcons name="phone" size={28} color="#9333ea" />
              </TouchableOpacity>
            </View>
            <View className="space-y-3">
              <View className="flex-row items-center">
                <View className="bg-purple-100 rounded-full p-2 mr-3">
                  <MaterialIcons name="person" size={20} color="#9333ea" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-semibold">{contactPersonData.name || 'No name available'}</Text>
                </View>
              </View>
              <TouchableOpacity 
                className="flex-row items-center"
                onPress={() => handlePhoneCall(contactPersonData.contact || '')}
              >
                <View className="bg-purple-100 rounded-full p-2 mr-3">
                  <MaterialIcons name="phone" size={20} color="#9333ea" />
                </View>
                <Text className="text-purple-600 font-medium">
                  {contactPersonData.contact || 'No phone number available'}
                </Text>
              </TouchableOpacity>
              <View className="flex-row items-center">
                <View className="bg-purple-100 rounded-full p-2 mr-3">
                  <MaterialIcons name="location-on" size={20} color="#9333ea" />
                </View>
                <Text className="text-gray-600">
                  {contactPersonData.location || 'No location available'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Receiver Information */}
        {receiverData && (
          <View className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 mb-6 shadow-lg border border-green-100">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-gray-900">Receiver Information</Text>
              <TouchableOpacity onPress={() => handlePhoneCall(receiverData.phone || '')}>
                <MaterialIcons name="phone" size={28} color="#16a34a" />
              </TouchableOpacity>
            </View>
            <View className="space-y-3">
              <View className="flex-row items-center">
                <View className="bg-green-100 rounded-full p-2 mr-3">
                  <MaterialIcons name="business" size={20} color="#16a34a" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-semibold">{receiverData.name || 'No name available'}</Text>
                  <Text className="text-gray-600 text-sm mt-1">{receiverData.type || 'No type available'}</Text>
                </View>
              </View>
              <TouchableOpacity 
                className="flex-row items-center"
                onPress={() => handlePhoneCall(receiverData.phone || '')}
              >
                <View className="bg-green-100 rounded-full p-2 mr-3">
                  <MaterialIcons name="phone" size={20} color="#16a34a" />
                </View>
                <Text className="text-green-600 font-medium">
                  {receiverData.phone || 'No phone number available'}
                </Text>
              </TouchableOpacity>
              <View className="flex-row items-center">
                <View className="bg-green-100 rounded-full p-2 mr-3">
                  <MaterialIcons name="email" size={20} color="#16a34a" />
                </View>
                <Text className="text-gray-600">
                  {receiverData.email || 'No email available'}
                </Text>
              </View>
              <View className="flex-row items-center">
                <View className="bg-green-100 rounded-full p-2 mr-3">
                  <MaterialIcons name="location-on" size={20} color="#16a34a" />
                </View>
                <Text className="text-gray-600">
                  {receiverData.location || 'No location available'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Donation Details */}
        <View className="bg-white rounded-2xl p-6 mb-6 shadow-lg">
          <Text className="text-lg font-bold text-gray-900 mb-4">Mission Details</Text>
          <View className="space-y-4">
            <View className="flex-row items-center">
              <View className="bg-orange-100 rounded-full p-2 mr-3">
                <MaterialIcons name="restaurant" size={20} color="#f97316" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-600 text-sm">Instructions</Text>
                <Text className="text-gray-900 font-medium">{donation.Instructions || 'No instructions'}</Text>
              </View>
            </View>
            <View className="flex-row items-center">
              <View className="bg-orange-100 rounded-full p-2 mr-3">
                <MaterialIcons name="location-on" size={20} color="#f97316" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-600 text-sm">Pickup Location</Text>
                <Text className="text-gray-900 font-medium">{donation.Location || 'No location'}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
