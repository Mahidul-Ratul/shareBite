import React from "react";
import { View, Text, TextInput, Image, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import BottomNavigation from "./BottomNavigation";

const HomeScreen = () => {
  const router = useRouter(); // Initialize router for navigation

  // Example data for top donors
  const donors = [
    { id: 1, name: "Ravi Sharma", image: require("@/assets/images/avatar.png") },
    { id: 2, name: "Aarti Verma", image: require("@/assets/images/avatar.png") },
    { id: 3, name: "Suresh Kumar", image: require("@/assets/images/avatar.png") },
    { id: 4, name: "Neha Gupta", image: require("@/assets/images/avatar.png") },
    { id: 5, name: "Arun Reddy", image: require("@/assets/images/avatar.png") },
  ];

  return (
    <View className="flex-1 bg-white pt-10">
      {/* Header */}
      <View className="flex-row justify-between items-center px-5 mb-2">
        <View className="flex-row items-center">
          <MaterialIcons name="location-on" size={20} color="#FF5722" />
          <Text className="font-bold text-sm text-gray-800">6, Aam Bagh, Mehrauli</Text>
        </View>

        {/* Navigate to profile on press */}
        <TouchableOpacity onPress={() => router.push("./profile")}>
          <Image source={require("@/assets/images/avatar.png")} className="w-10 h-10 rounded-full" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View className="flex-row bg-gray-200 rounded-lg p-3 mx-5 items-center">
        <Ionicons name="search" size={20} color="#888" />
        <TextInput placeholder="Search for NGO's" className="ml-2 flex-1" />
      </View>

      <ScrollView className="flex-1">
        {/* Donate Banner */}
        <View className="bg-green-100 rounded-lg mx-5 p-4 shadow-md">
          <Text className="font-bold text-lg">Hey Nitin,</Text>
          <Text className="mb-2 text-gray-600">Do you want to help the community by donating unused food?</Text>
          <TouchableOpacity className="bg-green-500 py-2 px-4 rounded-full items-center">
            <Text className="text-white font-bold">Donate Now →</Text>
          </TouchableOpacity>
        </View>


        {/* Top Donors */}
        <Text className="font-bold text-xl mx-5 mt-5">Top donors of the month</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mx-5 mt-2">
          {donors.map((donor) => (
            <TouchableOpacity
              key={donor.id}
              onPress={() => router.push(`./donor/${donor.id}`)} // Navigate to donor's profile
              className="mr-4 items-center"
            >
              <Image source={donor.image} className="w-12 h-12 rounded-full" />
              <Text className="text-center text-xs font-bold mt-2">{donor.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Featured Organizations */}
        <View className="flex-row justify-between mx-5 mt-5">
          <Text className="font-bold text-xl">Featured organizations</Text>
          <TouchableOpacity>
            <Text className="text-orange-500 font-bold">See All</Text>
          </TouchableOpacity>
        </View>

         <View className="mx-5 mt-2 mb-20">
          <View className="bg-yellow-100 rounded-lg p-4 mb-2 shadow-md">
            <Text className="font-bold text-lg">Feeding India</Text>
            <Text className="text-sm text-gray-600">Feeding India is a non-profit social enterprise...</Text>
            <TouchableOpacity>
              <Text className="text-orange-500 mt-2 font-bold">Donate →</Text>
            </TouchableOpacity>
          </View>
          <View className="bg-blue-100 rounded-lg p-4 shadow-md">
            <Text className="font-bold text-lg">Mera Parivar</Text>
            <Text className="text-sm text-gray-600">Mera Parivar is a non-profit organization...</Text>
            <TouchableOpacity>
              <Text className="text-orange-500 mt-2 font-bold">Donate →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Navigation */}
      <View className="absolute bottom-0 left-0 right-0">
        <BottomNavigation />
      </View>
    </View>
  );
};

export default HomeScreen;
