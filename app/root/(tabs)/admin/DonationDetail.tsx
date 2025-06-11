console.log('THIS IS THE UPPERCASE DonationDetail.tsx FILE');

import React, { useState, useCallback } from 'react';
import { View, ScrollView, Image, Text, TouchableOpacity, Alert, Dimensions ,Pressable,Modal} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../../constants/supabaseConfig';
import axios from 'axios';

const { width } = Dimensions.get('window');
const geocodeCache = new Map();

const DonationDetail = () => {
  const router = useRouter();
  const donation = useLocalSearchParams();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [volunteers, setVolunteers] = useState<any[]>([]); // Placeholder for volunteers data
  const [donationLatLng, setDonationLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [volunteersLoading, setVolunteersLoading] = useState(false);

  const isPlusCode = (address: string) => {
  // Plus codes format: "QG2X+F36" or similar
  return /^[23456789CFGHJMPQRVWX]{4}\+[23456789CFGHJMPQRVWX]{2,3}/.test(address.split(',')[0].trim());
};

// Helper function to clean address for better geocoding
const cleanAddress = (address: string) => {
  // Remove "unnamed road" as it's not helpful
  let cleaned = address.replace(/unnamed road,?\s*/i, '');
  
  // If it's a Plus Code, try to extract area information
  if (isPlusCode(address)) {
    const parts = address.split(',').map(s => s.trim());
    // Use area name instead of plus code for geocoding
    if (parts.length > 1) {
      cleaned = parts.slice(1).join(', '); // Remove plus code, keep area
    }
  }
  
  return cleaned.trim();
};



  // Geocode donation address to lat/lng using OpenCage API
  // Fix: Type the OpenCage response to avoid 'unknown' errors
// Replace your existing geocodeDonationLocation function with this enhanced version
const geocodeDonationLocation = async (address: string) => {
  // Check cache first
  if (geocodeCache.has(address)) {
    return geocodeCache.get(address);
  }

  try {
    let queryAddress = address;
    
    // Handle Plus Codes by converting them first
    if (isPlusCode(address)) {
      // Try to decode Plus Code using Google's API (free)
      try {
        interface PlusCodeApiResponse {
          plus_code?: {
            geometry?: {
              location: {
                lat: number;
                lng: number;
              };
            };
          };
        }
        const plusCodeResponse = await axios.get<PlusCodeApiResponse>(`https://plus.codes/api?address=${encodeURIComponent(address.split(',')[0].trim())}&ekey=free`);
        if (
          plusCodeResponse.data &&
          plusCodeResponse.data.plus_code &&
          plusCodeResponse.data.plus_code.geometry
        ) {
          const result = {
            lat: plusCodeResponse.data.plus_code.geometry.location.lat,
            lng: plusCodeResponse.data.plus_code.geometry.location.lng,
          };
          geocodeCache.set(address, result);
          return result;
        }
      } catch (plusError) {
        console.log('Plus code conversion failed, trying area name');
      }
      
      // Fallback: use area name for geocoding
      queryAddress = cleanAddress(address);
    } else {
      // Clean the address for better geocoding
      queryAddress = cleanAddress(address);
    }

    // If we have a cleaned address, try geocoding
    if (queryAddress) {
      const response = await axios.get('https://api.opencagedata.com/geocode/v1/json', {
        params: {
          q: queryAddress,
          key: 'ceea64097b1646c4b18647701f0a60dc',
          limit: 1,
          countrycode: 'bd', // Restrict to Bangladesh for better results
        },
      });
      
      const data = response.data as {
        results: Array<{ geometry: { lat: number; lng: number } }>;
      };
      
      let result = null;
      if (data.results && data.results.length > 0) {
        result = {
          lat: data.results[0].geometry.lat,
          lng: data.results[0].geometry.lng,
        };
      }
      
      // Cache the result (even if null) to avoid repeated failures
      geocodeCache.set(address, result);
      return result;
    }
    
    // If all fails, cache null and return
    geocodeCache.set(address, null);
    return null;
    
  } catch (error) {
    console.error('Geocoding error:', error);
    // Cache null result to avoid repeated failures
    geocodeCache.set(address, null);
    return null;
  }
};
  // Parse POINT string to {lat, lng}
  const parsePoint = (pointStr: string) => {
    // Format: POINT(lng lat)
    const match = pointStr.match(/POINT\\(([-0-9.]+) ([-0-9.]+)\\)/);
    if (!match) return null;
    return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };
  };

  // Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Fetch volunteers and filter by distance using address geocoding
const fetchNearbyVolunteers = useCallback(async (lat: number, lng: number) => {
  setVolunteersLoading(true);
  try {
    const { data: vols, error } = await supabase.from('volunteer').select('*');
    if (error) throw error;
    
    console.log('Raw fetched volunteers:', vols);
    if (!vols || vols.length === 0) {
      console.warn('No volunteers returned from Supabase!');
      setVolunteers([]);
      setVolunteersLoading(false);
      return;
    }

    // Limit to first 20 volunteers to avoid too many API calls
    const limitedVolunteers = vols.slice(0, 20);
    console.log('Processing limited volunteers:', limitedVolunteers.length);

    // Process volunteers in batches to avoid overwhelming API
    const batchSize = 5;
    const geocodedVolunteers = [];
    
    for (let i = 0; i < limitedVolunteers.length; i += batchSize) {
      const batch = limitedVolunteers.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(async (v: any) => {
          if (!v.address) {
            console.warn('Volunteer missing address:', v);
            return null;
          }
          
          console.log('Geocoding volunteer address:', v.address);
          try {
            const geo = await geocodeDonationLocation(v.address);
            if (!geo) {
              console.warn('Geocoding failed for address:', v.address);
              return null;
            }
            const distance = calculateDistance(lat, lng, geo.lat, geo.lng);
            console.log(`Volunteer ${v.name || v.id} at ${v.address} is ${distance.toFixed(2)} km away`);
            return { ...v, lat: geo.lat, lng: geo.lng, distance };
          } catch (err) {
            console.warn('Error geocoding address:', v.address, err);
            return null;
          }
        })
      );
      
      geocodedVolunteers.push(...batchResults);
      
      // Small delay between batches to respect rate limits
      if (i + batchSize < limitedVolunteers.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    const filtered = geocodedVolunteers
      .filter((v: any) => v && v.distance <= 20)
      .sort((a: any, b: any) => a.distance - b.distance);
      
    setVolunteers(filtered);
    if (filtered.length === 0) {
      console.warn('No volunteers found within 20km.');
    }
  } catch (e) {
    setVolunteers([]);
    console.error('Error fetching volunteers:', e);
  } finally {
    setVolunteersLoading(false);
  }
}, []);

  // When modal opens for volunteer assignment, geocode and fetch volunteers
 React.useEffect(() => {
  if (modalVisible && selectedOption === 'volunteer') {
    Alert.alert('Debug', 'Volunteer assignment modal opened!');
    (async () => {
      const targetCoords = donationLatLng 
        ? donationLatLng 
        : await geocodeDonationLocation(donation.Location as string);

      if (!targetCoords) return;
      
      if (!donationLatLng) {
        setDonationLatLng(targetCoords);
      }

      await fetchNearbyVolunteers(targetCoords.lat, targetCoords.lng);
    })();
  }
}, [modalVisible, selectedOption, donationLatLng, donation.Location, fetchNearbyVolunteers]);

  console.log('DonationDetail component rendered');

  const handleApproval = async (status: 'approved' | 'rejected') => {
    setIsLoading(true);
    try {
      // 1. Update donation status
      const { error: updateError } = await supabase
        .from('donation')
        .update({ status: status })
        .eq('id', donation.id);
  
      if (updateError) throw updateError;
  
      // 2. If approved, send a notification to the receiver
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
            ngo_id: donation.ngo_id, // Assuming you have the NGO ID in the donation object
          }
        ]);
  
        if (notifError) {
          console.error('Notification Error:', notifError.message);
          // Optional: show a toast or alert that notification failed
        }
      }
  
      // 3. Show success alert
      Alert.alert(
        'Success',
        `Donation has been ${status}`,
        [{ text: 'OK', onPress: () => router.push('./dashboard') }],
      );
  
    } catch (error) {
      Alert.alert('Error', 'Failed to update donation status');
    } finally {
      setIsLoading(false);
    }
  };
  // In the modal volunteer list, show distance and allow selection
  // Add state for selected volunteer
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string | null>(null);

  // Update handleAssign to use selectedVolunteerId
  const handleAssign = async () => {
    setIsLoading(true);
    try {
      let updateData: any = { status: 'assigned' };
      if (selectedOption === 'volunteer') {
        if (!selectedVolunteerId) {
          Alert.alert('Select Volunteer', 'Please select a volunteer to assign.');
          setIsLoading(false);
          return;
        }
        updateData.volunteer_id = selectedVolunteerId;
      } else if (selectedOption === 'receiver') {
        updateData.assigned_to = 'receiver';
      }
      const { error } = await supabase
        .from('donation')
        .update(updateData)
        .eq('id', donation.id);
      if (error) throw error;
      const { error: notifError } = await supabase.from('notifications').insert([
        {
          title: selectedOption === 'volunteer' ? 'Assigned to Volunteer' : 'Please Collect Donation',
          message: `Donation ${donation.Types} needs to be collected`,
          type: 'collection',
          isread: false,
          for: selectedOption === 'volunteer' ? 'volunteer' : 'receiver',
          donation_id: donation.id,
          created_at: new Date().toISOString(),
          volunteer_id: selectedOption === 'volunteer' ? selectedVolunteerId : null,
        }
      ]);
      if (notifError) throw notifError;
      Alert.alert('Success', 'Donation assignment updated successfully');
      setModalVisible(false);
      setSelectedVolunteerId(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update donation assignment');
    } finally {
      setIsLoading(false);
    }
  };
  // Fix: Define images from donation.picture (if available)
  const images = donation.picture
    ? Array.isArray(donation.picture)
      ? donation.picture
      : [donation.picture]
    : [];

  if (donation.status === 'approvedF') {
    return (
      <View className="flex-1 bg-white">
        <ScrollView className="flex-1">
          {/* Image Carousel and other details remain the same */}
          {/* ... (keep all the existing UI elements) ... */}

          {/* Assignment Section */}
          <View className="px-6 pt-6">
            <View className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <View className="flex-row items-center">
                <MaterialIcons name="check-circle" size={24} color="#16a34a" />
                <Text className="text-green-800 font-bold ml-2">Donation Approved</Text>
              </View>
              <Text className="text-green-700 mt-2">
                Please assign this donation to be collected
              </Text>
            </View>

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
                  {volunteersLoading ? (
                    <View className="py-4"><Text className="text-gray-600">Loading volunteers...</Text></View>
                  ) : volunteers.length > 0 ? (
                    <View>
                      <Text className="text-gray-600 mb-4">
                        Select a volunteer to collect this donation:
                      </Text>
                      {/* List of volunteers */}
                      {volunteers.map((volunteer) => (
                        <TouchableOpacity
                          key={volunteer.id}
                          className={`py-3 border-b border-gray-100 ${selectedVolunteerId === volunteer.id ? 'bg-blue-100' : ''}`}
                          onPress={() => setSelectedVolunteerId(volunteer.id)}
                        >
                          <Text className="text-gray-900 font-medium">{volunteer.name}</Text>
                          <Text className="text-gray-600 text-sm">{volunteer.contact}</Text>
                          <Text className="text-gray-500 text-xs">{volunteer.distance.toFixed(2)} km away</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <View className="py-4">
                      <Text className="text-gray-600 mb-4">
                        No volunteers available nearby. Please try again later or assign to your NGO.
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
                  className="bg-blue-500 px-6 py-3 rounded-lg"
                  onPress={handleAssign}
                  disabled={selectedOption === 'volunteer' && volunteers.length === 0}
                >
                  <Text className="text-white font-medium">
                    {selectedOption === 'volunteer' ? 'Assign Volunteer' : 'Confirm Collection'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Original UI for other statuses

  

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

          <Text className="text-2xl font-bold text-gray-900">{donation.Name}</Text>
          <View className="flex-row items-center mt-2">
            <MaterialIcons name="location-on" size={20} color="#6366f1" />
            <Text className="text-gray-600 ml-2">{donation.Location}</Text>
          </View>

          {/* Preferred NGO Section */}
          <View className="mt-6 bg-blue-50 rounded-xl p-4">
            <Text className="text-lg font-bold text-gray-900 mb-2">Preferred NGO</Text>
            <View className="flex-row items-center">
              <MaterialIcons name="business" size={24} color="#6366f1" />
              <View className="ml-3">
                <Text className="text-gray-900 font-medium">{donation.preferred_ngo_name}</Text>
                <Text className="text-gray-600 text-sm mt-1">{donation.preferred_ngo_location}</Text>
              </View>
            </View>
          </View>

          <View className="mt-8">
            <Text className="text-lg font-bold text-gray-900 mb-4">Donation Details</Text>
            <View className="flex-row justify-between">
              <View className="bg-indigo-50 rounded-xl p-4 flex-1 mr-4">
                <MaterialIcons name="category" size={24} color="#6366f1" />
                <Text className="text-gray-600 text-sm mt-2">Type</Text>
                <Text className="text-gray-900 font-bold mt-1">{donation.Types}</Text>
              </View>
              <View className="bg-indigo-50 rounded-xl p-4 flex-1">
                <MaterialIcons name="inventory" size={24} color="#6366f1" />
                <Text className="text-gray-600 text-sm mt-2">Quantity</Text>
                <Text className="text-gray-900 font-bold mt-1">{donation.Quantity}</Text>
              </View>
            </View>

            <View className="mt-6">
              <Text className="text-lg font-bold text-gray-900 mb-3">Description</Text>
              <Text className="text-gray-600 leading-6">{donation.Details}</Text>
            </View>

            <View className="mt-6">
              <Text className="text-lg font-bold text-gray-900 mb-3">Time Details</Text>
              <View className="bg-gray-50 rounded-xl p-4">
                <View className="flex-row items-center mb-4">
                  <MaterialIcons name="access-time" size={20} color="#6366f1" />
                  <View className="ml-3">
                    <Text className="text-gray-600 text-sm">Producing Time</Text>
                    <Text className="text-gray-900 font-medium mt-1">
                      {new Date(donation.Producing as string).toLocaleString()}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center">
                  <MaterialIcons name="timer" size={20} color="#6366f1" />
                  <View className="ml-3">
                    <Text className="text-gray-600 text-sm">Lasting Until</Text>
                    <Text className="text-gray-900 font-medium mt-1">
                      {new Date(donation.Lasting as string).toLocaleString()}
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
                <Text className="text-gray-600 ml-3">{donation.donor_name}</Text>
              </View>
              <View className="flex-row items-center">
                <MaterialIcons name="phone" size={20} color="#6366f1" />
                <Text className="text-gray-600 ml-3">{donation.donor_contact}</Text>
              </View>
            </View>
          </View>

          {/* Admin Actions */}
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
        </View>
      </ScrollView>

      <View className="px-6 py-4 bg-white border-t border-gray-200">
        <View className="flex-row space-x-4">
          <TouchableOpacity 
            className="flex-1 bg-red-100 rounded-xl py-4"
            onPress={() => handleApproval('rejected')}
            disabled={isLoading}
          >
            <View className="flex-row items-center justify-center">
              <MaterialIcons name="close" size={24} color="#dc2626" />
              <Text className="text-red-600 font-bold ml-2">Reject Donation</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="flex-1 bg-green-100 rounded-xl py-4"
            onPress={() => handleApproval('approved')}
            disabled={isLoading}
          >
            <View className="flex-row items-center justify-center">
              <MaterialIcons name="check" size={24} color="#16a34a" />
              <Text className="text-green-600 font-bold ml-2">Approve Donation</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default DonationDetail;