import React, { useState, useEffect } from 'react';
import { View, ScrollView, Image, Text, TouchableOpacity, Alert, Dimensions, ActivityIndicator, Linking, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../../constants/supabaseConfig';

const { width } = Dimensions.get('window');

// Timeline stages for donation progress - updated to match donor's timeline
const STATUS_STAGES = [
  { key: 'pending', label: 'Donation Requested', description: 'Donor posted a new donation request.' },
  { key: 'approved', label: 'Donation Approved', description: 'Admin approved the donation request.' },
  { key: 'receiver_acceptance', label: 'Your Decision', description: 'You need to accept or reject the donation offer.' },
  { key: 'approvedF', label: 'Ready for Assignment', description: 'Donation is ready to be assigned to a volunteer.' },
  { key: 'volunteer is assigned', label: 'Volunteer Assigned', description: 'A volunteer has been assigned to collect the donation.' },
  { key: 'on the way to receive food', label: 'Volunteer On The Way', description: 'Volunteer is on the way to collect the donation.' },
  { key: 'food collected', label: 'Food Collected', description: 'The food has been collected by the volunteer.' },
  { key: 'on the way to deliver food', label: 'On The Way To You', description: 'Volunteer is delivering the food to you.' },
  { key: 'delivered the food', label: 'Donation Delivered', description: 'The donation has been delivered to you.' },
  { key: 'receiver confirmed', label: 'You Confirmed', description: 'You have confirmed receiving the food.' },
  { key: 'rejectedF', label: 'You Rejected', description: 'You rejected the donation offer.' },
  { key: 'cancelled', label: 'Donation Cancelled', description: 'The donation has been cancelled by the donor.' },
  { key: 'pending_other_ngo', label: 'Offered to Other NGOs', description: 'Donation has been offered to nearby NGOs.' },
];

// Add this helper function before DonationDetail
const notifyNearbyVolunteers = async (donation: any) => {
  // Helper: Geocode address to lat/lng
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=ceea64097b1646c4b18647701f0a60dc&limit=1&countrycode=bd`);
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return {
          lat: data.results[0].geometry.lat,
          lng: data.results[0].geometry.lng,
        };
      }
      return null;
    } catch {
      return null;
    }
  };
  // Helper: Haversine distance (km)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
  // Geocode donation location
  const donationCoords = await geocodeAddress(donation.Location);
  if (donationCoords) {
    const { data: volunteers, error: volError } = await supabase.from('volunteer').select('*');
    if (!volError && volunteers) {
      const notifications = [];
      for (const v of volunteers) {
        if (!v.address) continue;
        const vCoords = await geocodeAddress(v.address as string);
        if (!vCoords) continue;
        const distance = calculateDistance(donationCoords.lat, donationCoords.lng, vCoords.lat, vCoords.lng);
        if (distance <= 10) {
          notifications.push({
            title: 'New Delivery Opportunity',
            message: `A new donation (${donation.Types} - ${donation.Quantity}) is available for delivery nearby!`,
            type: 'assigned',
            isread: false,
            for: 'volunteer',
            donation_id: donation.id,
            created_at: new Date().toISOString(),
            volunteer_id: v.id,
            ngo_id: donation.ngo_id,
          });
        }
      }
      if (notifications.length > 0) {
        await supabase.from('notifications').insert(notifications);
      }
    }
  }
};

const DonationDetail = () => {
  const { id } = useLocalSearchParams();
  const [donation, setDonation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [volunteerData, setVolunteerData] = useState<any>(null);
  const [images, setImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);

  useEffect(() => {
    const fetchDonationData = async () => {
      try {
        const { data, error } = await supabase
          .from('donation')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        setDonation(data);
        // Parse images
        if (data?.Image) {
          setImages(typeof data.Image === 'string' ? data.Image.split(',').map((s: string) => s.trim()).filter(Boolean) : []);
        }
        if (data?.donor_id) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.donor_id)
            .single();
          if (!userError) setUserData(userData);
        }
        // Fetch volunteer information if volunteer is assigned
        if (data?.volunteer_id) {
          const { data: volunteerData, error: volunteerError } = await supabase
            .from('volunteer')
            .select('*')
            .eq('id', data.volunteer_id)
            .single();
          if (!volunteerError) setVolunteerData(volunteerData);
        }
        // 30-min timeout logic for volunteer assignment
        if (data?.status === 'approvedF' && !data?.volunteer_id) {
          const { data: notif, error: notifError } = await supabase
            .from('notifications')
            .select('created_at')
            .eq('donation_id', data.id)
            .eq('type', 'assigned')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          if (!notifError && notif && notif.created_at) {
            const notifTime = new Date(notif.created_at).getTime();
            const now = Date.now();
            const diffMinutes = (now - notifTime) / (1000 * 60);
            if (diffMinutes > 30) {
              // Update donation status and notify receiver
              await supabase.from('donation').update({ status: 'self_collect_offer' }).eq('id', data.id);
              await supabase.from('notifications').insert([
                {
                  title: 'No Volunteer Response',
                  message: 'No volunteers responded in time. You can self-collect or cancel the donation.',
                  type: 'self_collect',
                  isread: false,
                  for: 'receiver',
                  donation_id: data.id,
                  created_at: new Date().toISOString(),
                  ngo_id: data.ngo_id,
                }
              ]);
              // Refresh donation data
              const { data: updatedDonation } = await supabase
                .from('donation')
                .select('*')
                .eq('id', data.id)
                .single();
              setDonation(updatedDonation);
            }
          }
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load donation details');
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchDonationData();
  }, [id]);

  const handleApproval = async (status: 'approvedF' | 'rejectedF') => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('donation')
        .update({ status: status })
        .eq('id', id);
      if (error) throw error;
      if (status === 'approvedF') {
        await supabase.from('notifications').insert([
          {
            title: 'Donation Accepted',
            message: `Your donation has been accepted: ${donation.Types} - ${donation.Quantity}`,
            type: 'accepted',
            isread: false,
            for: 'admin',
            donation_id: donation.id,
            created_at: new Date().toISOString(),
            ngo_id: donation.ngo_id,
            status: 'approvedF',
          },
        ]);
        // Notify nearby volunteers
        await notifyNearbyVolunteers(donation);
      } else if (status === 'rejectedF') {
        // Send notifications to admin and donor when receiver rejects
        const notifications = [];
        // Notify admin
        notifications.push({
          title: 'Donation Rejected by Receiver',
          message: `The receiver has rejected the donation: ${donation.Types} - ${donation.Quantity}`,
          type: 'rejected',
          isread: false,
          for: 'admin',
          donation_id: donation.id,
          created_at: new Date().toISOString(),
          ngo_id: donation.ngo_id,
          status: 'rejectedF',
        });
        // Notify donor
        if (donation.donor_id) {
          notifications.push({
            title: 'Donation Rejected',
            message: `Your donation (${donation.Types} - ${donation.Quantity}) has been rejected by the receiver.`,
            type: 'rejected',
            isread: false,
            for: 'donor',
            donation_id: donation.id,
            created_at: new Date().toISOString(),
            donor_id: donation.donor_id,
            ngo_id: donation.ngo_id,
            status: 'rejectedF',
          });
        }
        await supabase.from('notifications').insert(notifications);
      }
      Alert.alert('Success', `Donation has been ${status === 'approvedF' ? 'accepted' : 'rejected'}`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update donation status');
    } finally {
      setIsLoading(false);
    }
  };

  // Parse images robustly
  useEffect(() => {
    if (donation?.Image) {
      let imgs: string[] = [];
      if (typeof donation.Image === 'string') {
        if (donation.Image.trim().startsWith('[')) {
          try {
            imgs = JSON.parse(donation.Image);
          } catch {
            imgs = [];
          }
        } else {
          imgs = [donation.Image];
        }
      } else if (Array.isArray(donation.Image)) {
        imgs = donation.Image;
      }
      setImages(imgs.filter(Boolean));
    }
  }, [donation]);

  // Find the current status index
  const currentStatusIndex = STATUS_STAGES.findIndex(s => s.key === donation?.status);

  // Status banner design - updated to match donor's implementation
  const getStatusBanner = () => {
    if (!donation?.status) return null;
    const statusObj = STATUS_STAGES.find(s => s.key === donation.status);
    let color = '#fbbf24', bg = 'bg-yellow-100', icon: any = 'hourglass-empty', textColor = 'text-yellow-800';
    let displayText = statusObj?.label || donation.status;
    
    // Only use valid MaterialIcons names
    switch (donation.status) {
      case 'pending':
        color = '#fbbf24'; bg = 'bg-yellow-100'; icon = 'hourglass-empty'; textColor = 'text-yellow-800'; break;
      case 'approved':
        color = '#6366f1'; bg = 'bg-indigo-100'; icon = 'check-circle'; textColor = 'text-indigo-800'; break;
      case 'approvedF':
        color = '#16a34a'; bg = 'bg-green-100'; icon = 'assignment-turned-in'; textColor = 'text-green-800'; break;
      case 'rejectedF':
        color = '#ef4444'; bg = 'bg-red-100'; icon = 'close'; textColor = 'text-red-800'; 
        displayText = 'You Rejected This Donation'; break;
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
    // Only allow valid icon names
    const validIcons = [
      'hourglass-empty', 'check-circle', 'assignment-turned-in', 'person', 'directions-run', 'restaurant', 'local-shipping', 'info', 'close', 'cancel', 'share'
    ];
    const safeIcon = validIcons.includes(icon) ? icon : 'info';
    return (
      <View className={`flex-row items-center rounded-xl px-4 py-3 mb-4 shadow ${bg}`}
        style={{ alignSelf: 'center', marginTop: 16, marginBottom: 16 }}>
        <MaterialIcons name={safeIcon} size={28} color={color} />
        <Text className={`ml-4 font-bold text-lg ${textColor}`}>{displayText}</Text>
      </View>
    );
  };

  // Helper to get correct image source (base64 or URL, robust for JPEG/PNG)
  const getImageSource = (image: string) => {
    if (image.startsWith('data:')) {
      return { uri: image };
    } else if (/^[A-Za-z0-9+/=]+={0,2}$/.test(image) && image.length > 100) {
      // Heuristic: long base64 string
      // Try to detect PNG or JPEG
      if (image.startsWith('iVBORw0KGgo')) {
        return { uri: `data:image/png;base64,${image}` };
      } else {
        return { uri: `data:image/jpeg;base64,${image}` };
      }
    } else {
      return { uri: image };
    }
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

  // Handle phone call
  const handlePhoneCall = async (phoneNumber: string) => {
    if (!phoneNumber || phoneNumber === 'No phone number available') {
      Alert.alert('Error', 'No phone number available to call');
      return;
    }
    
    try {
      const url = `tel:${phoneNumber}`;
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Phone dialing is not supported on this device');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open phone dialer');
    }
  };

  // Receiver confirmation handler
  const handleReceiverConfirm = async (confirmed: boolean) => {
    setIsLoading(true);
    try {
      const newStatus = confirmed ? 'receiver confirmed' : 'receiver denied';
      const { error } = await supabase
        .from('donation')
        .update({ status: newStatus })
        .eq('id', id);
      if (error) throw error;
      // Send notifications to admin and donor
      await sendConfirmationNotifications(donation, confirmed);
      Alert.alert('Thank you', confirmed ? 'You have confirmed receiving the food.' : 'You have denied receiving the food.');
      setDonation((prev: any) => ({ ...prev, status: newStatus }));
    } catch (error) {
      Alert.alert('Error', 'Failed to update confirmation.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRateVolunteer = async () => {
    if (!volunteerData?.id) {
      Alert.alert('Error', 'Volunteer information not available.');
      return;
    }

    if (selectedRating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting.');
      return;
    }

    setIsLoading(true);
    try {
      const { data: currentVolunteer, error: fetchError } = await supabase
        .from('volunteer')
        .select('point')
        .eq('id', volunteerData.id)
        .single();

      if (fetchError) throw fetchError;

      const currentPoints = currentVolunteer?.point || 0;
      const newPoints = currentPoints + selectedRating;

      const { error: updateError } = await supabase
        .from('volunteer')
        .update({ point: newPoints })
        .eq('id', volunteerData.id);

      if (updateError) throw updateError;

      setHasRated(true);
      setShowRatingModal(false);
      setSelectedRating(0);

      Alert.alert('Rating Submitted', `Thank you for rating ${volunteerData.name} with ${selectedRating}/5 stars!`);

    } catch (error) {
      console.error('Error updating volunteer rating:', error);
      Alert.alert('Error', 'Failed to submit rating. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for self-collect
  const handleSelfCollect = () => {
    router.push({ pathname: '/root/(tabs)/receiver/self_collect_status', params: { id } });
  };

  // Handler for cancel
  const handleCancelDonation = async () => {
    setIsLoading(true);
    try {
      await supabase.from('donation').update({ status: 'cancelled' }).eq('id', id);
      // Notify donor and admin
      const notifications = [];
      if (donation?.donor_id) {
        notifications.push({
          title: 'Donation Cancelled',
          message: 'The receiver has cancelled the donation.',
          type: 'cancelled',
          isread: false,
          for: 'donor',
          donation_id: id,
          created_at: new Date().toISOString(),
          donor_id: donation.donor_id,
        });
      }
      notifications.push({
        title: 'Donation Cancelled',
        message: 'The receiver has cancelled the donation.',
        type: 'cancelled',
        isread: false,
        for: 'admin',
        donation_id: id,
        created_at: new Date().toISOString(),
        ngo_id: donation?.ngo_id,
      });
      await supabase.from('notifications').insert(notifications);
      Alert.alert('Donation Cancelled', 'You have cancelled the donation.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel donation.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ alignItems: 'center' }}>
          {/* Animated Ring */}
          <View style={{ position: 'relative' }}>
            {/* Outer Ring */}
            <View style={{ 
              width: 80, 
              height: 80, 
              borderWidth: 4, 
              borderColor: '#bbf7d0', 
              borderRadius: 40, 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              {/* Inner Ring */}
              <View style={{ 
                width: 48, 
                height: 48, 
                borderWidth: 4, 
                borderColor: '#4ade80', 
                borderRadius: 24,
                opacity: 0.7
              }}>
                {/* Center Circle */}
                <View style={{ 
                  width: 24, 
                  height: 24, 
                  backgroundColor: '#16a34a', 
                  borderRadius: 12,
                  position: 'absolute',
                  top: 8,
                  left: 8
                }} />
              </View>
            </View>
            {/* Rotating Ring */}
            <View style={{ 
              position: 'absolute', 
              inset: 0, 
              width: 80, 
              height: 80, 
              borderWidth: 4, 
              borderColor: 'transparent', 
              borderTopColor: '#16a34a', 
              borderRadius: 40,
              transform: [{ rotate: '0deg' }]
            }} />
          </View>
          
          {/* Loading Text */}
          <Text style={{ color: '#374151', fontSize: 18, fontWeight: '600', marginTop: 24 }}>Loading donation details...</Text>
          <Text style={{ color: '#6b7280', fontSize: 14, marginTop: 8 }}>Please wait while we fetch the information</Text>
          
          {/* Loading Dots */}
          <View style={{ flexDirection: 'row', marginTop: 16, gap: 8 }}>
            <View style={{ 
              width: 8, 
              height: 8, 
              backgroundColor: '#4ade80', 
              borderRadius: 4,
              opacity: 0.7
            }} />
            <View style={{ 
              width: 8, 
              height: 8, 
              backgroundColor: '#4ade80', 
              borderRadius: 4,
              opacity: 0.7
            }} />
            <View style={{ 
              width: 8, 
              height: 8, 
              backgroundColor: '#4ade80', 
              borderRadius: 4,
              opacity: 0.7
            }} />
          </View>
        </View>
      </View>
    );
  }
  if (!donation) {
    return <Text>Donation not found or inaccessible.</Text>;
  }
  if(!userData){
    return <Text>User data not found or inaccessible.</Text>;
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1">
        {/* Image Carousel */}
        <View className="relative h-72">
          {images.length > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
                  setCurrentImageIndex(newIndex);
                }}
              >
                {images.map((image: string, index: number) => (
                  <Image
                    key={index}
                    source={getImageSource(image)}
                    className="w-screen h-72"
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
              {/* Image Indicators */}
              <View className="absolute bottom-4 flex-row justify-center w-full space-x-2">
                {images.map((_: string, index: number) => (
                  <View
                    key={index}
                    className={`h-2 w-2 rounded-full ${
                      currentImageIndex === index ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </View>
            </>
          ) : (
            <View className="w-full h-full bg-gray-100 items-center justify-center">
              <MaterialIcons name="fastfood" size={48} color="#94a3b8" />
            </View>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            className="absolute inset-0"
          />
          <TouchableOpacity 
            className="absolute top-12 left-4 bg-white/20 p-2 rounded-full"
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View className="px-6 pt-6">
          {getStatusBanner()}

          {/* Donor Information */}
          <View className="mt-6 bg-blue-50 rounded-xl p-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-lg font-bold text-gray-900">Donor Information</Text>
              <TouchableOpacity onPress={() => handlePhoneCall(donation?.donor_contact || userData?.phoneNumber || '')}>
                <MaterialIcons name="phone" size={28} color="#6366f1" />
              </TouchableOpacity>
            </View>
            <View className="space-y-3">
              <View className="flex-row items-center">
                <MaterialIcons name="business" size={24} color="#6366f1" />
                <View className="ml-3">
                  {userData?.fullName ? (
                    <Text className="text-gray-900 font-medium">{userData.fullName}</Text>
                  ) : (
                    <Text className="text-gray-900 font-medium">No name available</Text>
                  )}
                  {userData?.address ? (
                    <Text className="text-gray-600 text-sm mt-1">{userData.address}</Text>
                  ) : (
                    <Text className="text-gray-600 text-sm mt-1">No address available</Text>
                  )}
                </View>
              </View>
              <TouchableOpacity 
                className="flex-row items-center"
                onPress={() => handlePhoneCall(donation?.donor_contact || userData?.phoneNumber || '')}
              >
                <MaterialIcons name="phone" size={20} color="#6366f1" />
                <Text className="text-blue-600 ml-3 underline">
                  {donation?.donor_contact || userData?.phoneNumber || 'No phone number available'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Contact Person Information */}
          <View className="mt-6 bg-purple-50 rounded-xl p-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-lg font-bold text-gray-900">Contact Person</Text>
              <TouchableOpacity onPress={() => handlePhoneCall(donation?.Contact || '')}>
                <MaterialIcons name="phone" size={28} color="#9333ea" />
              </TouchableOpacity>
            </View>
            <View className="space-y-3">
              <View className="flex-row items-center">
                <MaterialIcons name="person" size={24} color="#9333ea" />
                <View className="ml-3">
                  <Text className="text-gray-900 font-medium">{donation?.Name || 'No name available'}</Text>
                </View>
              </View>
              <TouchableOpacity 
                className="flex-row items-center"
                onPress={() => handlePhoneCall(donation?.Contact || '')}
              >
                <MaterialIcons name="phone" size={20} color="#9333ea" />
                <Text className="text-purple-600 ml-3 underline">
                  {donation?.Contact || 'No phone number available'}
                </Text>
              </TouchableOpacity>
              <View className="flex-row items-center">
                <MaterialIcons name="location-on" size={20} color="#9333ea" />
                <Text className="text-gray-600 ml-3">
                  {donation?.Location || 'No location available'}
                </Text>
              </View>
            </View>
          </View>

          {/* Volunteer Information - Show only if volunteer is assigned */}
          {volunteerData && (
            <View className="mt-6 bg-green-50 rounded-xl p-4">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-lg font-bold text-gray-900">Volunteer Information</Text>
                <TouchableOpacity onPress={() => handlePhoneCall(volunteerData.phone || '')}>
                  <MaterialIcons name="phone" size={28} color="#16a34a" />
                </TouchableOpacity>
              </View>
              <View className="space-y-3">
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
              </View>
              
              {/* Rating Section - Show only if donation is completed and not rated yet */}
              {donation?.status === 'receiver confirmed' && !hasRated && (
                <View className="mt-4 pt-4 border-t border-green-200">
                  <Text className="text-base font-medium text-gray-700 mb-3">Rate this volunteer's service:</Text>
                  <TouchableOpacity
                    onPress={() => setShowRatingModal(true)}
                    className="bg-gradient-to-r from-yellow-400 to-yellow-500 py-3 px-6 rounded-xl self-start shadow-lg"
                  >
                    <View className="flex-row items-center">
                      <MaterialIcons name="star" size={20} color="#fff" />
                      <Text className="text-white font-semibold ml-2 text-base">Rate Volunteer</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}
              
              {/* Show rating confirmation if already rated */}
              {hasRated && (
                <View className="mt-4 pt-4 border-t border-green-200">
                  <View className="flex-row items-center">
                    <MaterialIcons name="check-circle" size={20} color="#16a34a" />
                    <Text className="text-green-600 ml-2 font-medium">Thank you for rating!</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Donation Details */}
          <View className="mt-8">
            <Text className="text-lg font-bold text-gray-900 mb-4">Donation Details</Text>
            <View className="flex-row justify-between">
              <View className="bg-indigo-50 rounded-xl p-4 flex-1 mr-4">
                <MaterialIcons name="category" size={24} color="#6366f1" />
                <Text className="text-gray-600 text-sm mt-2">Type</Text>
                <Text className="text-gray-900 font-bold mt-1">{donation?.Types}</Text>
              </View>
              <View className="bg-indigo-50 rounded-xl p-4 flex-1">
                <MaterialIcons name="inventory" size={24} color="#6366f1" />
                <Text className="text-gray-600 text-sm mt-2">Quantity</Text>
                <Text className="text-gray-900 font-bold mt-1">{donation?.Quantity}</Text>
              </View>
            </View>

            <View className="mt-6">
              <Text className="text-lg font-bold text-gray-900 mb-3">Description</Text>
              <Text className="text-gray-600 leading-6">{donation?.Details}</Text>
            </View>

            <View className="mt-6">
              <Text className="text-lg font-bold text-gray-900 mb-3">Time Details</Text>
              <View className="bg-gray-50 rounded-xl p-4">
                <View className="flex-row items-center mb-4">
                  <MaterialIcons name="access-time" size={20} color="#6366f1" />
                  <View className="ml-3">
                    <Text className="text-gray-600 text-sm">Producing Time</Text>
                    <Text className="text-gray-900 font-medium mt-1">
                      {donation?.Producing ? new Date(donation.Producing as string).toLocaleString() : ''}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center">
                  <MaterialIcons name="timer" size={20} color="#6366f1" />
                  <View className="ml-3">
                    <Text className="text-gray-600 text-sm">Lasting Until</Text>
                    <Text className="text-gray-900 font-medium mt-1">
                      {donation?.Lasting ? new Date(donation.Lasting as string).toLocaleString() : ''}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Timeline - Updated to match donor's implementation */}
          {donation.status !== 'cancelled' && (
            <View className="bg-white rounded-xl p-4 border border-gray-100 mt-8 mb-8">
              <Text className="font-bold text-gray-800 mb-3">Timeline</Text>
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
                    customLabel = 'You Rejected';
                    customDescription = 'You rejected the donation offer.';
                  } else if (['volunteer is assigned', 'on the way to receive food', 'food collected', 'on the way to deliver food', 'delivered the food', 'receiver confirmed'].includes(donation?.status || '')) {
                    isCompleted = true;
                    customLabel = 'You Accepted';
                    customDescription = 'You accepted the donation offer.';
                  } else if (donation?.status === 'approvedF') {
                    isCurrent = true;
                    customLabel = 'Your Decision';
                    customDescription = 'You need to accept or reject the donation offer.';
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
                        <Text className={`font-medium text-base ${isCompleted ? 'text-green-700' : isCurrent ? 'text-blue-700' : 'text-gray-400'}`}>{customLabel}</Text>
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
                      <Text className={`font-medium text-base ${isCompleted ? 'text-green-700' : isCurrent ? 'text-blue-700' : 'text-gray-400'}`}>{stage.label}</Text>
                      <Text className={`text-sm ${isCompleted ? 'text-green-600' : isCurrent ? 'text-blue-600' : 'text-gray-400'}`}>{stage.description}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Accept/Reject only if status is 'approved' */}
          {donation.status === 'approved' && (
            <View className="flex-row space-x-4 mt-8 mb-8">
              <TouchableOpacity 
                className="flex-1 bg-red-600 rounded-xl py-4"
                onPress={() => handleApproval('rejectedF')}
                disabled={isLoading}
              >
                <View className="flex-row items-center justify-center">
                  <MaterialIcons name="close" size={24} color="#fff" />
                  <Text className="text-white font-bold ml-2">Reject</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity 
                className="flex-1 bg-green-600 rounded-xl py-4"
                onPress={() => handleApproval('approvedF')}
                disabled={isLoading}
              >
                <View className="flex-row items-center justify-center">
                  <MaterialIcons name="check" size={24} color="#fff" />
                  <Text className="text-white font-bold ml-2">Accept</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Receiver Confirmation if status is 'delivered the food' */}
          {donation.status === 'delivered the food' && (
            <View className="flex-row space-x-4 mt-8 mb-8">
              <TouchableOpacity
                className="flex-1 bg-red-600 rounded-xl py-4"
                onPress={() => handleReceiverConfirm(false)}
                disabled={isLoading}
              >
                <View className="flex-row items-center justify-center">
                  <MaterialIcons name="close" size={24} color="#fff" />
                  <Text className="text-white font-bold ml-2">No, I didn't receive</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-green-600 rounded-xl py-4"
                onPress={() => handleReceiverConfirm(true)}
                disabled={isLoading}
              >
                <View className="flex-row items-center justify-center">
                  <MaterialIcons name="check" size={24} color="#fff" />
                  <Text className="text-white font-bold ml-2">Yes, I received</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Self-Collect and Cancel Banner */}
          {donation?.status === 'self_collect_offer' && (
            <View className="bg-yellow-100 p-4 rounded-xl mt-4">
              <Text className="text-yellow-800 font-bold mb-2">
                No volunteers are available. You can self-collect or cancel the donation.
              </Text>
              <TouchableOpacity
                className="bg-orange-500 py-3 rounded-xl items-center mt-2"
                onPress={handleSelfCollect}
              >
                <Text className="text-white font-bold">Self-Collect</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-red-500 py-3 rounded-xl items-center mt-2"
                onPress={handleCancelDonation}
              >
                <Text className="text-white font-bold">Cancel Donation</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Rating Modal */}
      <Modal
        visible={showRatingModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRatingModal(false)}
      >
        <View className="flex-1 bg-black bg-opacity-50 justify-center items-center">
          <View className="bg-white rounded-3xl p-8 mx-4 w-96">
            <Text className="text-2xl font-bold text-center mb-2 text-gray-800">Rate Volunteer</Text>
            <Text className="text-center text-gray-600 mb-8 text-base">How would you rate {volunteerData?.name || 'Volunteer'}?</Text>
            
            {/* Star Rating */}
            <View className="flex-row justify-center mb-8">
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setSelectedRating(star)}
                  className="mx-2"
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
            <Text className="text-center text-lg font-semibold mb-8 text-gray-700">
              {selectedRating === 0 ? 'Select a rating' : `${selectedRating}/5 stars`}
            </Text>
            
            <View className="flex-row space-x-4">
              <TouchableOpacity
                onPress={() => {
                  setShowRatingModal(false);
                  setSelectedRating(0);
                }}
                className="flex-1 bg-gray-300 py-4 rounded-xl"
              >
                <Text className="text-center font-semibold text-gray-700">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRateVolunteer}
                className={`flex-1 py-4 rounded-xl ${
                  selectedRating > 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : 'bg-gray-300'
                }`}
                disabled={selectedRating === 0}
              >
                <Text className={`text-center font-semibold ${
                  selectedRating > 0 ? 'text-white' : 'text-gray-500'
                }`}>
                  Submit Rating
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DonationDetail;