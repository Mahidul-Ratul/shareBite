import React, { useState, useEffect } from 'react';
import { View, ScrollView, Image, Text, TouchableOpacity, Alert, Dimensions, Pressable, Modal, Linking, Platform, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../../constants/supabaseConfig';

const { width } = Dimensions.get('window');

const DonationDetail = () => {
  const { id } = useLocalSearchParams();
  const [donation, setDonation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState<any>(null);
  const [receiver, setReceiver] = useState<any>(null);
  const [donorData, setDonorData] = useState<any>(null);
  const [contactPersonData, setContactPersonData] = useState<any>(null);
  const [images, setImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [selectedVolunteers, setSelectedVolunteers] = useState<any[]>([]);

  // Geocode an address to lat/lng using OpenCage API
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
    } catch (e) {
      console.warn('Geocoding failed for address:', address, e);
      return null;
    }
  };

  // Calculate distance between two lat/lng points (Haversine)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Fetch and filter volunteers by distance
  const fetchNearbyVolunteers = async (donationAddress: string) => {
    setIsLoading(true);
    try {
      const donationCoords = await geocodeAddress(donationAddress);
      console.log('Donation coords:', donationCoords, 'for address:', donationAddress);
      if (!donationCoords) {
        setVolunteers([]);
        setIsLoading(false);
        return;
      }
      const { data: vols, error } = await supabase.from('volunteer').select('*');
      if (error || !vols) {
        console.log('Supabase error or no volunteers:', error);
        setVolunteers([]);
        setIsLoading(false);
        return;
      }
      console.log('Fetched volunteers:', vols);
      const filtered: any[] = [];
      for (const v of vols) {
        if (!v.address) continue;
        const vCoords = await geocodeAddress(v.address);
        console.log(`Volunteer ${v.name} coords:`, vCoords, 'for address:', v.address);
        if (!vCoords) continue;
        const volunteerDistance = calculateDistance(donationCoords.lat, donationCoords.lng, vCoords.lat, vCoords.lng);
        console.log(`Volunteer ${v.name} distance:`, volunteerDistance);
        if (volunteerDistance <= 200) filtered.push({ ...v, distance: volunteerDistance });
      }
      setVolunteers(filtered.sort((a, b) => a.distance - b.distance));
      console.log('Filtered volunteers:', filtered);
    } catch (e) {
      console.log('Error in fetchNearbyVolunteers:', e);
      setVolunteers([]);
    } finally {
      setIsLoading(false);
    }
  };

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

  // Fetch donation data function
  const fetchDonationData = async () => {
    try {
      const { data, error } = await supabase
        .from('donation')
        .select('*')
        .eq('id', id)
        .single();
      if (error) {
        throw error;
      }
      setDonation(data);
      if (data?.ngo_id) {
        const { data: receiverData, error: receiverError } = await supabase
          .from('receiver')
          .select('*')
          .eq('id', data.ngo_id)
          .single();
        if (receiverError) throw receiverError;
        setReceiver(receiverData);
      }
      // Fetch donor info
      if (data?.donor_id) {
        try {
          const { data: donorInfo, error: donorError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.donor_id)
            .single();
          if (!donorError && donorInfo) {
            console.log('Donor data fetched:', donorInfo);
            setDonorData(donorInfo);
          } else {
            console.log('Donor fetch error:', donorError);
          }
        } catch (err) {
          console.log('Donor fetch exception:', err);
        }
      }

      // Set contact person data from donation
      if (data) {
        const contactData = {
          name: data.Name || null,
          contact: data.Contact || null,
          location: data.Location || null
        };
        console.log('Contact person data:', contactData);
        setContactPersonData(contactData);
      }
      // Set images if available
      if (data?.images && Array.isArray(data.images)) {
        setImages(data.images);
      } else if (data?.image) {
        setImages([data.image]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load donation details');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch donation data when the component mounts
  useEffect(() => {
    if (id) {
      fetchDonationData();
    }
  }, [id]);

  // When modal opens for volunteer assignment, fetch nearby volunteers
  useEffect(() => {
    // Use 'Location' (uppercase L) for donation address
    if (modalVisible && selectedOption === 'volunteer' && donation?.Location) {
      fetchNearbyVolunteers(donation.Location);
    } else if (!modalVisible) {
      setVolunteers([]);
      setSelectedVolunteer(null);
    }
  }, [modalVisible, selectedOption, donation]);

  const handleApproval = async (status: 'approved' | 'rejected' | 'approvedF') => {
    setIsLoading(true);
    try {
      // Check if this is a request-based donation
      const isRequestBased = donation.request_id;
      
      let newStatus = status;
      if (status === 'approved' && isRequestBased) {
        // For request-based donations, skip receiver acceptance and go directly to volunteer assignment
        newStatus = 'approvedF';
      }
      
      const { error } = await supabase
        .from('donation')
        .update({ status: newStatus })
        .eq('id', id);
      if (error) throw error;
      
      if (status === 'approved') {
        if (isRequestBased) {
          // For request-based donations: notify volunteers directly
          await notifyNearbyVolunteersForRequest();
          
          // Notify donor
          const { error: notifError2 } = await supabase.from('notifications').insert([
            {
              title: 'Donation Approved',
              message: `Your donation (${donation.Types} - ${donation.Quantity}) has been approved by the admin. Volunteers will be notified.`,
              type: 'accepted',
              isread: false,
              for: 'donor',
              donation_id: donation.id,
              created_at: new Date().toISOString(),
              donor_id: donation.donor_id,
            }
          ]);
          if (notifError2) {
            console.error('Donor Notification Error:', notifError2.message);
          }
        } else {
          // For normal donations: notify receiver for acceptance
          const { error: notifError1 } = await supabase.from('notifications').insert([
            {
              title: 'New Donation Offer',
              message: `You have received a new donation offer: ${donation.Types} - ${donation.Quantity}`,
              type: 'assigned',
              isread: false,
              for: 'receiver',
              donation_id: donation.id,
              created_at: new Date().toISOString(),
              ngo_id: donation.ngo_id,
            }
          ]);
          // Notify donor
          const { error: notifError2 } = await supabase.from('notifications').insert([
            {
              title: 'Donation Approved',
              message: `Your donation (${donation.Types} - ${donation.Quantity}) has been approved by the admin.`,
              type: 'accepted',
              isread: false,
              for: 'donor',
              donation_id: donation.id,
              created_at: new Date().toISOString(),
              donor_id: donation.donor_id,
            }
          ]);
          if (notifError1) {
            console.error('Receiver Notification Error:', notifError1.message);
          }
          if (notifError2) {
            console.error('Donor Notification Error:', notifError2.message);
          }
        }
      }
      
      const successMessage = isRequestBased && status === 'approved' 
        ? 'Donation approved. Volunteers will be notified automatically.'
        : `Donation has been ${status}`;
        
      // Refresh donation data to show updated status
      await fetchDonationData();
        
      Alert.alert('Success', successMessage, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update donation status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssign = async () => {
    setIsLoading(true);
    try {
      let updateData: any = { status: 'assigned' };
      if (selectedOption === 'volunteer') {
        if (!selectedVolunteer) {
          Alert.alert('Error', 'Please select a volunteer');
          setIsLoading(false);
          return;
        }
        updateData.volunteer_id = selectedVolunteer.id;
      } else if (selectedOption === 'receiver') {
        updateData.assigned_to = 'receiver';
        updateData.volunteer_id = 'ngo' // Set volunteer_id to 'ngo' if NGO collects
      }
      const { error } = await supabase
        .from('donation')
        .update(updateData)
        .eq('id', donation.id);
      if (error) throw error;
      // Send notification
      const { error: notifError } = await supabase.from('notifications').insert([
        {
          title: selectedOption === 'volunteer' ? 'Assigned to Volunteer' : 'Please Collect Donation',
          message: `Donation ${donation.Types} needs to be collected`,
          type: 'collection',
          isread: false,
          for: selectedOption === 'volunteer' ? 'volunteer' : 'receiver',
          donation_id: donation.id,
          created_at: new Date().toISOString(),
          volunteer_id: selectedOption === 'volunteer' ? selectedVolunteer?.id : null,
          ngo_id: selectedOption === 'receiver' ? donation.ngo_id : null,
        }
      ]);
      if (notifError) throw notifError;
      Alert.alert('Success', 'Donation assignment updated successfully');
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update donation assignment');
    } finally {
      setIsLoading(false);
    }
  };

  const notifyNearbyVolunteersForRequest = async () => {
    try {
      console.log('Starting notifyNearbyVolunteersForRequest for donation:', donation.id);
      
      // Get receiver location to find nearby volunteers
      if (!donation.ngo_id) {
        console.error('No receiver ID found for request-based donation');
        return;
      }

      // Fetch receiver location
      const { data: receiverData, error: receiverError } = await supabase
        .from('receiver')
        .select('location')
        .eq('id', donation.ngo_id)
        .single();

      if (receiverError || !receiverData) {
        console.error('Failed to fetch receiver location:', receiverError);
        return;
      }

      console.log('Receiver location data:', receiverData.location);

      // Parse receiver location
      let receiverLat, receiverLng;
      try {
        const locationData = JSON.parse(receiverData.location);
        receiverLat = locationData.latitude;
        receiverLng = locationData.longitude;
        console.log('Parsed receiver coordinates:', receiverLat, receiverLng);
      } catch (error) {
        console.error('Failed to parse receiver location:', error);
        return;
      }

      // Fetch all volunteers
      const { data: volunteers, error: volunteersError } = await supabase
        .from('volunteer')
        .select('*');

      if (volunteersError || !volunteers) {
        console.error('Failed to fetch volunteers:', volunteersError);
        return;
      }

      console.log('Total volunteers found:', volunteers.length);

      // Find volunteers within 15km radius
      const nearbyVolunteers = volunteers.filter((volunteer) => {
        if (!volunteer.location) {
          console.log('Volunteer has no location:', volunteer.id);
          return false;
        }
        
        try {
          // Robustly handle different location formats: WKT, JSON, object
          let volLocation = null;
          if (typeof volunteer.location === 'string') {
            if (volunteer.location.startsWith('POINT(')) {
              // Parse WKT: "POINT(lon lat)"
              const match = volunteer.location.match(/POINT\\(([-\\d\\.]+) ([-\\d\\.]+)\\)/);
              if (match) {
                volLocation = { longitude: parseFloat(match[1]), latitude: parseFloat(match[2]) };
              }
            } else {
              // Try JSON
              const parsed = JSON.parse(volunteer.location);
              if (parsed && (parsed.latitude || parsed.lat) && (parsed.longitude || parsed.lng)) {
                volLocation = {
                  latitude: parsed.latitude ?? parsed.lat,
                  longitude: parsed.longitude ?? parsed.lng,
                };
              }
            }
          } else if (typeof volunteer.location === 'object' && volunteer.location !== null) {
            volLocation = {
              latitude: volunteer.location.latitude ?? volunteer.location.lat,
              longitude: volunteer.location.longitude ?? volunteer.location.lng,
            };
          }

          if (!volLocation || typeof volLocation.latitude !== 'number' || typeof volLocation.longitude !== 'number') {
            console.log('Invalid volunteer location format:', volunteer.id, volunteer.location);
            return false;
          }
          
          const distance = calculateDistance(
            receiverLat,
            receiverLng,
            volLocation.latitude,
            volLocation.longitude
          );
          
          console.log(`Volunteer ${volunteer.id} distance: ${distance.toFixed(2)}km`);
          return distance <= 15; // 15km radius
        } catch (error) {
          console.error('Error calculating distance for volunteer:', volunteer.id, error, 'Location:', volunteer.location);
          return false;
        }
      });

      console.log('Nearby volunteers found:', nearbyVolunteers.length);

      if (nearbyVolunteers.length === 0) {
        console.log('No nearby volunteers found for request-based donation');
        // Still create a notification for all volunteers as fallback
        const fallbackNotifications = volunteers.map((volunteer) => ({
          title: 'New Request-Based Donation',
          message: `A donation (${donation.Types} - ${donation.Quantity}) is available for delivery to a specific receiver.`,
          type: 'assigned',
          isread: false,
          for: 'volunteer',
          donation_id: donation.id,
          created_at: new Date().toISOString(),
          volunteer_id: volunteer.id,
          ngo_id: donation.ngo_id,
        }));
        
        const { error: fallbackError } = await supabase.from('notifications').insert(fallbackNotifications);
        if (fallbackError) {
          console.error('Failed to send fallback notifications:', fallbackError);
        } else {
          console.log(`Sent fallback notifications to ${volunteers.length} volunteers`);
        }
        return;
      }

      // Create notifications for all nearby volunteers
      const notifications = nearbyVolunteers.map((volunteer) => ({
        title: 'New Request-Based Donation',
        message: `A donation (${donation.Types} - ${donation.Quantity}) is available for delivery to a specific receiver.`,
        type: 'assigned',
        isread: false,
        for: 'volunteer',
        donation_id: donation.id,
        created_at: new Date().toISOString(),
        volunteer_id: volunteer.id,
        ngo_id: donation.ngo_id,
      }));

      console.log('Creating notifications for volunteers:', notifications.length);

      // Insert notifications
      const { error: notifError } = await supabase.from('notifications').insert(notifications);
      if (notifError) {
        console.error('Failed to notify volunteers:', notifError);
      } else {
        console.log(`Successfully notified ${nearbyVolunteers.length} nearby volunteers for request-based donation`);
      }
    } catch (error) {
      console.error('Error in notifyNearbyVolunteersForRequest:', error);
    }
  };

  const handleNotifyVolunteers = async () => {
    if (selectedVolunteers.length === 0) {
      Alert.alert('Error', 'Please select at least one volunteer to notify.');
      return;
    }
    setIsLoading(true);
    try {
      // For each selected volunteer, insert a unique notification row
      const notifications = selectedVolunteers.map((vol) => ({
        title: 'New Delivery Opportunity',
        message: `A new donation (${donation.Types} - ${donation.Quantity}) is available for delivery.`,
        type: 'assigned',
        isread: false,
        for: 'volunteer',
        donation_id: donation.id,
        created_at: new Date().toISOString(),
        volunteer_id: vol.id, // Unique per volunteer
        ngo_id: donation.ngo_id,
      }));
      // Insert all notifications at once
      const { error } = await supabase.from('notifications').insert(notifications);
      if (error) throw error;
      Alert.alert('Success', 'Selected volunteers have been notified.');
      setModalVisible(false);
      setSelectedVolunteers([]);
    } catch (error) {
      Alert.alert('Error', 'Failed to notify volunteers.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to get status display info
  const getStatusBanner = () => {
    if (!donation?.status) return null;
    
    switch (donation.status) {
      case 'pending':
        return {
          color: '#fbbf24',
          icon: 'hourglass-empty',
          text: 'Pending Approval',
          bg: 'bg-yellow-50',
          textColor: 'text-yellow-800',
        };
      case 'approved':
        return {
          color: '#fbbf24',
          icon: 'hourglass-empty',
          text: 'Waiting for Receiver Confirmation',
          bg: 'bg-yellow-50',
          textColor: 'text-yellow-800',
        };
      case 'approvedF':
        return {
          color: '#16a34a',
          icon: 'check-circle',
          text: donation.request_id 
            ? 'Approved – Volunteers Notified (Request-Based)'
            : 'Approved – Assign Volunteer or NGO',
          bg: 'bg-green-50',
          textColor: 'text-green-800',
        };
      case 'assigned':
        return {
          color: '#3b82f6',
          icon: 'assignment-ind',
          text: donation.volunteer_id && donation.volunteer_id !== 'ngo'
            ? 'Assigned to Volunteer'
            : donation.volunteer_id === 'ngo' || donation.assigned_to === 'receiver'
            ? 'Assigned to NGO'
            : 'Assigned',
          bg: 'bg-blue-50',
          textColor: 'text-blue-800',
        };
      case 'completed':
        return {
          color: '#16a34a',
          icon: 'check-circle',
          text: 'Donation Completed',
          bg: 'bg-green-50',
          textColor: 'text-green-800',
        };
      case 'cancelled':
        return {
          color: '#dc2626',
          icon: 'cancel',
          text: 'Donation Cancelled',
          bg: 'bg-red-50',
          textColor: 'text-red-800',
        };
      case 'rejected':
        return {
          color: '#dc2626',
          icon: 'cancel',
          text: 'Donation Rejected',
          bg: 'bg-red-50',
          textColor: 'text-red-800',
        };
      case 'rejectedF':
        return {
          color: '#ef4444',
          icon: 'close',
          text: 'Receiver Rejected',
          bg: 'bg-red-50',
          textColor: 'text-red-800',
        };
      case 'volunteer is assigned':
        return {
          color: '#3b82f6',
          icon: 'local-shipping',
          text: 'Volunteer Assigned - Awaiting Pickup',
          bg: 'bg-blue-50',
          textColor: 'text-blue-800',
        };
      case 'on the way to receive food':
        return {
          color: '#3b82f6',
          icon: 'directions-run',
          text: 'Volunteer On The Way To Donor',
          bg: 'bg-blue-50',
          textColor: 'text-blue-800',
        };
      case 'food collected':
        return {
          color: '#f59e42',
          icon: 'restaurant',
          text: 'Food Collected By Volunteer',
          bg: 'bg-orange-50',
          textColor: 'text-orange-800',
        };
      case 'on the way to deliver food':
        return {
          color: '#6366f1',
          icon: 'delivery-dining',
          text: 'Volunteer Delivering Food',
          bg: 'bg-indigo-50',
          textColor: 'text-indigo-800',
        };
      case 'delivered the food':
        return {
          color: '#16a34a',
          icon: 'check-circle',
          text: 'Food Delivered To Receiver',
          bg: 'bg-green-50',
          textColor: 'text-green-800',
        };
      case 'receiver confirmed':
        return {
          color: '#16a34a',
          icon: 'check-circle',
          text: 'Receiver Confirmed',
          bg: 'bg-green-50',
          textColor: 'text-green-800',
        };
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }
  if (!donation) {
    return <Text>Donation not found or inaccessible.</Text>;
  }

  // Place this banner at the top of the ScrollView, after the image carousel
  const statusBanner = getStatusBanner();

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
                    source={{ uri: image }}
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
          {/* Preferred NGO Section */}
          {receiver && (
            <View className="mt-6 bg-blue-50 rounded-xl p-4">
              <Text className="text-lg font-bold text-gray-900 mb-2">Preferred NGO</Text>
              <View className="flex-row items-center">
                <MaterialIcons name="business" size={24} color="#6366f1" />
                <View className="ml-3">
                  <Text className="text-gray-900 font-medium">{receiver?.name || 'N/A'}</Text>
                  <Text className="text-gray-600 text-sm mt-1">{receiver?.areas || 'N/A'}</Text>
                </View>
              </View>
            </View>
          )}

          <View className="mt-8">
            <Text className="text-lg font-bold text-gray-900 mb-4">Donation Details</Text>
            <View className="flex-row justify-between">
              <View className="bg-indigo-50 rounded-xl p-4 flex-1 mr-4">
                <MaterialIcons name="category" size={24} color="#6366f1" />
                <Text className="text-gray-600 text-sm mt-2">Type</Text>
                <Text className="text-gray-900 font-bold mt-1">{donation?.Types || 'N/A'}</Text>
              </View>
              <View className="bg-indigo-50 rounded-xl p-4 flex-1">
                <MaterialIcons name="inventory" size={24} color="#6366f1" />
                <Text className="text-gray-600 text-sm mt-2">Quantity</Text>
                <Text className="text-gray-900 font-bold mt-1">{donation?.Quantity || 'N/A'}</Text>
              </View>
            </View>

            <View className="mt-6">
              <Text className="text-lg font-bold text-gray-900 mb-3">Description</Text>
              <Text className="text-gray-600 leading-6">{donation?.Details || 'No description available'}</Text>
            </View>

            {donation?.Producing || donation?.Lasting ? (
              <View className="mt-6">
                <Text className="text-lg font-bold text-gray-900 mb-3">Time Details</Text>
                <View className="bg-gray-50 rounded-xl p-4">
                  {donation?.Producing && (
                    <View className="flex-row items-center mb-4">
                      <MaterialIcons name="access-time" size={20} color="#6366f1" />
                      <View className="ml-3">
                        <Text className="text-gray-600 text-sm">Producing Time</Text>
                        <Text className="text-gray-900 font-medium mt-1">
                          {(() => {
                            try {
                              return new Date(donation.Producing).toLocaleString();
                            } catch (error) {
                              return donation.Producing || 'Invalid date';
                            }
                          })()}
                        </Text>
                      </View>
                    </View>
                  )}
                  {donation?.Lasting && (
                    <View className="flex-row items-center">
                      <MaterialIcons name="timer" size={20} color="#6366f1" />
                      <View className="ml-3">
                        <Text className="text-gray-600 text-sm">Lasting Until</Text>
                        <Text className="text-gray-900 font-medium mt-1">
                          {(() => {
                            try {
                              return new Date(donation.Lasting).toLocaleString();
                            } catch (error) {
                              return donation.Lasting || 'Invalid date';
                            }
                          })()}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            ) : null}
          </View>

          {/* Donor Information */}
          {donorData && (
            <View className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 shadow-lg border border-blue-100">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold text-gray-900">Donor Information</Text>
                <TouchableOpacity onPress={() => handlePhoneCall(donorData?.phoneNumber || donorData?.phone || '')}>
                  <MaterialIcons name="phone" size={28} color="#6366f1" />
                </TouchableOpacity>
              </View>
              <View className="space-y-3">
                <View className="flex-row items-center">
                  <View className="bg-blue-100 rounded-full p-2 mr-3">
                    <MaterialIcons name="person" size={20} color="#6366f1" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 font-semibold">{donorData?.fullName || donorData?.name || 'No name available'}</Text>
                    {(donorData?.address || donorData?.location) && (
                      <Text className="text-gray-600 text-sm mt-1">{donorData?.address || donorData?.location}</Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity 
                  className="flex-row items-center"
                  onPress={() => handlePhoneCall(donorData?.phoneNumber || donorData?.phone || '')}
                >
                  <View className="bg-blue-100 rounded-full p-2 mr-3">
                    <MaterialIcons name="phone" size={20} color="#6366f1" />
                  </View>
                  <Text className="text-blue-600 font-medium">
                    {donorData?.phoneNumber || donorData?.phone || 'No phone number available'}
                  </Text>
                </TouchableOpacity>
                <View className="flex-row items-center">
                  <View className="bg-blue-100 rounded-full p-2 mr-3">
                    <MaterialIcons name="email" size={20} color="#6366f1" />
                  </View>
                  <Text className="text-gray-600">
                    {donorData?.email || 'No email available'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Contact Person Information */}
          {contactPersonData && (contactPersonData.name || contactPersonData.contact) && (
            <View className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 shadow-lg border border-purple-100">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold text-gray-900">Contact Person</Text>
                <TouchableOpacity onPress={() => handlePhoneCall(contactPersonData?.contact || '')}>
                  <MaterialIcons name="phone" size={28} color="#9333ea" />
                </TouchableOpacity>
              </View>
              <View className="space-y-3">
                <View className="flex-row items-center">
                  <View className="bg-purple-100 rounded-full p-2 mr-3">
                    <MaterialIcons name="person" size={20} color="#9333ea" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 font-semibold">{contactPersonData?.name || 'No name available'}</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  className="flex-row items-center"
                  onPress={() => handlePhoneCall(contactPersonData?.contact || '')}
                >
                  <View className="bg-purple-100 rounded-full p-2 mr-3">
                    <MaterialIcons name="phone" size={20} color="#9333ea" />
                  </View>
                  <Text className="text-purple-600 font-medium">
                    {contactPersonData?.contact || 'No phone number available'}
                  </Text>
                </TouchableOpacity>
                <View className="flex-row items-center">
                  <View className="bg-purple-100 rounded-full p-2 mr-3">
                    <MaterialIcons name="location-on" size={20} color="#9333ea" />
                  </View>
                  <Text className="text-gray-600">
                    {contactPersonData?.location || 'No location available'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Receiver Information */}
          {receiver && (
            <View className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 shadow-lg border border-green-100">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold text-gray-900">Receiver Information</Text>
                <TouchableOpacity onPress={() => handlePhoneCall(receiver?.phone || '')}>
                  <MaterialIcons name="phone" size={28} color="#16a34a" />
                </TouchableOpacity>
              </View>
              <View className="space-y-3">
                <View className="flex-row items-center">
                  <View className="bg-green-100 rounded-full p-2 mr-3">
                    <MaterialIcons name="business" size={20} color="#16a34a" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 font-semibold">{receiver?.name || 'No name available'}</Text>
                    <Text className="text-gray-600 text-sm mt-1">{receiver?.type || 'No type available'}</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  className="flex-row items-center"
                  onPress={() => handlePhoneCall(receiver?.phone || '')}
                >
                  <View className="bg-green-100 rounded-full p-2 mr-3">
                    <MaterialIcons name="phone" size={20} color="#16a34a" />
                  </View>
                  <Text className="text-green-600 font-medium">
                    {receiver?.phone || 'No phone number available'}
                  </Text>
                </TouchableOpacity>
                <View className="flex-row items-center">
                  <View className="bg-green-100 rounded-full p-2 mr-3">
                    <MaterialIcons name="email" size={20} color="#16a34a" />
                  </View>
                  <Text className="text-gray-600">
                    {receiver?.email || 'No email available'}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <View className="bg-green-100 rounded-full p-2 mr-3">
                    <MaterialIcons name="location-on" size={20} color="#16a34a" />
                  </View>
                  <Text className="text-gray-600">
                    {receiver?.location || 'No location available'}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <View className="bg-green-100 rounded-full p-2 mr-3">
                    <MaterialIcons name="groups" size={20} color="#16a34a" />
                  </View>
                  <Text className="text-gray-600">
                    {receiver?.areas || 'No areas available'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Status Banner - only show if known status */}
          {statusBanner && (
            <View className={`mx-6 mt-6 rounded-2xl p-6 flex-row items-center shadow-lg border-2 border-white ${statusBanner.bg}`}
              style={{ elevation: 6 }}
            >
              <MaterialIcons name={statusBanner.icon as any} size={32} color={statusBanner.color} />
              <Text className={`ml-4 font-extrabold text-xl ${statusBanner.textColor}`}>{statusBanner.text}</Text>
            </View>
          )}

          {/* Volunteer Information - show full info if available */}
          {donation?.volunteer_id && donation.volunteer_id !== 'ngo' && (
            <View className="mt-6 bg-gradient-to-r from-green-100 via-blue-100 to-purple-100 rounded-2xl p-6 shadow-lg border border-green-200">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold text-gray-900">Volunteer Information</Text>
                <VolunteerPhoneButton volunteerId={donation.volunteer_id} />
              </View>
              <VolunteerInfoContent volunteerId={donation.volunteer_id} />
            </View>
          )}

          {/* Admin Actions - only show if pending */}
          {donation?.status === 'pending' && (
            <View className="flex-row space-x-4 mt-8 mb-8">
              <TouchableOpacity
                className="flex-1 bg-red-600 rounded-xl py-4"
                onPress={() => handleApproval('rejected')}
                disabled={isLoading}
              >
                <View className="flex-row items-center justify-center">
                  <MaterialIcons name="close" size={24} color="#fff" />
                  <Text className="text-white font-bold ml-2">Reject</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 bg-green-600 rounded-xl py-4"
                onPress={() => handleApproval('approved')}
                disabled={isLoading}
              >
                <View className="flex-row items-center justify-center">
                  <MaterialIcons name="check" size={24} color="#fff" />
                  <Text className="text-white font-bold ml-2">Approve</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Assignment Section - only show if approvedF */}
          {donation?.status === 'approvedF' && (
            <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 mt-6">
              <View className="flex-row items-center">
                <MaterialIcons name="hourglass-empty" size={24} color="#3b82f6" />
                <Text className="text-blue-800 font-bold ml-2">Waiting for Volunteer Assignment</Text>
              </View>
              <Text className="text-blue-700 mt-2">
                The receiver has accepted this donation. Nearby volunteers have been notified and the system is waiting for a volunteer to accept the delivery.
              </Text>
              {/* Timeline */}
              <View className="mt-6">
                <Text className="text-lg font-bold text-gray-900 mb-3">Donation Timeline</Text>
                {(() => {
                  // Check if this is a request-based donation
                  const isRequestBased = donation?.request_id;
                  
                  // Define timeline stages based on donation type
                  const timelineStages = isRequestBased ? [
                    { key: 'pending', label: 'Request Submitted', description: 'Receiver submitted a donation request.' },
                    { key: 'approved', label: 'Request Approved', description: 'Admin approved the donation request.' },
                    { key: 'approvedF', label: 'Ready for Assignment', description: 'Donation is ready to be assigned to a volunteer.' },
                    { key: 'volunteer is assigned', label: 'Volunteer Assigned', description: 'A volunteer has been assigned to collect the donation.' },
                    { key: 'on the way to receive food', label: 'Volunteer On The Way', description: 'Volunteer is on the way to collect the donation.' },
                    { key: 'food collected', label: 'Food Collected', description: 'The food has been collected by the volunteer.' },
                    { key: 'on the way to deliver food', label: 'On The Way To Receiver', description: 'Volunteer is delivering the food to the receiver.' },
                    { key: 'delivered the food', label: 'Donation Delivered', description: 'The donation has been delivered to the receiver.' },
                    { key: 'receiver confirmed', label: 'Receiver Confirmed', description: 'The receiver confirmed receiving the food.' },
                  ] : [
                    { key: 'pending', label: 'Donation Requested', description: 'Donor posted a new donation request.' },
                    { key: 'approved', label: 'Donation Approved', description: 'Admin approved the donation request.' },
                    { key: 'approvedF', label: 'Ready for Assignment', description: 'Donation is ready to be assigned to a volunteer or NGO.' },
                    { key: 'receiver_acceptance', label: 'Receiver Decision', description: 'Receiver will accept or reject the donation offer.' },
                    { key: 'volunteer is assigned', label: 'Volunteer Assigned', description: 'A volunteer has been assigned to collect the donation.' },
                    { key: 'on the way to receive food', label: 'Volunteer On The Way', description: 'Volunteer is on the way to collect the donation.' },
                    { key: 'food collected', label: 'Food Collected', description: 'The food has been collected by the volunteer.' },
                    { key: 'on the way to deliver food', label: 'On The Way To Receiver', description: 'Volunteer is delivering the food to the receiver.' },
                    { key: 'delivered the food', label: 'Donation Delivered', description: 'The donation has been delivered to the receiver.' },
                    { key: 'receiver confirmed', label: 'Receiver Confirmed', description: 'The receiver confirmed receiving the food.' },
                  ];

                  return timelineStages.map((stage, idx, arr) => {
                    // Handle receiver acceptance step for non-request-based donations
                    if (stage.key === 'receiver_acceptance' && !isRequestBased) {
                      // Show this step when status is approvedF, rejectedF, or any status after approvedF
                      const shouldShow = ['approvedF', 'rejectedF', 'volunteer is assigned', 'on the way to receive food', 'food collected', 'on the way to deliver food', 'delivered the food', 'receiver confirmed'].includes(donation.status);
                      if (!shouldShow) return null;
                      
                      // Determine if this step is completed, current, or pending
                      let isCompleted = false;
                      let isCurrent = false;
                      let customLabel = stage.label;
                      let customDescription = stage.description;
                      
                      if (donation.status === 'rejectedF') {
                        isCompleted = true;
                        customLabel = 'Receiver Rejected';
                        customDescription = 'Receiver rejected the donation offer.';
                      } else if (['volunteer is assigned', 'on the way to receive food', 'food collected', 'on the way to deliver food', 'delivered the food', 'receiver confirmed'].includes(donation.status)) {
                        isCompleted = true;
                        customLabel = 'Receiver Accepted';
                        customDescription = 'Receiver accepted the donation offer.';
                      } else if (donation.status === 'approvedF') {
                        isCurrent = true;
                        customLabel = 'Receiver Decision';
                        customDescription = 'Waiting for receiver to accept or reject the donation offer.';
                      }
                      
                      return (
                        <View key={stage.key} className="flex-row mb-4 last:mb-0 items-center">
                          <View className="items-center mr-4">
                            <View className={`w-4 h-4 rounded-full ${isCompleted ? 'bg-green-500' : isCurrent ? 'bg-blue-500' : 'bg-gray-300'} border-2 border-white shadow`} />
                            {idx !== arr.length - 1 && (
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
                    const statusOrder = isRequestBased ? [
                      'pending',
                      'approved',
                      'approvedF',
                      'volunteer is assigned',
                      'on the way to receive food',
                      'food collected',
                      'on the way to deliver food',
                      'delivered the food',
                      'receiver confirmed',
                    ] : [
                      'pending',
                      'approved',
                      'approvedF',
                      'receiver_acceptance',
                      'volunteer is assigned',
                      'on the way to receive food',
                      'food collected',
                      'on the way to deliver food',
                      'delivered the food',
                      'receiver confirmed',
                    ];
                    const currentIdx = statusOrder.indexOf(donation.status);
                    const stageIdx = statusOrder.indexOf(stage.key);
                    const isCompleted = stageIdx < currentIdx;
                    const isCurrent = stageIdx === currentIdx;
                    
                    return (
                      <View key={stage.key} className="flex-row mb-4 last:mb-0 items-center">
                        <View className="items-center mr-4">
                          <View className={`w-4 h-4 rounded-full ${isCompleted ? 'bg-green-500' : isCurrent ? 'bg-blue-500' : 'bg-gray-300'} border-2 border-white shadow`} />
                          {idx !== arr.length - 1 && (
                            <View className={`w-0.5 h-8 ${isCompleted ? 'bg-green-200' : isCurrent ? 'bg-blue-200' : 'bg-gray-200'} my-1`} />
                          )}
                        </View>
                        <View className="flex-1">
                          <Text className={`font-medium text-base ${isCompleted ? 'text-green-700' : isCurrent ? 'text-blue-700' : 'text-gray-400'}`}>{stage.label}</Text>
                          <Text className={`text-sm ${isCompleted ? 'text-green-600' : isCurrent ? 'text-blue-600' : 'text-gray-400'}`}>{stage.description}</Text>
                        </View>
                      </View>
                    );
                  });
                })()}
              </View>
            </View>
          )}

          {/* Assignment Info - show if assigned */}
          {donation?.status === 'assigned' && (
            <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 mt-6">
              <View className="flex-row items-center">
                <MaterialIcons name="assignment-ind" size={24} color="#3b82f6" />
                <Text className="text-blue-800 font-bold ml-2">
                  {donation.volunteer_id
                    ? 'Assigned to Volunteer'
                    : donation.volunteer_id === 'ngo' || donation.assigned_to === 'receiver'
                    ? 'Assigned to NGO'
                    : 'Assigned'}
                </Text>
              </View>
              <Text className="text-blue-700 mt-2">
                {donation.volunteer_id
                  ? `Volunteer ID: ${donation.volunteer_id}`
                  : donation.assigned_to === 'receiver'
                  ? 'Your organization is responsible for collection.'
                  : 'Assignment in progress.'}
              </Text>
            </View>
          )}

          {/* Delivery Workflow Statuses */}
          {donation?.status && [
            'volunteer is assigned',
            'on the way to receive food',
            'food collected',
            'on the way to deliver food',
            'delivered the food',
          ].includes(donation.status) && (
            <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 mt-6">
              <View className="flex-row items-center">
                <MaterialIcons name="local-shipping" size={24} color="#3b82f6" />
                <Text className="text-blue-800 font-bold ml-2">
                  {(() => {
                    switch (donation.status) {
                      case 'volunteer is assigned':
                        return 'Volunteer Assigned - Awaiting Pickup';
                      case 'on the way to receive food':
                        return 'Volunteer On The Way To Donor';
                      case 'food collected':
                        return 'Food Collected By Volunteer';
                      case 'on the way to deliver food':
                        return 'Volunteer Delivering Food';
                      case 'delivered the food':
                        return 'Food Delivered To Receiver';
                      default:
                        return donation.status;
                    }
                  })()}
                </Text>
              </View>
              <Text className="text-blue-700 mt-2">
                {(() => {
                  switch (donation.status) {
                    case 'volunteer is assigned':
                      return 'A volunteer has been assigned and will collect the food soon.';
                    case 'on the way to receive food':
                      return 'The volunteer is on the way to the donor location.';
                    case 'food collected':
                      return 'The food has been collected and is ready for delivery.';
                    case 'on the way to deliver food':
                      return 'The volunteer is delivering the food to the receiver.';
                    case 'delivered the food':
                      return 'The food has been delivered to the receiver. Thank you!';
                    default:
                      return '';
                  }
                })()}
              </Text>
              {/* Optionally show volunteer info if available */}
              {donation.volunteer_id && (
                <Text className="text-blue-600 mt-2 text-xs">Volunteer ID: {donation.volunteer_id}</Text>
              )}
            </View>
          )}

          {/* Completed, Cancelled, Rejected Info */}
          {donation?.status === 'completed' && (
            <View className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 mt-6">
              <View className="flex-row items-center">
                <MaterialIcons name="check-circle" size={24} color="#16a34a" />
                <Text className="text-green-800 font-bold ml-2">Donation Completed</Text>
              </View>
              <Text className="text-green-700 mt-2">This donation has been successfully delivered and completed.</Text>
            </View>
          )}
          {donation?.status === 'cancelled' && (
            <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 mt-6">
              <View className="flex-row items-center">
                <MaterialIcons name="cancel" size={24} color="#dc2626" />
                <Text className="text-red-800 font-bold ml-2">Donation Cancelled</Text>
              </View>
              <Text className="text-red-700 mt-2">This donation has been cancelled.</Text>
            </View>
          )}
          {donation?.status === 'rejected' && (
            <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 mt-6">
              <View className="flex-row items-center">
                <MaterialIcons name="cancel" size={24} color="#dc2626" />
                <Text className="text-red-800 font-bold ml-2">Donation Rejected</Text>
              </View>
              <Text className="text-red-700 mt-2">This donation was rejected by the admin.</Text>
            </View>
          )}
          {donation?.status === 'rejectedF' && (
            <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 mt-6">
              <View className="flex-row items-center">
                <MaterialIcons name="close" size={24} color="#ef4444" />
                <Text className="text-red-800 font-bold ml-2">Receiver Rejected</Text>
              </View>
              <Text className="text-red-700 mt-2">The receiver rejected this donation offer.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default DonationDetail;

// NOTE: All volunteer assignment and notification logic below uses volunteer.id from the volunteer table, not email or auth id.
// This ensures notifications and assignments are unique and correct per volunteer.
// When assigning to NGO, volunteer_id is set to 'ngo'.
// Assignment options are only shown for status 'approvedF'.

// Helper component for volunteer phone button in header
function VolunteerPhoneButton({ volunteerId }: { volunteerId: string }) {
  const [volunteer, setVolunteer] = React.useState<any>(null);
  
  const handlePhoneCall = async (phoneNumber: string) => {
    if (!phoneNumber || phoneNumber === 'N/A') {
      Alert.alert('Error', 'Phone number not available');
      return;
    }
    
    try {
      const url = Platform.OS === 'ios' 
        ? `telprompt:${phoneNumber}` 
        : `tel:${phoneNumber}`;
      
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

  React.useEffect(() => {
    (async () => {
      if (!volunteerId) return;
      const { data, error } = await supabase
        .from('volunteer')
        .select('phone')
        .eq('id', volunteerId)
        .maybeSingle();
      if (!error && data) setVolunteer(data);
    })();
  }, [volunteerId]);
  
  if (!volunteer) return null;
  
  return (
    <TouchableOpacity onPress={() => handlePhoneCall(volunteer?.phone || '')}>
      <MaterialIcons name="phone" size={28} color="#16a34a" />
    </TouchableOpacity>
  );
}

// Helper component to display volunteer info content
function VolunteerInfoContent({ volunteerId }: { volunteerId: string }) {
  const [volunteer, setVolunteer] = React.useState<any>(null);

  React.useEffect(() => {
    (async () => {
      if (!volunteerId) return;
      const { data, error } = await supabase
        .from('volunteer')
        .select('name, phone, email')
        .eq('id', volunteerId)
        .maybeSingle();
      if (!error && data) setVolunteer(data);
    })();
  }, [volunteerId]);
  
  if (!volunteer) return <Text className="text-gray-500">Loading volunteer info...</Text>;
  
  return (
    <View className="space-y-3">
      <View className="flex-row items-center">
        <View className="bg-green-100 rounded-full p-2 mr-3">
          <MaterialIcons name="person" size={20} color="#16a34a" />
        </View>
        <View className="flex-1">
          <Text className="text-gray-900 font-semibold">{volunteer?.name || 'No name available'}</Text>
        </View>
      </View>
      <View className="flex-row items-center">
        <View className="bg-green-100 rounded-full p-2 mr-3">
          <MaterialIcons name="phone" size={20} color="#16a34a" />
        </View>
        <Text className="text-gray-700 text-base">{volunteer?.phone || 'N/A'}</Text>
      </View>
      <View className="flex-row items-center">
        <View className="bg-green-100 rounded-full p-2 mr-3">
          <MaterialIcons name="email" size={20} color="#16a34a" />
        </View>
        <Text className="text-gray-700 text-base">{volunteer?.email || 'N/A'}</Text>
      </View>
    </View>
  );
}