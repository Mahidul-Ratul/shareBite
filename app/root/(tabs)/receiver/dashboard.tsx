
import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, ImageBackground } from "react-native";
import { Link, useRouter } from "expo-router";
import { FontAwesome, MaterialIcons, Ionicons } from "@expo/vector-icons";
import { supabase } from "../../../../constants/supabaseConfig";
import AsyncStorage from '@react-native-async-storage/async-storage';

import axios from "axios";

const decodeAddress = async (address: string): Promise<string> => {
  try {
    const API_KEY = "ceea64097b1646c4b18647701f0a60dc"; // Replace with your OpenCage API key
    const response = await axios.get(
      `https://api.opencagedata.com/geocode/v1/json`,
      {
        params: {
          q: address, // The address to decode
          key: API_KEY,
        },
      }
    );

    const data = response.data as { results: { formatted: string }[] };
    if (data.results.length > 0) {
      // Return the formatted address
      const typedData = response.data as { results: { formatted: string }[] };
      return typedData.results[0].formatted;
    } else {
      console.error("No results found for the address.");
      return "Address not found";
    }
  } catch (error) {
    console.error("Error decoding address:", error);
    return "Error decoding address";
  }
};

export default function NGOHomePage() {
  const router = useRouter();
  interface ReceiverData {
    name: string;
    image_url: string;
    location: string;
  }
  
  const [receiverData, setReceiverData] = useState<ReceiverData | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchReceiverData = async () => {
    try {
      // Get the logged-in user's email
     

      const userEmail = await AsyncStorage.getItem("userEmail");
      if (!userEmail) {
        console.error("No logged-in user found.");
        return;
      }
      const ngo_id = await AsyncStorage.getItem("userId");

      if (!ngo_id) {
        console.error("userId not found in AsyncStorage.");
        return;
      }
      await AsyncStorage.setItem("ngo_id", ngo_id); // No need to call .toString(), it's already a string
      

      // Fetch data from the `receiver` table for the logged-in user
      const { data, error } = await supabase
        .from("receiver")
        .select("name, image_url, location")
        .eq("email", userEmail)
        .single(); // Fetch a single record

      if (error) throw error;
      const decodedAddress = await decodeAddress(data.location);

      setReceiverData({
        ...data,
        location: decodedAddress,
      });
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error fetching receiver data:", error.message);
      } else {
        console.error("Error fetching receiver data:", error);
      }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchReceiverData();
  }, []);

  const donor = [
    {
      address: "123 Charity Lane, Springfield",
      profileImage: null,
      ngoName: "Food For All Foundation",
      description: "Dedicated to fighting hunger since 2018",
      impactStats: {
        mealsServed: "50,00+",
        communitiesReached: "25",
        volunteersActive: "100+"
      }
    },
  ];

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="px-3 py-">
        {/* NGO Header */}
        <View className="flex-row justify-between items-center py-3">
            {/* Logo and App Name */}
            <View className="flex-row items-center">
                <Image 
                    source={require("@/assets/images/images.jpeg")} 
                    className="w-8 h-8 rounded-full mr-2" 
                />
                <Text className="text-lg font-rubik-bold text-gray-800">
                    ShareBite
                </Text>
            </View>

            {/* Right Side Actions */}
            <View className="flex-row items-center space-x-4">
                {/* Notification Button */}
                <TouchableOpacity 
                    onPress={() => router.push("./notification")}
                    className="relative p-2"
                >
                    <Ionicons 
                        name="notifications-outline" 
                        size={24} 
                        color="#374151" 
                    />
                    {/* Notification Badge */}
                    <View className="absolute -top-0.5 -right-0.5 bg-red-500 w-5 h-5 rounded-full items-center justify-center">
                        <Text className="text-white text-xs font-bold">3</Text>
                    </View>
                </TouchableOpacity></View>
        </View>
              
        <Image
              source={{
                uri: receiverData?.image_url
                  
              }}
              className="w-full h-60 rounded-xl"
              resizeMode="cover"
            />  
        <View className='text-center mt-5'>
          <Text className='text-2xl text-center uppercase font-rubik-bold text-black-200 mt-1'>Welcome, {receiverData?.name || "NGO"}</Text>
          <View className="flex-row items-center justify-center mb-2">
          <MaterialIcons name="location-on" size={20} color="#FF5722" />
          <Text className="font-rubik-medium text-lg text-gray-800 mt-1 ml-1"> {receiverData?.location || "Location not available"}</Text>
          </View>
        </View>
        <View className="bg-white mb-6 mx-1 overflow-hidden">
          {/* Header with gradient overlay */}
          <View className="flex-row mt-1 mx-4">
            <View className="w-1 bg-green-500 rounded-full"/>
            <View className="flex-1 px-6 py-4">
              <View className="items-center">
                <Text className="text-2xl font-rubik-bold text-gray-800 text-center">
                  {donor[0]?.ngoName}
                </Text>
                <Text className="text-gray-600 font-rubik mt-2 leading-6 text-center">
                  {donor[0]?.description}
                </Text>
              </View>
            </View>
            <View className="w-1 bg-green-500 rounded-full"/>
          </View>
          {/* Stats Section */}
          <View className="p-3 mt-2">
            <View className="flex-row justify-between">
              {/* Meals Served */}
              <View className="flex-1 items-center px-4 py-4 bg-green-50 rounded-2xl mx-2">
                <View className="bg-green-100 p-2 rounded-full mb-2">
                  <MaterialIcons name="restaurant" size={24} color="#16a34a" />
                </View>
                <Text className="text-xl font-rubik-bold text-green-600">
                  {donor[0]?.impactStats.mealsServed}
                </Text>
                <Text className="text-xs text-gray-600 font-rubik text-center">
                  Meals Served
                </Text>
              </View>
              {/* Communities */}
              <View className="flex-1 items-center px-4 py-3 bg-blue-50 rounded-2xl mx-2">
                        <View className="bg-blue-100 p-2 rounded-full mb-2">
                          <MaterialIcons name="people" size={24} color="#2563eb" />
                        </View>
                        <Text className="text-xl font-rubik-bold text-blue-600">
                          {donor[0]?.impactStats.communitiesReached}
                        </Text>
                        <Text className="text-xs text-gray-600 font-rubik text-center">
                          Communities
                        </Text>
                      </View>{/* Volunteers */}
                      <View className="flex-1 items-center px-4 py-3 bg-orange-50 rounded-2xl mx-2">
                        <View className="bg-orange-100 p-2 rounded-full mb-2">
                          <MaterialIcons name="volunteer-activism" size={24} color="#ea580c" />
                        </View>
                        <Text className="text-xl font-rubik-bold text-orange-600">
                          {donor[0]?.impactStats.volunteersActive}
                        </Text>
                        <Text className="text-xs text-gray-600 font-rubik text-center">
                          Volunteers
                        </Text>
                      </View>
                    </View>
                  </View>
                 
                </View>
              
                  <ImageBackground 
                    // Use require() for local assets
                    source={require('@/assets/images/back.jpg')} // Replace with your image URL
                    resizeMode="cover"
                    className="rounded-lg mb-5 overflow-hidden"
                  >
                    <View className="p-5 bg-black/30"> {/* Semi-transparent overlay */}
                      <Text className="font-rubik-bold text-lg text-white">Welcome {donor[0]?.ngoName}</Text>
                      <Text className="text-white font-rubik mb-3">
                        To help the community by requesting unused food?
                      </Text>
                      <TouchableOpacity
                        onPress={() => router.push("./request")}
                        className="bg-green-600 py-2 px-4 rounded-lg self-start"
                      >
                        <Text className="text-white font-bold">New Donation Request →</Text>
                      </TouchableOpacity>
                    </View>
                  </ImageBackground>

              <View className="p-5 rounded-lg mb-5">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-2xl font-rubik-bold text-gray-800">Recent Events & Stories</Text>
                  <TouchableOpacity>
                    <Text className="text-green-600 font-rubik-medium">View All</Text>
                  </TouchableOpacity>
                </View>
                
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  className="mb-3"
                >
                  {/* First Card */}
                  <View className="bg-white p-4 rounded-2xl shadow-md mr-4 w-72 border border-gray-100">
                    <View className="absolute top-5 right-5 bg-black/50 px-3 py-1 rounded-full z-10">
                      <Text className="text-white font-rubik-medium text-xs">24 April 2025</Text>
                    </View>
                    <Image 
                      source={require("@/assets/images/istockphoto-1478316232-612x612.jpg")} 
                      className="w-full h-48 rounded-xl mb-3" 
                      resizeMode="cover"
                    />
                    <View className="flex-row justify-between items-center mb-2">
                      <View className="bg-green-50 px-3 py-1 rounded-full">
                        <Text className="text-green-600 font-rubik-medium text-sm">Latest Update</Text>
                      </View>
                      <View className="flex-row items-center">
                        <MaterialIcons name="restaurant" size={16} color="#16a34a" />
                        <Text className="text-green-600 font-rubik text-sm ml-1">500+ meals</Text>
                      </View>
                    </View>
                    <Text className="text-lg font-rubik-medium text-gray-800 mb-2">
                      Helping Hands: 500+ meals distributed
                    </Text>
                    <Text className="text-gray-600 font-rubik text-sm mb-3">
                      Local shelters received fresh, nutritious meals through our community initiative.</Text>
                    <View className="flex-row justify-between items-center">
                      <View className="flex-row items-center">
                        <MaterialIcons name="schedule" size={16} color="#6B7280" />
                        <Text className="text-gray-500 font-rubik text-sm ml-1">2 days ago</Text>
                      </View>
                      <View className="flex-row items-center">
                        <MaterialIcons name="location-on" size={16} color="#6B7280" />
                        <Text className="text-gray-500 font-rubik text-sm ml-1">Springfield</Text>
                      </View>
                    </View>
                  </View>

                  {/* Second Card */}
                  <View className="bg-white p-4 rounded-2xl shadow-md mr-4 w-72 border border-gray-100">
                    <View className="absolute top-5 right-5 bg-black/50 px-3 py-1 rounded-full z-10">
                      <Text className="text-white font-rubik-medium text-xs">21 April 2025</Text>
                    </View>
                    <Image 
                      source={require("@/assets/images/hasi.jpg")} 
                      className="w-full h-48 rounded-xl mb-3" 
                      resizeMode="cover"
                    />
                    <View className="bg-blue-50 px-3 py-1 rounded-full self-start mb-2">
                      <Text className="text-blue-600 font-rubik-medium text-sm">Featured</Text>
                    </View>
                    <Text className="text-lg font-rubik-medium text-gray-800 mb-2">
                      A child's smile: Warm meals provided
                    </Text>
                    <Text className="text-gray-600 font-rubik text-sm mb-3">
                      Making a difference in children's lives through our meal program.
                    </Text>
                    <View className="flex-row justify-between items-center">
                      <View className="flex-row items-center">
                        <MaterialIcons name="schedule" size={16} color="#6B7280" />
                        <Text className="text-gray-500 font-rubik text-sm ml-1">2 days ago</Text>
                      </View>
                      <View className="flex-row items-center">
                        <MaterialIcons name="location-on" size={16} color="#6B7280" />
                        <Text className="text-gray-500 font-rubik text-sm ml-1">Springfield</Text>
                      </View>
                    </View>
                  </View>{/* Third Card */}
                  <View className="bg-white p-4 rounded-2xl shadow-md mr-4 w-72 border border-gray-100">
                    <View className="absolute top-5 right-5 bg-black/50 px-3 py-1 rounded-full z-10">
                      <Text className="text-white font-rubik-medium text-xs">19 April 2025</Text>
                    </View>
                    <Image 
                      source={require("@/assets/images/food.jpg")} 
                      className="w-full h-48 rounded-xl mb-3" 
                      resizeMode="cover"
                    />
                    <View className="bg-orange-50 px-3 py-1 rounded-full self-start mb-2">
                      <Text className="text-orange-600 font-rubik-medium text-sm">Holiday Special</Text>
                    </View>
                    <Text className="text-lg font-rubik-medium text-gray-800 mb-2">
                      Community effort: Holiday meals
                    </Text>
                    <Text className="text-gray-600 font-rubik text-sm mb-3">
                      Supporting families during the holiday season with nutritious meals.
                    </Text>
                    <View className="flex-row justify-between items-center">
                      <View className="flex-row items-center">
                        <MaterialIcons name="schedule" size={16} color="#6B7280" />
                        <Text className="text-gray-500 font-rubik text-sm ml-1">2 days ago</Text>
                      </View>
                      <View className="flex-row items-center">
                        <MaterialIcons name="location-on" size={16} color="#6B7280" />
                        <Text className="text-gray-500 font-rubik text-sm ml-1">Springfield</Text>
                      </View>
                    </View>
                  </View>
                </ScrollView>
              </View>

        
      </ScrollView>
      {/* Bottom Navigation */}
  <View className="flex-row justify-between items-center bg-white py-3 px-6 border-t border-gray-200">
    <Link href="./dashboard" asChild>
      <TouchableOpacity className="items-center flex-1">
        <FontAwesome name="home" size={24} color="#F97316" />
        <Text className="text-orange-500 text-xs mt-1 font-rubik-medium">Home</Text>
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
      <FontAwesome name="history" size={24} color="#6B7280" />
      <Text className="text-gray-600 text-xs mt-1 font-rubik-medium">History</Text>
    </TouchableOpacity>
  </Link>

  <Link href="./settings" asChild>
    <TouchableOpacity className="items-center flex-1">
      <Ionicons name="settings-outline" size={24} color="#6B7280" />
      <Text className="text-gray-600 text-xs mt-1 font-rubik-medium">Settings</Text>
    </TouchableOpacity>
  </Link>
</View>
    </View>
  );
}