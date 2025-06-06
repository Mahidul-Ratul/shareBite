import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "../../../../constants/supabaseConfig";
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DonorProfile {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  profileImage?: string;
  coverImage?: string;
  address: string;
  donationsCount: number;
  joinedDate: string;
}

const ProfileScreen = () => {
  const [profile, setProfile] = useState<DonorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      const email = await AsyncStorage.getItem("userEmail");
      if (email) {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("email", email)
          .single();

        if (!error) {
          setProfile({
            ...data,
            donationsCount: data.donationsCount || 0,
            joinedDate: new Date(data.created_at).toLocaleDateString(),
          });
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleLogout = async () => {
      const { error } = await supabase.auth.signOut();
      if (error) {
        Alert.alert("Error", error.message);
      } else {
        router.push(".././login");
      }
    };
  

  if (loading) return (
    <View className="flex-1 items-center justify-center bg-gray-50">
      <ActivityIndicator size="large" color="#22c55e" />
    </View>
  );

  if (!profile) return (
    <View className="flex-1 items-center justify-center bg-gray-50">
      <MaterialCommunityIcons name="account-alert" size={48} color="#6b7280" />
      <Text className="text-gray-600 mt-4 font-rubik-medium">No profile found</Text>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover Section with Better Gradient */}
        <View className="h-48 rounded-b-[40px] overflow-hidden">
          <Image
            source={profile.coverImage 
              ? { uri: profile.coverImage } 
              : require("@/assets/images/hasi.jpg")}
            className="w-full h-full absolute"
            resizeMode="cover"
          />
          
          <LinearGradient
            colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.6)']}
            className="w-full h-full"
          >
            <TouchableOpacity 
              className="absolute top-12 left-4 p-2 rounded-full bg-black/20"
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="absolute top-12 right-4 p-2 rounded-full bg-black/20"
              onPress={() => {/* Add cover photo upload logic */}}
            >
              <MaterialCommunityIcons name="camera" size={24} color="white" />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Profile Content with Better Spacing */}
        <View className="px-5 -mt-24">
          {/* Profile Header */}
          <View className="items-center mb-8">
            <View className="relative">
              <View className="rounded-full p-1 bg-white shadow-lg">
                <Image
                  source={profile.profileImage 
                    ? { uri: profile.profileImage } 
                    : require("@/assets/images/hasi.jpg")}
                  className="w-32 h-32 rounded-full border-4 border-white"
                />
              </View>
              <TouchableOpacity 
                className="absolute bottom-2 right-2 bg-green-500 p-2.5 rounded-full shadow-lg"
              >
                <Ionicons name="camera" size={18} color="white" />
              </TouchableOpacity>
            </View>

            <Text className="text-2xl font-rubik-bold text-gray-800 mt-4">
              {profile.fullName}
            </Text>
            <View className="flex-row items-center mt-1">
              <MaterialCommunityIcons name="crown" size={20} color="#F59E0B" />
              <Text className="text-gray-600 font-rubik-medium ml-1">Food Donor Hero</Text>
            </View>
          </View>

          {/* Stats Cards with Better Shadow */}
          <View className="flex-row justify-between mb-6">
            <View className="bg-white px-6 py-4 rounded-2xl shadow-sm w-[48%] items-center">
              <View className="bg-green-50 p-2 rounded-full mb-2">
                <MaterialCommunityIcons name="food" size={28} color="#22c55e" />
              </View>
              <Text className="text-2xl font-rubik-bold text-gray-800">
                {profile.donationsCount}
              </Text>
              <Text className="text-gray-500 font-rubik">Donations</Text>
            </View>

            <View className="bg-white px-6 py-4 rounded-2xl shadow-sm w-[48%] items-center">
              <View className="bg-green-50 p-2 rounded-full mb-2">
                <MaterialCommunityIcons name="calendar-heart" size={28} color="#22c55e" />
              </View>
              <Text className="text-2xl font-rubik-bold text-gray-800">
                {profile.joinedDate}
              </Text>
              <Text className="text-gray-500 font-rubik">Joined</Text>
            </View>
          </View>

          {/* Details Card with Better Icons */}
          <View className="bg-white rounded-2xl p-5 mb-6 shadow-sm">
            <Text className="text-lg font-rubik-bold text-gray-800 mb-4">Personal Information</Text>
            
            <View className="space-y-4">
              <View className="flex-row items-center">
                <View className="bg-green-50 p-2 rounded-full">
                  <Ionicons name="mail" size={20} color="#22c55e" />
                </View>
                <View className="ml-3">
                  <Text className="text-gray-500 text-xs font-rubik">Email</Text>
                  <Text className="text-gray-800 font-rubik-medium">{profile.email}</Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <View className="bg-green-50 p-2 rounded-full">
                  <Ionicons name="call" size={20} color="#22c55e" />
                </View>
                <View className="ml-3">
                  <Text className="text-gray-500 text-xs font-rubik">Phone</Text>
                  <Text className="text-gray-800 font-rubik-medium">{profile.phoneNumber}</Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <View className="bg-green-50 p-2 rounded-full">
                  <Ionicons name="location" size={20} color="#22c55e" />
                </View>
                <View className="ml-3">
                  <Text className="text-gray-500 text-xs font-rubik">Address</Text>
                  <Text className="text-gray-800 font-rubik-medium">{profile.address}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Action Buttons with Better Styling */}
          <View className="space-y-3 mb-8">
            <TouchableOpacity 
              onPress={() => router.push("./edit-profile")}
              className="bg-green-600 py-4 rounded-xl flex-row justify-center items-center shadow-sm"
            >
              <Ionicons name="create" size={20} color="white" />
              <Text className="text-white font-rubik-bold text-base ml-2">Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleLogout}
              className="bg-white py-4 rounded-xl flex-row justify-center items-center border border-gray-200"
            >
              <Ionicons name="log-out" size={20} color="#EF4444" />
              <Text className="text-red-500 font-rubik-bold text-base ml-2">Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;