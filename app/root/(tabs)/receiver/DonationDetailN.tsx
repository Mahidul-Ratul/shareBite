import React, { useState, useEffect } from 'react';
import { View, ScrollView, Image, Text, TouchableOpacity, Alert, Dimensions, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../../constants/supabaseConfig';

const { width } = Dimensions.get('window');

// Timeline stages for donation progress
const STATUS_STAGES = [
  { key: 'pending', label: 'Donation Requested', description: 'You requested this donation.' },
  { key: 'approved', label: 'Donation Approved', description: 'Admin approved your donation request.' },
  { key: 'approvedF', label: 'Ready for Assignment', description: 'Donation is ready to be assigned to a volunteer.' },
  { key: 'volunteer is assigned', label: 'Volunteer Assigned', description: 'A volunteer has been assigned to collect the donation.' },
  { key: 'on the way to receive food', label: 'Volunteer On The Way', description: 'Volunteer is on the way to collect the donation.' },
  { key: 'food collected', label: 'Food Collected', description: 'The food has been collected by the volunteer.' },
  { key: 'on the way to deliver food', label: 'On The Way To Receiver', description: 'Volunteer is delivering the food to the receiver.' },
  { key: 'delivered the food', label: 'Donation Delivered', description: 'The donation has been delivered.' },
];

const DonationDetail = () => {
  const { id } = useLocalSearchParams();
  const [donation, setDonation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [images, setImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

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
          },
        ]);
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

  // Status banner design
  const getStatusBanner = () => {
    if (!donation?.status) return null;
    const statusObj = STATUS_STAGES.find(s => s.key === donation.status);
    let color = '#fbbf24', bg = 'bg-yellow-100', icon: any = 'hourglass-empty', textColor = 'text-yellow-800';
    // Only use valid MaterialIcons names
    switch (donation.status) {
      case 'pending':
        color = '#fbbf24'; bg = 'bg-yellow-100'; icon = 'hourglass-empty'; textColor = 'text-yellow-800'; break;
      case 'approved':
        color = '#6366f1'; bg = 'bg-indigo-100'; icon = 'check-circle'; textColor = 'text-indigo-800'; break;
      case 'approvedF':
        color = '#16a34a'; bg = 'bg-green-100'; icon = 'assignment-turned-in'; textColor = 'text-green-800'; break;
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
      default:
        color = '#9ca3af'; bg = 'bg-gray-100'; icon = 'info'; textColor = 'text-gray-700'; break;
    }
    // Only allow valid icon names
    const validIcons = [
      'hourglass-empty', 'check-circle', 'assignment-turned-in', 'person', 'directions-run', 'restaurant', 'local-shipping', 'info'
    ];
    const safeIcon = validIcons.includes(icon) ? icon : 'info';
    return (
      <View className={`flex-row items-center rounded-xl px-4 py-3 mb-4 shadow ${bg}`}
        style={{ alignSelf: 'center', marginTop: 16, marginBottom: 16 }}>
        <MaterialIcons name={safeIcon} size={28} color={color} />
        <Text className={`ml-4 font-bold text-lg ${textColor}`}>{statusObj?.label || donation.status}</Text>
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

  if (isLoading) {
    return <Text>Loading...</Text>;
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
          <Text className="text-2xl font-bold text-gray-900">{donation?.Name}</Text>
          <View className="flex-row items-center mt-2">
            <MaterialIcons name="location-on" size={20} color="#6366f1" />
            <Text className="text-gray-600 ml-2">{donation?.location}</Text>
          </View>

          {/* Donor Information */}
          <View className="mt-6 bg-blue-50 rounded-xl p-4">
            <Text className="text-lg font-bold text-gray-900 mb-2">Donor Information</Text>
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
          </View>

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

          {/* Timeline */}
          <View className="bg-white rounded-xl p-4 border border-gray-100 mt-8 mb-8">
            <Text className="font-bold text-gray-800 mb-3">Timeline</Text>
            {STATUS_STAGES.map((stage, index) => {
              const isCompleted = index < currentStatusIndex;
              const isCurrent = index === currentStatusIndex;
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
        </View>
      </ScrollView>
    </View>
  );
};

export default DonationDetail;