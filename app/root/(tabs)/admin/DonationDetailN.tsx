import React, { useState,useEffect } from 'react';
import { View, ScrollView, Image, Text, TouchableOpacity, Alert, Dimensions ,Pressable,Modal} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../../constants/supabaseConfig';



const { width } = Dimensions.get('window');

const DonationDetail = () => {
    const { id } = useLocalSearchParams();
  
  console.log("Received donation ID:", id);
  const [donation, setDonation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
   const [modalVisible, setModalVisible] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [volunteers, setVolunteers] = useState<any[]>([]); // Placeholder for volunteers data
  

  
  const [receiver, setReceiver] = useState<any>(null);  // Declare state for receiver data

  // State to manage images and the current image index
  const [images, setImages] = useState<string[]>([]);  // This will hold the image URLs or paths
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);  // Index to t

  // Fetch donation data when the component mounts
  useEffect(() => {
    const fetchDonationData = async () => {
      try {
        const { data, error } = await supabase
          .from('donation')
          .select('*')
          .eq('id', id)  // Query the donation by the received `id`
          .single();
          console.log("Supabase data:", data);
          console.log("Supabase error:", error);

        if (error) {
          throw error;
        }

        // Set the fetched data into state
        setDonation(data);

        if (data?.ngo_id) {
            const { data: receiverData, error: receiverError } = await supabase
              .from('receiver')
              .select('*')
              .eq('id', data.ngo_id) // Match the ngo_id from the donation data
              .single();
    
            if (receiverError) throw receiverError;
    
            // Set the fetched receiver data into state
            setReceiver(receiverData);
          }


      } catch (error) {
        Alert.alert('Error', 'Failed to load donation details');
      } finally {
        setIsLoading(false);  // Set loading to false once the data is fetched
      }
    };

    // Only fetch if `id` is available
    if (id) {
      fetchDonationData();
    }
  }, [id]); // Re-run the effect if the `id` changes

  const handleApproval = async (status: 'approved' | 'rejected') => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('donation')
        .update({ status: status })
        .eq('id', id);

      if (error) throw error;
      console.log(images,);
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
                // Optional: show a toast or alert that notification failed
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
  if (isLoading) {
    return <Text>Loading...</Text>; // or a spinner
  }
  if (!donation) {
    return <Text>Donation not found or inaccessible.</Text>;
  }
   const handleAssign = async () => {
      setIsLoading(true);
      try {
        // Update donation with the selected option
        let updateData: any = { status: 'assigned' };
        
        if (selectedOption === 'volunteer') {
          // Assign to a volunteer (you would select one from volunteers list)
          updateData.volunteer_id = volunteers[0]?.id; // Example: assign first volunteer
        } else if (selectedOption === 'receiver') {
          // Mark for receiver to collect
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
                    {volunteers.length > 0 ? (
                      <View>
                        <Text className="text-gray-600 mb-4">
                          Select a volunteer to collect this donation:
                        </Text>
                        {/* List of volunteers */}
                        {volunteers.map((volunteer) => (
                          <TouchableOpacity 
                            key={volunteer.id}
                            className="py-3 border-b border-gray-100"
                          >
                            <Text className="text-gray-900 font-medium">{volunteer.name}</Text>
                            <Text className="text-gray-600 text-sm">{volunteer.contact}</Text>
                          </TouchableOpacity>
                        ))}
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