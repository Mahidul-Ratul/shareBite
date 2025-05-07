import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { supabase } from '../../../../constants/supabaseConfig';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface VolunteerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  location: string;
  image_url: string;
  status: string;
  availability_days: string;
  availability_times: string;
  languages: string;
  experience: string;
  associated_communities: string;
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<VolunteerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVolunteerProfile();
  }, []);

  const fetchVolunteerProfile = async () => {
    try {
      // Retrieve the email from AsyncStorage
      const email = await AsyncStorage.getItem('userEmail');
      if (!email) {
        Alert.alert('Error', 'No email found in storage. Please log in again.');
        return;
      }

      // Query the volunteer table using the email
      const { data, error } = await supabase
        .from('volunteer')
        .select(
          'id, name, email, phone, address, location, image_url, status, availability_days, availability_times, languages, experience, associated_communities'
        )
        .eq('email', email) // Use the email from AsyncStorage
        .single();

      if (error) throw error;

      // Update the profile state
      setProfile(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      Alert.alert('Success', 'Logged out successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-gray-600">Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Profile Header */}
      <LinearGradient
        colors={['#15803d', '#16a34a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-12 px-6 pb-20"
      >
        <View className="flex-row justify-end mb-4">
          <TouchableOpacity 
            onPress={handleLogout}
            className="bg-white/20 p-2 rounded-full"
          >
            <MaterialIcons name="logout" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View className="items-center">
  <View className="border-4 border-white rounded-full p-1">
    {profile?.image_url ? (
      <Image
        source={{ uri: profile.image_url }} // Use the image_url fetched from the backend
        className="w-28 h-28 rounded-full"
      />
    ) : (
      <Text className="text-white">No Image Available</Text> // Placeholder if image_url is missing
    )}
  </View>
  <View className="bg-white/20 px-4 py-1 rounded-full mt-4">
    <Text className="text-white font-rubik">Volunteer</Text>
  </View>
  <Text className="text-2xl font-rubik-bold text-white mt-3">
    {profile?.name || 'Volunteer'}
  </Text>
  <Text className="text-white/80 font-rubik">{profile?.email}</Text>
</View>
      </LinearGradient>

      {/* Contact Information */}
      <View className="px-6 mt-6">
        <Text className="text-lg font-rubik-semibold text-gray-800 mb-4">Contact Information</Text>
        <View className="bg-gray-50 rounded-xl p-4">
          <View className="flex-row items-center mb-4">
            <MaterialIcons name="phone" size={20} color="#16a34a" />
            <Text className="text-gray-700 ml-3 font-rubik">{profile?.phone}</Text>
          </View>
          <View className="flex-row items-center">
            <MaterialIcons name="location-on" size={20} color="#16a34a" />
            <Text className="text-gray-700 ml-3 font-rubik">{profile?.address}</Text>
          </View>
        </View>
      </View>

      {/* Skills & Experience */}
      <View className="px-6 mt-6">
        <Text className="text-lg font-rubik-semibold text-gray-800 mb-4">Skills & Experience</Text>
        <View className="bg-gray-50 rounded-xl p-4">
          <View className="mb-4">
            <Text className="text-gray-600 font-rubik-medium mb-2">Languages</Text>
            <Text className="text-gray-800 font-rubik">{profile?.languages || 'Not specified'}</Text>
          </View>
          <View>
            <Text className="text-gray-600 font-rubik-medium mb-2">Experience</Text>
            <Text className="text-gray-800 font-rubik">{profile?.experience || 'Not specified'}</Text>
          </View>
        </View>
      </View>

      {/* Associated Communities */}
      <View className="px-6 mt-6 mb-8">
        <Text className="text-lg font-rubik-semibold text-gray-800 mb-4">Associated Communities</Text>
        <Text className="text-gray-800 font-rubik">{profile?.associated_communities || 'Not specified'}</Text>
      </View>
    </ScrollView>
  );
}