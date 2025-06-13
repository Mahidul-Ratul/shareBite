import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, Modal, Dimensions, ActivityIndicator } from "react-native";
import { MaterialIcons, FontAwesome, Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { supabase } from '../../../../constants/supabaseConfig';

const { width: screenWidth } = Dimensions.get('window');

export default function PastDonations() {
  const [selectedImages, setSelectedImages] = useState<null | any[]>(null);
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDonations = async () => {
      setLoading(true);
      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      // 2. Get receiver (ngo) id by email
      const { data: receiver, error: receiverError } = await supabase
        .from('receiver')
        .select('id')
        .eq('email', user.email)
        .single();
      if (receiverError || !receiver) {
        setLoading(false);
        return;
      }
      // 3. Get donations for this ngo_id with status 'delivered the food'
      const { data: donationData, error: donationError } = await supabase
        .from('donation')
        .select('*')
        .eq('ngo_id', receiver.id)
        .eq('status', 'delivered the food')
        .order('Producing', { ascending: false });
      if (!donationError && donationData) {
        setDonations(donationData);
      }
      setLoading(false);
    };
    fetchDonations();
  }, []);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <Text className="text-2xl font-rubik-bold text-gray-800">Past Donations</Text>
        <Text className="text-sm font-rubik text-gray-600">Track your previous contributions</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#16a34a" /></View>
      ) : (
        <ScrollView 
          className="flex-1" 
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {donations.length === 0 ? (
            <Text className="text-center text-gray-400 mt-12">No past donations found.</Text>
          ) : donations.map((donation) => {
            // Parse images
            let images: string[] = [];
            if (donation.Image) {
              if (typeof donation.Image === 'string' && donation.Image.trim().startsWith('[')) {
                try { images = JSON.parse(donation.Image); } catch { images = []; }
              } else if (typeof donation.Image === 'string') {
                images = [donation.Image];
              } else if (Array.isArray(donation.Image)) {
                images = donation.Image;
              }
            }
            // Parse items
            let items: { quantity: string, food: string }[] = [];
            if (donation.Types && donation.Quantity) {
              const types = donation.Types.split(',').map((s: string) => s.trim());
              const quantities = donation.Quantity.split(',').map((s: string) => s.trim());
              items = types.map((food: string, i: number) => ({ food, quantity: quantities[i] || '' }));
            }
            return (
              <View 
                key={donation.id}
                className="bg-white rounded-2xl shadow-sm mb-4 border border-gray-100 overflow-hidden"
              >
                {/* Donation Images Section */}
                <View className="relative h-48">
                  <ScrollView 
                    horizontal 
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                  >
                    {images.map((image, index) => (
                      <TouchableOpacity 
                        key={index}
                        onPress={() => setSelectedImages(images)}
                        className="relative"
                        activeOpacity={0.9}
                      >
                        <Image 
                          source={image.startsWith('data:') ? { uri: image } : { uri: image }}
                          style={{ width: screenWidth - 32, height: 192 }}
                          className="rounded-t-2xl"
                          resizeMode="cover"
                        />
                        {/* Image Counter */}
                        <View className="absolute bottom-3 left-3 bg-black/50 px-3 py-1 rounded-full">
                          <Text className="text-white font-rubik-medium text-xs">
                            {index + 1}/{images.length}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* Status Badge */}
                  <View className="absolute top-3 right-3 bg-green-500 px-3 py-1 rounded-full z-10">
                    <Text className="text-white font-rubik-medium text-xs">
                      Delivered
                    </Text>
                  </View>

                  {/* Time Badge */}
                  <View className="absolute bottom-3 right-3 bg-black/50 px-3 py-1 rounded-full z-10">
                    <Text className="text-white font-rubik-medium text-xs">
                      {donation.Producing ? new Date(donation.Producing).toLocaleTimeString() : ''}
                    </Text>
                  </View>
                </View>

                {/* Donation Header */}
                <View className="p-4 border-b border-gray-100">
                  <View className="flex-row justify-between items-center mb-2">
                    <View className="flex-row items-center">
                      <MaterialIcons name="restaurant" size={20} color="#16a34a" />
                      <Text className="font-rubik-medium text-gray-800 ml-2">
                        {donation.Location}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <MaterialIcons name="schedule" size={16} color="#6B7280" />
                      <Text className="text-gray-500 font-rubik text-sm ml-1">
                        {donation.Producing ? new Date(donation.Producing).toLocaleString() : ''}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Donation Items */}
                <View className="p-4 bg-gray-50">
                  <Text className="font-rubik-medium text-gray-700 mb-2">
                    Donated Items:
                  </Text>
                  {items.map((item, index) => (
                    <View 
                      key={index} 
                      className="flex-row items-center mb-2 last:mb-0"
                    >
                      <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                      <Text className="text-gray-600 font-rubik">
                        {item.quantity} {item.food}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Actions Footer */}
                <View className="flex-row justify-between items-center px-4 py-3 bg-white border-t border-gray-100">
                  <Text className="text-sm text-gray-500 font-rubik">
                    ID: <Text className="font-rubik-medium">{donation.id}</Text>
                  </Text>
                  <View className="flex-row space-x-4">
                    <TouchableOpacity 
                      className="flex-row items-center bg-green-50 px-3 py-2 rounded-full"
                    >
                      <MaterialIcons name="receipt-long" size={16} color="#16a34a" />
                      <Text className="text-green-600 font-rubik-medium ml-1">
                        Certificate
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      className="flex-row items-center bg-green-50 px-3 py-2 rounded-full"
                    >
                      <MaterialIcons name="share" size={16} color="#16a34a" />
                      <Text className="text-green-600 font-rubik-medium ml-1">
                        Share
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Bottom Navigation */}
      <View className="flex-row justify-between items-center bg-white py-3 px-6 border-t border-gray-200">
        <Link href="./ngohome" asChild>
          <TouchableOpacity className="items-center flex-1">
            <FontAwesome name="home" size={24} color="#6B7280" />
            <Text className="text-gray-600 text-xs mt-1 font-rubik-medium">Home</Text>
          </TouchableOpacity>
        </Link>
        <Link href="./request" asChild>
            <TouchableOpacity className="items-center flex-1">
              <View className="bg-orange-500 p-3 rounded-full -mt-8 border-4 border-white shadow-lg">
                <FontAwesome name="plus" size={24} color="white" />
              </View>
              <Text className="text-gray-600 text-xs mt-1 font-rubik-medium">Request</Text>
            </TouchableOpacity>
          </Link>
        <Link href="./past_donat" asChild>
          <TouchableOpacity className="items-center flex-1">
            <FontAwesome name="history" size={24} color="#F97316" />
            <Text className="text-orange-500 text-xs mt-1 font-rubik-medium">History</Text>
          </TouchableOpacity>
        </Link>
        <Link href="./settings" asChild>
          <TouchableOpacity className="items-center flex-1">
            <Ionicons name="settings-outline" size={24} color="#6B7280" />
            <Text className="text-gray-600 text-xs mt-1 font-rubik-medium">Settings</Text>
          </TouchableOpacity>
        </Link>
      </View>

      {/* Image Viewer Modal */}
      {selectedImages && (
        <Modal
          visible={!!selectedImages}
          transparent={true}
          onRequestClose={() => setSelectedImages(null)}
          animationType="fade"
        >
          <View className="flex-1 bg-black">
            <TouchableOpacity 
              className="absolute top-12 right-4 z-10 p-2"
              onPress={() => setSelectedImages(null)}
            >
              <MaterialIcons name="close" size={24} color="white" />
            </TouchableOpacity>
            <ScrollView 
              horizontal 
              pagingEnabled
              showsHorizontalScrollIndicator={false}
            >
              {selectedImages.map((image, index) => (
                <View 
                  key={index}
                  className="w-screen h-full justify-center items-center"
                >
                  <Image 
                    source={image.startsWith('data:') ? { uri: image } : { uri: image }}
                    style={{ width: screenWidth, height: screenWidth }}
                    resizeMode="contain"
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        </Modal>
      )}
    </View>
  );
}