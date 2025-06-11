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
        const { error: notifError } = await supabase.from('notifications').insert([
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
        if (notifError) {
          console.error('Notification Error:', notifError.message);
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
      // Send notification to each selected volunteer
      const notifications = selectedVolunteers.map((vol) => ({
        title: 'New Delivery Opportunity',
        message: `A new donation (${donation.Types} - ${donation.Quantity}) is available for delivery.`,
        type: 'assigned',
        isread: false,
        for: 'volunteer',
        donation_id: donation.id,
        created_at: new Date().toISOString(),
        volunteer_id: vol.id,
        ngo_id: donation.ngo_id,
      }));
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
      case 'approvedF':
        return {
          color: '#16a34a',
          icon: 'check-circle',
          text: 'Approved – Awaiting Assignment',
          bg: 'bg-green-50',
          textColor: 'text-green-800',
        };
      case 'assigned':
        return {
          color: '#3b82f6',
          icon: 'assignment-ind',
          text: donation.volunteer_id
            ? 'Assigned to Volunteer'
            : donation.assigned_to === 'receiver'
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
      default:
        return {
          color: '#6b7280',
          icon: 'info',
          text: 'Unknown Status',
          bg: 'bg-gray-100',
          textColor: 'text-gray-700',
        };
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

          {/* Status Banner */}
          <View className={`mx-6 mt-6 rounded-lg p-4 flex-row items-center ${statusBanner.bg}`}>  
            <MaterialIcons name={statusBanner.icon as any} size={28} color={statusBanner.color} />
            <Text className={`ml-3 font-bold text-lg ${statusBanner.textColor}`}>{statusBanner.text}</Text>
          </View>

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

          {/* Assignment Section - only show if approved/approvedF */}
          {(donation.status === 'approved' || donation.status === 'approvedF') && (
            <View className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 mt-6">
              <View className="flex-row items-center">
                <MaterialIcons name="check-circle" size={24} color="#16a34a" />
                <Text className="text-green-800 font-bold ml-2">Donation Approved</Text>
              </View>
              <Text className="text-green-700 mt-2">
                Please assign this donation to be collected
              </Text>
              {/* Assignment Options */}
              <View className="mt-6">
                <Text className="text-lg font-bold text-gray-900 mb-3">Collection Assignment</Text>
                {/* Option 1: Assign to Volunteer */}
                <TouchableOpacity
                  className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-100"
                  onPress={() => {
                    setSelectedOption('volunteer');
                    setModalVisible(true);
                  }}
                >
                  <View className="flex-row items-center">
                    <MaterialIcons name="person" size={24} color="#3b82f6" />
                    <View className="ml-3 flex-1">
                      <Text className="text-gray-900 font-medium">Assign to Volunteer</Text>
                      <Text className="text-gray-600 text-sm mt-1">
                        {volunteers.length > 0
                          ? `${volunteers.length} available volunteers`
                          : 'No volunteers available'}
                      </Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
                  </View>
                </TouchableOpacity>
                {/* Option 2: Receiver Collects */}
                <TouchableOpacity
                  className="bg-purple-50 rounded-xl p-4 border border-purple-100"
                  onPress={() => {
                    setSelectedOption('receiver');
                    setModalVisible(true);
                  }}
                >
                  <View className="flex-row items-center">
                    <MaterialIcons name="business" size={24} color="#7e22ce" />
                    <View className="ml-3 flex-1">
                      <Text className="text-gray-900 font-medium">NGO Collects Itself</Text>
                      <Text className="text-gray-600 text-sm mt-1">
                        Assign to your organization to collect
                      </Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
                  </View>
                </TouchableOpacity>
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
                    : donation.assigned_to === 'receiver'
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

      {/* Assignment Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-gray-900 mb-4">
              {selectedOption === 'volunteer' ? 'Assign to Volunteer' : 'NGO Collection'}
            </Text>

            {selectedOption === 'volunteer' && (
              <>
                {volunteers.length > 0 ? (
                  <View>
                    <Text className="text-gray-600 mb-4">
                      Select one or more volunteers to notify:
                    </Text>
                    {/* List of volunteers with checkboxes */}
                    {volunteers.map((volunteer) => {
                      const isSelected = selectedVolunteers.some((v) => v.id === volunteer.id);
                      return (
                        <TouchableOpacity
                          key={volunteer.id}
                          className={`py-3 border-b border-gray-100 flex-row items-center ${isSelected ? 'bg-blue-100' : ''}`}
                          onPress={() => {
                            if (isSelected) {
                              setSelectedVolunteers(selectedVolunteers.filter((v) => v.id !== volunteer.id));
                            } else {
                              setSelectedVolunteers([...selectedVolunteers, volunteer]);
                            }
                          }}
                        >
                          <MaterialIcons
                            name={isSelected ? 'check-box' : 'check-box-outline-blank'}
                            size={22}
                            color={isSelected ? '#3b82f6' : '#9ca3af'}
                          />
                          <View className="ml-2 flex-1">
                            <Text className="text-gray-900 font-medium">{volunteer.name}</Text>
                            <Text className="text-gray-600 text-sm">{volunteer.contact}</Text>
                            <Text className="text-gray-400 text-xs">{volunteer.address}</Text>
                            <Text className="text-gray-400 text-xs">{volunteer.distance?.toFixed(1)} km away</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <View className="py-4">
                    <Text className="text-gray-600 mb-4">
                      No volunteers available. Please try again later or assign to your NGO.
                    </Text>
                  </View>
                )}
              </>
            )}

            {selectedOption === 'receiver' && (
              <View>
                <Text className="text-gray-600 mb-4">
                  This donation will be marked for your organization to collect.
                </Text>
                <Text className="text-gray-600">
                  Please ensure someone from your team collects it within the specified time.
                </Text>
              </View>
            )}

            <View className="flex-row justify-between mt-6">
              <Pressable
                className="px-6 py-3"
                onPress={() => setModalVisible(false)}
              >
                <Text className="text-gray-600 font-medium">Cancel</Text>
              </Pressable>
              <Pressable
                className={`bg-blue-500 px-6 py-3 rounded-lg ${selectedOption === 'volunteer' && selectedVolunteers.length === 0 ? 'opacity-50' : ''}`}
                onPress={selectedOption === 'volunteer' ? handleNotifyVolunteers : handleAssign}
                disabled={selectedOption === 'volunteer' && selectedVolunteers.length === 0}
              >
                <Text className="text-white font-medium">
                  {selectedOption === 'volunteer' ? 'Notify Volunteers' : 'Confirm Collection'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DonationDetail;