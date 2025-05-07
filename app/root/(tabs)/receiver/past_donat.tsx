import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, Modal, Dimensions } from "react-native";
import { MaterialIcons, FontAwesome, Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";

const { width: screenWidth } = Dimensions.get('window');

export default function PastDonations() {
  const [selectedImages, setSelectedImages] = useState<null | any[]>(null);
  
  const donations = [
    {
      id: "4582173",
      location: "Park Cafe",
      status: "Received",
      images: [
        require("@/assets/images/istockphoto-1478316232-612x612.jpg"),
        require("@/assets/images/food.jpg"),
        require("@/assets/images/hasi.jpg"),
      ],
      items: [
        { quantity: "30 person", food: "Macaroni pasta" },
        { quantity: "6 kg", food: "Dal makhani" },
      ],
      date: "23 Jan 2023 at 3:45 PM",
      time: "3:45 PM",
    },
    {
      id: "4582021",
      location: "Park Cafe",
      status: "Received",
      images: [
        require("@/assets/images/food.jpg"),
        require("@/assets/images/istockphoto-1478316232-612x612.jpg"),
      ],
      items: [
        { quantity: "4 kg", food: "Chowmein" },
        { quantity: "3 kg", food: "Manchurian gravy" },
      ],
      date: "10 Jan 2023 at 7:15 PM",
      time: "7:15 PM",
    },
  ];

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <Text className="text-2xl font-rubik-bold text-gray-800">Past Donations</Text>
        <Text className="text-sm font-rubik text-gray-600">Track your previous contributions</Text>
      </View>

      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {donations.map((donation) => (
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
                {donation.images.map((image, index) => (
                  <TouchableOpacity 
                    key={index}
                    onPress={() => setSelectedImages(donation.images)}
                    className="relative"
                    activeOpacity={0.9}
                  >
                    <Image 
                      source={image} 
                      style={{ width: screenWidth - 32, height: 192 }}
                      className="rounded-t-2xl"
                      resizeMode="cover"
                    />
                    {/* Image Counter */}
                    <View className="absolute bottom-3 left-3 bg-black/50 px-3 py-1 rounded-full">
                      <Text className="text-white font-rubik-medium text-xs">
                        {index + 1}/{donation.images.length}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Status Badge */}
              <View className="absolute top-3 right-3 bg-green-500 px-3 py-1 rounded-full z-10">
                <Text className="text-white font-rubik-medium text-xs">
                  {donation.status}
                </Text>
              </View>

              {/* Time Badge */}
              <View className="absolute bottom-3 right-3 bg-black/50 px-3 py-1 rounded-full z-10">
                <Text className="text-white font-rubik-medium text-xs">
                  {donation.time}
                </Text>
              </View>
            </View>

            {/* Donation Header */}
            <View className="p-4 border-b border-gray-100">
              <View className="flex-row justify-between items-center mb-2">
                <View className="flex-row items-center">
                  <MaterialIcons name="restaurant" size={20} color="#16a34a" />
                  <Text className="font-rubik-medium text-gray-800 ml-2">
                    {donation.location}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <MaterialIcons name="schedule" size={16} color="#6B7280" />
                  <Text className="text-gray-500 font-rubik text-sm ml-1">
                    {donation.date}
                  </Text>
                </View>
              </View>
            </View>

            {/* Donation Items */}
            <View className="p-4 bg-gray-50">
              <Text className="font-rubik-medium text-gray-700 mb-2">
                Donated Items:
              </Text>
              {donation.items.map((item, index) => (
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
        ))}
      </ScrollView>

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

        {/* History - Active */}
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
                    source={image} 
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