import React, { useState, useEffect } from 'react';
import { View, ScrollView, Image, Text, TouchableOpacity, Alert, Dimensions, Pressable, Modal } from 'react-native';
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

  // Fetch donation data when the component mounts
  useEffect(() => {
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
          const { data: donorData, error: donorError } = await supabase
            .from('users')
            .select('name, phone, email')
            .eq('id', data.donor_id)
            .maybeSingle();
          if (!donorError && donorData) {
            setDonation((prev: any) => ({ ...prev, donorInfo: donorData }));
          }
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

  const handleApproval = async (status: 'approved' | 'rejected') => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('donation')
        .update({ status: status })
        .eq('id', id);
      if (error) throw error;
      if (status === 'approved') {
        // Notify receiver
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
      Alert.alert('Success', `Donation has been ${status}`, [
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
          text: 'Approved – Assign Volunteer or NGO',
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
      default:
        return null;
    }
  };

  if (isLoading) {
    return <Text>Loading...</Text>;
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
          <Text className="text-2xl font-bold text-gray-900">{donation?.Name}</Text>
          <View className="flex-row items-center mt-2">
            <MaterialIcons name="location-on" size={20} color="#6366f1" />
            <Text className="text-gray-600 ml-2">{donation?.location}</Text>
          </View>

          {/* Preferred NGO Section */}
          <View className="mt-6 bg-blue-50 rounded-xl p-4">
            <Text className="text-lg font-bold text-gray-900 mb-2">Preferred NGO</Text>
            <View className="flex-row items-center">
              <MaterialIcons name="business" size={24} color="#6366f1" />
              <View className="ml-3">
                <Text className="text-gray-900 font-medium">{receiver?.name}</Text>
                <Text className="text-gray-600 text-sm mt-1">{receiver?.areas}</Text>
              </View>
            </View>
          </View>

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
                      {new Date(donation?.Producing as string).toLocaleString()}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center">
                  <MaterialIcons name="timer" size={20} color="#6366f1" />
                  <View className="ml-3">
                    <Text className="text-gray-600 text-sm">Lasting Until</Text>
                    <Text className="text-gray-900 font-medium mt-1">
                      {new Date(donation?.Lasting as string).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Contact Information */}
          <View className="mt-6 bg-gray-50 rounded-xl p-4">
            <Text className="text-lg font-bold text-gray-900 mb-3">Donor Information</Text>
            <View className="space-y-3">
              <View className="flex-row items-center">
                <MaterialIcons name="person" size={20} color="#6366f1" />
                <Text className="text-gray-600 ml-3">{donation.Name}</Text>
              </View>
              <View className="flex-row items-center">
                <MaterialIcons name="phone" size={20} color="#6366f1" />
                <Text className="text-gray-600 ml-3">{donation?.donor_contact}</Text>
              </View>
            </View>
          </View>

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
          {donation.volunteer_id && donation.volunteer_id !== 'ngo' && (
            <View className="mt-6 bg-gradient-to-r from-green-100 via-blue-100 to-purple-100 rounded-2xl p-6 shadow-lg border border-green-200">
              <Text className="text-lg font-extrabold text-green-900 mb-3">Volunteer Information</Text>
              <VolunteerInfoCard volunteerId={donation.volunteer_id} />
            </View>
          )}

          {/* Admin Actions - only show if pending */}
          {donation.status === 'pending' && (
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
          {donation.status === 'approvedF' && (
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
                {[
                  { key: 'pending', label: 'Donation Requested' },
                  { key: 'approved', label: 'Donation Approved' },
                  { key: 'approvedF', label: 'Waiting for Volunteer Assignment' },
                  { key: 'volunteer is assigned', label: 'Volunteer Assigned' },
                  { key: 'on the way to receive food', label: 'Volunteer On The Way' },
                  { key: 'food collected', label: 'Food Collected' },
                  { key: 'on the way to deliver food', label: 'On The Way To Receiver' },
                  { key: 'delivered the food', label: 'Donation Delivered' },
                ].map((stage, idx, arr) => {
                  const statusOrder = [
                    'pending',
                    'approved',
                    'approvedF',
                    'volunteer is assigned',
                    'on the way to receive food',
                    'food collected',
                    'on the way to deliver food',
                    'delivered the food',
                  ];
                  const currentIdx = statusOrder.indexOf(donation.status);
                  const isCompleted = idx < currentIdx;
                  const isCurrent = idx === currentIdx;
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
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Assignment Info - show if assigned */}
          {donation.status === 'assigned' && (
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
          {[
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
          {donation.status === 'completed' && (
            <View className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 mt-6">
              <View className="flex-row items-center">
                <MaterialIcons name="check-circle" size={24} color="#16a34a" />
                <Text className="text-green-800 font-bold ml-2">Donation Completed</Text>
              </View>
              <Text className="text-green-700 mt-2">This donation has been successfully delivered and completed.</Text>
            </View>
          )}
          {donation.status === 'cancelled' && (
            <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 mt-6">
              <View className="flex-row items-center">
                <MaterialIcons name="cancel" size={24} color="#dc2626" />
                <Text className="text-red-800 font-bold ml-2">Donation Cancelled</Text>
              </View>
              <Text className="text-red-700 mt-2">This donation has been cancelled.</Text>
            </View>
          )}
          {donation.status === 'rejected' && (
            <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 mt-6">
              <View className="flex-row items-center">
                <MaterialIcons name="cancel" size={24} color="#dc2626" />
                <Text className="text-red-800 font-bold ml-2">Donation Rejected</Text>
              </View>
              <Text className="text-red-700 mt-2">This donation was rejected by the admin.</Text>
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

// Helper component to fetch and display volunteer info
function VolunteerInfoCard({ volunteerId }: { volunteerId: string }) {
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
        <MaterialIcons name="person" size={22} color="#16a34a" />
        <Text className="text-gray-800 ml-3 text-base font-semibold">{volunteer.name || 'N/A'}</Text>
      </View>
      <View className="flex-row items-center">
        <MaterialIcons name="phone" size={22} color="#16a34a" />
        <Text className="text-gray-700 ml-3 text-base">{volunteer.phone || 'N/A'}</Text>
      </View>
      <View className="flex-row items-center">
        <MaterialIcons name="email" size={22} color="#16a34a" />
        <Text className="text-gray-700 ml-3 text-base">{volunteer.email || 'N/A'}</Text>
      </View>
    </View>
  );
}