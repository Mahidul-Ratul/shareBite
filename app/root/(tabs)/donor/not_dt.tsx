import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Linking, Modal } from 'react-native';
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, Link } from "expo-router";
import { supabase } from '../../../../constants/supabaseConfig';

export default function NotificationDetail() {
  const router = useRouter();
  const { donation_id } = useLocalSearchParams();
  const [donation, setDonation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [receiver, setReceiver] = useState<any>(null);
  const [volunteerData, setVolunteerData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);

  useEffect(() => {
    const fetchDonation = async () => {
      setLoading(true);
      if (!donation_id) return;
      
      try {
        // Fetch donation data first
        const { data, error } = await supabase
          .from('donation')
          .select('*')
          .eq('id', donation_id)
          .single();
        
        if (!error && data) {
          setDonation(data);
          
          // Fetch receiver and volunteer data in parallel for better performance
          const promises = [];
          
          if (data.ngo_id) {
            promises.push(
              supabase
                .from('receiver')
                .select('*')
                .eq('id', data.ngo_id)
                .single()
                .then(({ data: recData }) => setReceiver(recData))
            );
          }
          
          if (data?.volunteer_id && data.volunteer_id !== 'ngo') {
            promises.push(
              supabase
                .from('volunteer')
                .select('*')
                .eq('id', data.volunteer_id)
                .single()
                .then(({ data: volData, error: volError }) => {
                  if (!volError) {
                    setVolunteerData(volData);
                  }
                })
            );
          }
          
          // Wait for all data to load
          await Promise.all(promises);
        }
      } catch (error) {
        console.error('Error fetching donation data:', error);
      } finally {
        setLoading(false);
      }
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
    { key: 'receiver_acceptance', label: 'Receiver Decision', description: 'Receiver will accept or reject the donation offer.' },
    { key: 'approvedF', label: 'Ready for Assignment', description: 'Donation is ready to be assigned to a volunteer or NGO.' },
    { key: 'volunteer is assigned', label: 'Volunteer Assigned', description: 'A volunteer has been assigned to collect your donation.' },
    { key: 'on the way to receive food', label: 'Volunteer On The Way', description: 'Volunteer is on the way to collect your donation.' },
    { key: 'food collected', label: 'Food Collected', description: 'The food has been collected by the volunteer.' },
    { key: 'on the way to deliver food', label: 'On The Way To Receiver', description: 'Volunteer is delivering the food to the receiver.' },
    { key: 'delivered the food', label: 'Donation Delivered', description: 'Your donation has been delivered to the receiver.' },
    { key: 'receiver confirmed', label: 'Receiver Confirmed', description: 'The receiver confirmed receiving the food.' },
    { key: 'cancelled', label: 'Donation Cancelled', description: 'The donation has been cancelled.' },
    { key: 'pending_other_ngo', label: 'Offered to Other NGOs', description: 'Donation has been offered to nearby NGOs.' },
  ];

  // Find the current status index
  const currentStatusIndex = STATUS_STAGES.findIndex(s => s.key === donation?.status);

  // Status banner design
  const getStatusBanner = () => {
    if (!donation?.status) return null;
    const statusObj = STATUS_STAGES.find(s => s.key === donation.status);
    let color = '#fbbf24', bg = 'bg-yellow-100', icon = 'hourglass-empty', textColor = 'text-yellow-800';
    let displayText = statusObj?.label || donation.status;
    
    switch (donation.status) {
      case 'pending':
        color = '#fbbf24'; bg = 'bg-yellow-100'; icon = 'hourglass-empty'; textColor = 'text-yellow-800'; break;
      case 'approved':
        color = '#6366f1'; bg = 'bg-indigo-100'; icon = 'check-circle'; textColor = 'text-indigo-800'; break;
      case 'approvedF':
        color = '#16a34a'; bg = 'bg-green-100'; icon = 'assignment-turned-in'; textColor = 'text-green-800'; break;
      case 'rejectedF':
        color = '#ef4444'; bg = 'bg-red-100'; icon = 'close'; textColor = 'text-red-800'; 
        displayText = 'Receiver Rejected'; break;
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
      case 'receiver confirmed':
        color = '#16a34a'; bg = 'bg-green-100'; icon = 'check-circle'; textColor = 'text-green-800'; break;
      case 'cancelled':
        color = '#dc2626'; bg = 'bg-red-100'; icon = 'cancel'; textColor = 'text-red-800'; 
        displayText = 'Donation Cancelled'; break;
      case 'pending_other_ngo':
        color = '#f59e0b'; bg = 'bg-yellow-100'; icon = 'share'; textColor = 'text-yellow-800'; 
        displayText = 'Offered to Other NGOs'; break;
      default:
        color = '#9ca3af'; bg = 'bg-gray-100'; icon = 'info'; textColor = 'text-gray-700'; break;
    }
    return (
      <View className={`flex-row items-center rounded-xl px-4 py-3 mb-4 shadow ${bg}`}
        style={{ alignSelf: 'center', marginTop: 16, marginBottom: 16 }}>
        <MaterialIcons name={icon as any} size={28} color={color} />
        <Text className={`ml-4 font-bold text-lg ${textColor}`}>{displayText}</Text>
      </View>
    );
  };

  // Helper to send notifications to admin and donor
  const sendConfirmationNotifications = async (donation: any, confirmed: boolean) => {
    const messages = [];
    if (donation.donor_id) {
      messages.push({
        title: 'Receiver Confirmation',
        message: confirmed ? 'The receiver has confirmed receiving the food.' : 'The receiver denied receiving the food.',
        type: 'confirmation',
        isread: false,
        for: 'donor',
        donation_id: donation.id,
        created_at: new Date().toISOString(),
        user_id: donation.donor_id,
        ngo_id: donation.ngo_id,
      });
    }
    messages.push({
      title: 'Receiver Confirmation',
      message: confirmed ? 'The receiver has confirmed receiving the food.' : 'The receiver denied receiving the food.',
      type: 'confirmation',
      isread: false,
      for: 'admin',
      donation_id: donation.id,
      created_at: new Date().toISOString(),
      ngo_id: donation.ngo_id,
    });
    if (messages.length > 0) {
      await supabase.from('notifications').insert(messages);
    }
  };

  // Helper to find nearby NGOs within 10-15km radius
  const findNearbyNGOs = async (donationAddress: string) => {
    try {
      // Geocode donation address
      const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(donationAddress)}&key=ceea64097b1646c4b18647701f0a60dc&limit=1&countrycode=bd`);
      const data = await response.json();
      if (!data.results || data.results.length === 0) return [];
      
      const donationCoords = {
        lat: data.results[0].geometry.lat,
        lng: data.results[0].geometry.lng,
      };

      // Fetch all NGOs
      const { data: ngos, error } = await supabase.from('receiver').select('*');
      if (error || !ngos) return [];

      const nearbyNGOs = [];
      for (const ngo of ngos) {
        if (!ngo.address || ngo.id === donation.ngo_id) continue; // Skip current NGO
        
        // Geocode NGO address
        const ngoResponse = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(ngo.address)}&key=ceea64097b1646c4b18647701f0a60dc&limit=1&countrycode=bd`);
        const ngoData = await ngoResponse.json();
        if (!ngoData.results || ngoData.results.length === 0) continue;
        
        const ngoCoords = {
          lat: ngoData.results[0].geometry.lat,
          lng: ngoData.results[0].geometry.lng,
        };

        // Calculate distance (Haversine formula)
        const toRad = (deg: number) => (deg * Math.PI) / 180;
        const R = 6371; // Earth's radius in km
        const dLat = toRad(ngoCoords.lat - donationCoords.lat);
        const dLon = toRad(ngoCoords.lng - donationCoords.lng);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + 
                  Math.cos(toRad(donationCoords.lat)) * Math.cos(toRad(ngoCoords.lat)) * 
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        if (distance <= 15) { // Within 15km radius
          nearbyNGOs.push({ ...ngo, distance });
        }
      }
      
      return nearbyNGOs.sort((a, b) => a.distance - b.distance);
    } catch (error) {
      console.error('Error finding nearby NGOs:', error);
      return [];
    }
  };

  // Handle donation cancellation
  const handleCancelDonation = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('donation')
        .update({ status: 'cancelled' })
        .eq('id', donation_id);
      if (error) throw error;

      // Notify admin about cancellation
      await supabase.from('notifications').insert([
        {
          title: 'Donation Cancelled',
          message: `Donor cancelled the donation: ${donation.Types} - ${donation.Quantity}`,
          type: 'cancelled',
          isread: false,
          for: 'admin',
          donation_id: donation_id,
          created_at: new Date().toISOString(),
          ngo_id: donation.ngo_id,
          status: 'cancelled',
        }
      ]);

      Alert.alert('Success', 'Donation has been cancelled.');
      setDonation((prev: any) => ({ ...prev, status: 'cancelled' }));
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel donation.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle offering to other NGOs
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

  // Helper function to determine if volunteer information should be shown
  const shouldShowVolunteerInfo = () => {
    if (volunteerData) return true;
    if (!donation?.status) return false;
    
    const volunteerStatuses = [
      'volunteer is assigned', 
      'on the way to receive food', 
      'food collected', 
      'on the way to deliver food', 
      'delivered the food', 
      'receiver confirmed'
    ];
    
    return volunteerStatuses.includes(donation.status) || 
           currentStatusIndex >= STATUS_STAGES.findIndex(s => s.key === 'volunteer is assigned');
  };

  const handleOfferToOtherNGOs = async () => {
    setIsLoading(true);
    try {
      const nearbyNGOs = await findNearbyNGOs(donation.Location);
      
      if (nearbyNGOs.length === 0) {
        Alert.alert('No NGOs Found', 'No other NGOs found within 15km radius. Would you like to cancel the donation?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Yes, Cancel', onPress: handleCancelDonation }
        ]);
        return;
      }

      // Send notifications to all nearby NGOs
      const notifications = nearbyNGOs.map(ngo => ({
        title: 'New Donation Offer Available',
        message: `A donation (${donation.Types} - ${donation.Quantity}) is available near your location. First to accept gets it!`,
        type: 'donation_offer',
        isread: false,
        for: 'receiver',
        donation_id: donation_id,
        created_at: new Date().toISOString(),
        ngo_id: ngo.id,
        status: 'pending_acceptance',
      }));

      await supabase.from('notifications').insert(notifications);

      // Update donation status to indicate it's available for other NGOs
      const { error } = await supabase
        .from('donation')
        .update({ 
          status: 'pending_other_ngo',
          ngo_id: null // Remove current NGO assignment
        })
        .eq('id', donation_id);
      
      if (error) throw error;

      Alert.alert('Success', `Donation offered to ${nearbyNGOs.length} nearby NGOs. First to accept will be assigned.`);
      setDonation((prev: any) => ({ ...prev, status: 'pending_other_ngo' }));
    } catch (error) {
      Alert.alert('Error', 'Failed to offer donation to other NGOs.');
    } finally {
      setIsLoading(false);
    }
  };

  // Rating functions
  const handleRatingSubmit = async () => {
    if (selectedRating === 0) {
      Alert.alert('Please select a rating', 'Please select a rating before submitting.');
      return;
    }

    if (!volunteerData) {
      Alert.alert('Error', 'Volunteer information not available.');
      return;
    }

    try {
      // Update volunteer's points
      const currentPoints = volunteerData.point || 0;
      const newPoints = currentPoints + selectedRating;
      
      const { error } = await supabase
        .from('volunteer')
        .update({ point: newPoints })
        .eq('id', volunteerData.id);

      if (error) {
        Alert.alert('Error', 'Failed to submit rating. Please try again.');
        return;
      }

      setHasRated(true);
      setShowRatingModal(false);
      Alert.alert('Success', 'Thank you for rating the volunteer!');
      
      // Refresh volunteer data to show updated points
      const { data: updatedVolunteer } = await supabase
        .from('volunteer')
        .select('*')
        .eq('id', volunteerData.id)
        .single();
      
      if (updatedVolunteer) {
        setVolunteerData(updatedVolunteer);
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      Alert.alert('Error', 'Failed to submit rating. Please try again.');
    }
  };

  const shouldShowRatingButton = () => {
    return donation?.status === 'receiver confirmed' && 
           volunteerData && 
           !hasRated;
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

          {/* Receiver Information */}
          {receiver && (
            <View className="mt-6 bg-purple-50 rounded-xl p-4">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-lg font-bold text-gray-900">Receiver Information</Text>
                <TouchableOpacity onPress={() => handlePhoneCall(receiver.phone || '')}>
                  <MaterialIcons name="phone" size={28} color="#9333ea" />
                </TouchableOpacity>
              </View>
              <View className="space-y-3">
                <View className="flex-row items-center">
                  <MaterialIcons name="business" size={24} color="#9333ea" />
                  <View className="ml-3">
                    <Text className="text-gray-900 font-medium">{receiver.name || 'No name available'}</Text>
                    <Text className="text-gray-600 text-sm mt-1">{receiver.type || 'No type available'}</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  className="flex-row items-center"
                  onPress={() => handlePhoneCall(receiver.phone || '')}
                >
                  <MaterialIcons name="phone" size={20} color="#9333ea" />
                  <Text className="text-purple-600 ml-3 underline">
                    {receiver.phone || 'No phone number available'}
                  </Text>
                </TouchableOpacity>
                <View className="flex-row items-center">
                  <MaterialIcons name="email" size={20} color="#9333ea" />
                  <Text className="text-gray-600 ml-3">
                    {receiver.email || 'No email available'}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <MaterialIcons name="location-on" size={20} color="#9333ea" />
                  <Text className="text-gray-600 ml-3">
                    {receiver.location || 'No location available'}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <MaterialIcons name="groups" size={20} color="#9333ea" />
                  <Text className="text-gray-600 ml-3">
                    {receiver.areas || 'No areas available'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Volunteer Information - Show when volunteer is assigned or when status indicates volunteer involvement */}
          {shouldShowVolunteerInfo() && (
            <View className="mt-6 bg-green-50 rounded-xl p-4">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-lg font-bold text-gray-900">Volunteer Information</Text>
                {volunteerData && (
                  <TouchableOpacity onPress={() => handlePhoneCall(volunteerData.phone || '')}>
                    <MaterialIcons name="phone" size={28} color="#16a34a" />
                  </TouchableOpacity>
                )}
              </View>
              <View className="space-y-3">
                {volunteerData ? (
                  <>
                    <View className="flex-row items-center">
                      <MaterialIcons name="person" size={24} color="#16a34a" />
                      <View className="ml-3">
                        <Text className="text-gray-900 font-medium">{volunteerData.name || 'No name available'}</Text>
                        {volunteerData.address && (
                          <Text className="text-gray-600 text-sm mt-1">{volunteerData.address}</Text>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity 
                      className="flex-row items-center"
                      onPress={() => handlePhoneCall(volunteerData.phone || '')}
                    >
                      <MaterialIcons name="phone" size={20} color="#16a34a" />
                      <Text className="text-green-600 ml-3 underline">
                        {volunteerData.phone || 'No phone number available'}
                      </Text>
                    </TouchableOpacity>
                    <View className="flex-row items-center">
                      <MaterialIcons name="email" size={20} color="#16a34a" />
                      <Text className="text-gray-600 ml-3">
                        {volunteerData.email || 'No email available'}
                      </Text>
                    </View>
                    {volunteerData.point && (
                      <View className="flex-row items-center">
                        <MaterialIcons name="star" size={20} color="#fbbf24" />
                        <Text className="text-gray-600 ml-3">
                          Total Points: {volunteerData.point}
                        </Text>
                      </View>
                    )}
                  </>
                ) : (
                  <View className="flex-row items-center">
                    <MaterialIcons name="person" size={24} color="#16a34a" />
                    <View className="ml-3">
                      <Text className="text-gray-900 font-medium">Volunteer Assigned</Text>
                      <Text className="text-gray-600 text-sm mt-1">Volunteer information is being loaded...</Text>
                    </View>
                  </View>
                )}
              </View>
              
              {/* Rating Button */}
              {shouldShowRatingButton() && (
                <TouchableOpacity
                  className="mt-4 bg-yellow-500 rounded-xl py-3 px-4 flex-row items-center justify-center"
                  onPress={() => setShowRatingModal(true)}
                >
                  <MaterialIcons name="star" size={24} color="#fff" />
                  <Text className="text-white font-bold ml-2 text-lg">Rate Volunteer</Text>
                </TouchableOpacity>
              )}
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
              // Handle receiver acceptance step
              if (stage.key === 'receiver_acceptance') {
                // Show this step when status is approvedF, rejectedF, or any status after approvedF
                const shouldShow = ['approvedF', 'rejectedF', 'volunteer is assigned', 'on the way to receive food', 'food collected', 'on the way to deliver food', 'delivered the food', 'receiver confirmed'].includes(donation?.status || '');
                if (!shouldShow) return null;
                
                // Determine if this step is completed, current, or pending
                let isCompleted = false;
                let isCurrent = false;
                let customLabel = stage.label;
                let customDescription = stage.description;
                
                if (donation?.status === 'rejectedF') {
                  isCompleted = true;
                  customLabel = 'Receiver Rejected';
                  customDescription = 'Receiver rejected the donation offer.';
                } else if (['volunteer is assigned', 'on the way to receive food', 'food collected', 'on the way to deliver food', 'delivered the food', 'receiver confirmed'].includes(donation?.status || '')) {
                  isCompleted = true;
                  customLabel = 'Receiver Accepted';
                  customDescription = 'Receiver accepted the donation offer.';
                } else if (donation?.status === 'approvedF') {
                  isCurrent = true;
                  customLabel = 'Receiver Decision';
                  customDescription = 'Waiting for receiver to accept or reject the donation offer.';
                }
                
                return (
                  <View key={stage.key} className="flex-row mb-4 last:mb-0 items-center">
                    <View className="items-center mr-4">
                      <View className={`w-4 h-4 rounded-full ${isCompleted ? 'bg-green-500' : isCurrent ? 'bg-blue-500' : 'bg-gray-300'} border-2 border-white shadow`} />
                      {index !== STATUS_STAGES.length - 1 && (
                        <View className={`w-0.5 h-8 ${isCompleted ? 'bg-green-200' : isCurrent ? 'bg-blue-200' : 'bg-gray-200'} my-1`} />
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className={`font-rubik-medium text-base ${isCompleted ? 'text-green-700' : isCurrent ? 'text-blue-700' : 'text-gray-400'}`}>{customLabel}</Text>
                      <Text className={`text-sm ${isCompleted ? 'text-green-600' : isCurrent ? 'text-blue-600' : 'text-gray-400'}`}>{customDescription}</Text>
                    </View>
                  </View>
                );
              }
              
              // For all other stages, show them normally
              const isCompleted = index < STATUS_STAGES.findIndex(s => s.key === donation?.status);
              const isCurrent = index === STATUS_STAGES.findIndex(s => s.key === donation?.status);
              
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

          {/* Donor Options when Receiver Rejected */}
          {donation.status === 'rejectedF' && (
            <View className="bg-white rounded-xl p-4 border border-gray-100 mt-6 mb-6">
              <Text className="text-lg font-rubik-bold text-gray-800 mb-4">What would you like to do?</Text>
              <Text className="text-gray-600 mb-4">The receiver has rejected your donation. You can either cancel it or offer it to other nearby NGOs.</Text>
              
              <View className="flex-row space-x-4">
                <TouchableOpacity
                  className="flex-1 bg-red-600 rounded-xl py-4"
                  onPress={handleCancelDonation}
                  disabled={isLoading}
                >
                  <View className="flex-row items-center justify-center">
                    <MaterialIcons name="close" size={24} color="#fff" />
                    <Text className="text-white font-bold ml-2">Cancel Donation</Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  className="flex-1 bg-green-600 rounded-xl py-4"
                  onPress={handleOfferToOtherNGOs}
                  disabled={isLoading}
                >
                  <View className="flex-row items-center justify-center">
                    <MaterialIcons name="share" size={24} color="#fff" />
                    <Text className="text-white font-bold ml-2">Offer to Other NGOs</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-400">Donation not found.</Text>
        </View>
      )}

      {/* Rating Modal */}
      <Modal
        visible={showRatingModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRatingModal(false)}
      >
        <View className="flex-1 bg-black bg-opacity-50 justify-center items-center p-4">
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <View className="items-center mb-6">
              <MaterialIcons name="star" size={48} color="#fbbf24" />
              <Text className="text-2xl font-bold text-gray-800 mt-2">Rate Volunteer</Text>
              <Text className="text-gray-600 text-center mt-2">
                How would you rate {volunteerData?.name || 'the volunteer'}?
              </Text>
            </View>

            {/* Star Rating */}
            <View className="flex-row justify-center mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setSelectedRating(star)}
                  className="mx-1"
                >
                  <MaterialIcons
                    name={star <= selectedRating ? "star" : "star-border"}
                    size={40}
                    color={star <= selectedRating ? "#fbbf24" : "#d1d5db"}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Rating Text */}
            {selectedRating > 0 && (
              <View className="items-center mb-6">
                <Text className="text-lg font-semibold text-gray-800">
                  {selectedRating === 1 && "Poor"}
                  {selectedRating === 2 && "Fair"}
                  {selectedRating === 3 && "Good"}
                  {selectedRating === 4 && "Very Good"}
                  {selectedRating === 5 && "Excellent"}
                </Text>
                <Text className="text-gray-600">
                  {selectedRating} out of 5 stars
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View className="flex-row space-x-3">
              <TouchableOpacity
                className="flex-1 bg-gray-300 rounded-xl py-3"
                onPress={() => {
                  setShowRatingModal(false);
                  setSelectedRating(0);
                }}
              >
                <Text className="text-gray-700 font-bold text-center">Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className={`flex-1 rounded-xl py-3 ${selectedRating > 0 ? 'bg-yellow-500' : 'bg-gray-300'}`}
                onPress={handleRatingSubmit}
                disabled={selectedRating === 0}
              >
                <Text className={`font-bold text-center ${selectedRating > 0 ? 'text-white' : 'text-gray-500'}`}>
                  Submit
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}