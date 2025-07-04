import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { MaterialIcons, FontAwesome, Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";

export default function SettingsScreen() {
  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Header */}
        <View className="bg-white px-4 py-3 border-b border-gray-200">
          <Text className="text-2xl font-rubik-bold text-gray-800">Settings</Text>
          <Text className="text-sm font-rubik text-gray-600">Manage your preferences</Text>
        </View>

        {/* Settings List */}
        <View className="px-4 py-4">
          <View className="bg-white rounded-xl overflow-hidden">
            <TouchableOpacity className="flex-row items-center px-4 py-4 border-b border-gray-100">
              <Ionicons name="person-outline" size={24} color="#16a34a" />
              <View className="ml-3 flex-1">
                <Text className="text-gray-800 font-rubik-medium">Profile Settings</Text>
                <Text className="text-gray-500 text-sm">Update your information</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#6B7280" />
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center px-4 py-4 border-b border-gray-100">
              <Ionicons name="notifications-outline" size={24} color="#16a34a" />
              <View className="ml-3 flex-1">
                <Text className="text-gray-800 font-rubik-medium">Notifications</Text>
                <Text className="text-gray-500 text-sm">Manage your notifications</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#6B7280" />
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center px-4 py-4 border-b border-gray-100">
              <MaterialIcons name="security" size={24} color="#16a34a" />
              <View className="ml-3 flex-1">
                <Text className="text-gray-800 font-rubik-medium">Privacy & Security</Text>
                <Text className="text-gray-500 text-sm">Manage your account security</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#6B7280" />
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center px-4 py-4">
              <Ionicons name="help-circle-outline" size={24} color="#16a34a" />
              <View className="ml-3 flex-1">
                <Text className="text-gray-800 font-rubik-medium">Help & Support</Text>
                <Text className="text-gray-500 text-sm">Get help and contact us</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}