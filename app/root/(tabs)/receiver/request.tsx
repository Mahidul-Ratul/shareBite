import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { Link, useRouter } from "expo-router";
import { FontAwesome, MaterialIcons, Ionicons } from "@expo/vector-icons";
import BottomNavigation from "./BottomNavigation";

export default function DonationRequest() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Header */}
        <View className="bg-white px-4 py-3 border-b border-gray-200">
          <Text className="text-2xl font-rubik-bold text-gray-800">New Request</Text>
          <Text className="text-sm font-rubik text-gray-600">Fill in the donation details</Text>
        </View>

        {/* Form Content */}
        <View className="px-4 py-4">
          {/* Food Type */}
          <View className="p-4 border-b border-gray-100">
            <Text className="font-rubik-medium text-gray-700 mb-2">Food Type</Text>
            <TextInput
              className="bg-gray-50 px-4 py-3 rounded-xl font-rubik text-gray-800"
              placeholder="e.g., Cooked Meals, Packaged Food"
              // value={formData.foodType}
              // onChangeText={(text) => setFormData({ ...formData, foodType: text })}
            />
          </View>

          {/* Quantity and Servings */}
          <View className="flex-row p-4 border-b border-gray-100">
            <View className="flex-1 mr-2">
              <Text className="font-rubik-medium text-gray-700 mb-2">Quantity</Text>
              <TextInput
                className="bg-gray-50 px-4 py-3 rounded-xl font-rubik text-gray-800"
                placeholder="e.g., 5 kg"
                // value={formData.quantity}
                // onChangeText={(text) => setFormData({ ...formData, quantity: text })}
              />
            </View>
            <View className="flex-1 ml-2">
              <Text className="font-rubik-medium text-gray-700 mb-2">Servings</Text>
              <TextInput
                className="bg-gray-50 px-4 py-3 rounded-xl font-rubik text-gray-800"
                placeholder="e.g., 50 people"
                // value={formData.servings}
                // onChangeText={(text) => setFormData({ ...formData, servings: text })}
              />
            </View>
          </View>

          {/* Pickup Time */}
          <View className="p-4 border-b border-gray-100">
            <Text className="font-rubik-medium text-gray-700 mb-2">Preferred Pickup Time</Text>
            <TouchableOpacity 
              className="bg-gray-50 px-4 py-3 rounded-xl flex-row items-center"
              onPress={() => {/* Add time picker */}}
            >
              <MaterialIcons name="schedule" size={20} color="#6B7280" />
              <Text className="font-rubik text-gray-600 ml-2">
                {/* {formData.pickupTime || "Select time"} */}Select time
              </Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View className="p-4 border-b border-gray-100">
            <Text className="font-rubik-medium text-gray-700 mb-2">Description</Text>
            <TextInput
              className="bg-gray-50 px-4 py-3 rounded-xl font-rubik text-gray-800"
              placeholder="Additional details about the food"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              // value={formData.description}
              // onChangeText={(text) => setFormData({ ...formData, description: text })}
            />
          </View>

          {/* Pickup Address */}
          <View className="p-4">
            <Text className="font-rubik-medium text-gray-700 mb-2">Pickup Address</Text>
            <TextInput
              className="bg-gray-50 px-4 py-3 rounded-xl font-rubik text-gray-800"
              placeholder="Enter complete address"
              multiline
              numberOfLines={2}
              textAlignVertical="top"
              // value={formData.address}
              // onChangeText={(text) => setFormData({ ...formData, address: text })}
            />
          </View>
        </View>

        {/* Submit Button */}
        <View className="px-4">
          <TouchableOpacity 
            className="bg-orange-500 py-4 rounded-xl items-center"
            onPress={() => {/* Handle submission */}}
          >
            <Text className="text-white font-rubik-bold text-lg">Submit Request</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation currentPage="request" />
    </View>
  );
}
