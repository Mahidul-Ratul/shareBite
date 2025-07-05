import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native";
import { Link, useRouter } from "expo-router";
import { FontAwesome, MaterialIcons, Ionicons } from "@expo/vector-icons";
import { supabase } from '../../../../constants/supabaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DonationRequest() {
  const router = useRouter();

  // State for form fields
  const [foodType, setFoodType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [services, setServices] = useState("");
  const [description, setDescription] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!foodType || !quantity || !services || !description || !pickupAddress) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      // Get the current receiver's ID
      const userEmail = await AsyncStorage.getItem("userEmail");
      if (!userEmail) {
        Alert.alert("Error", "User not found. Please login again.");
        return;
      }
      
      const { data: receiverData, error: receiverError } = await supabase
        .from('receiver')
        .select('id')
        .eq('email', userEmail)
        .single();
      
      if (receiverError || !receiverData) {
        Alert.alert("Error", "Receiver information not found.");
        return;
      }
      
      const { data, error } = await supabase.from('request').insert([
        {
          food_type: foodType,
          quantity: quantity,
          services: services,
          description: description,
          pickup_address: pickupAddress,
          ngo_id: receiverData.id,
        }
      ]).select();
      if (error) {
        console.log('Supabase insert error:', error);
        throw error;
      }
      // Send notifications to admin and all donors
      const requestId = data && data[0] && data[0].id;
      const now = new Date().toISOString();
      // Fetch all donors (get both email and id)
      const { data: donors, error: donorsError } = await supabase.from('users').select('email, id');
      if (donorsError) {
        console.log('Donors fetch error:', donorsError);
      }
      const notificationPayloads = [
        {
          title: 'New Donation Request',
          message: `A new donation request has been submitted for ${foodType} (${quantity}).`,
          created_at: now,
          type: 'request',
          isread: false,
          for: 'admin',
          request_id: requestId,
          ngo_id: receiverData.id,
        },
        // Notifications for all donors (with both for and donor_id)
        ...(donors ? donors.map((donor: any) => ({
          title: 'New Donation Request',
          message: `A new donation request for ${foodType} (${quantity}) is available!`,
          created_at: now,
          type: 'request',
          isread: false,
          for: donor.email,
          donor_id: donor.id || null,
          request_id: requestId,
          ngo_id: receiverData.id,
        })) : [])
      ];
      console.log('Notification payloads:', notificationPayloads);
      const { error: notifError } = await supabase.from('notifications').insert(notificationPayloads);
      if (notifError) {
        console.log('Notification insert error:', notifError);
      }
      Alert.alert("Success", "Request submitted successfully!", [
        { text: "OK", onPress: () => router.push("./dashboard") }
      ]);
      setFoodType("");
      setQuantity("");
      setServices("");
      setDescription("");
      setPickupAddress("");
    } catch (error) {
      Alert.alert("Error", (error as any).message || "Failed to submit request.");
    } finally {
      setLoading(false);
    }
  };

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
              value={foodType}
              onChangeText={setFoodType}
            />
          </View>

          {/* Quantity and Servings */}
          <View className="flex-row p-4 border-b border-gray-100">
            <View className="flex-1 mr-2">
              <Text className="font-rubik-medium text-gray-700 mb-2">Quantity</Text>
              <TextInput
                className="bg-gray-50 px-4 py-3 rounded-xl font-rubik text-gray-800"
                placeholder="e.g., 5 kg"
                value={quantity}
                onChangeText={setQuantity}
              />
            </View>
            <View className="flex-1 ml-2">
              <Text className="font-rubik-medium text-gray-700 mb-2">Servings</Text>
              <TextInput
                className="bg-gray-50 px-4 py-3 rounded-xl font-rubik text-gray-800"
                placeholder="e.g., 50 people"
                value={services}
                onChangeText={setServices}
              />
            </View>
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
              value={description}
              onChangeText={setDescription}
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
              value={pickupAddress}
              onChangeText={setPickupAddress}
            />
          </View>
        </View>

        {/* Submit Button */}
        <View className="px-4">
          <TouchableOpacity 
            className="bg-orange-500 py-4 rounded-xl items-center"
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text className="text-white font-rubik-bold text-lg">{loading ? 'Submitting...' : 'Submit Request'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}