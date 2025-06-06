import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { supabase } from '../../../../constants/supabaseConfig';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

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
  const router = useRouter();

  useEffect(() => {
    fetchVolunteerProfile();
  }, []);

  const fetchVolunteerProfile = async () => {
    try {
      const email = await AsyncStorage.getItem('userEmail');
      if (!email) {
        Alert.alert('Error', 'No email found in storage. Please log in again.');
        return;
      }

      const { data, error } = await supabase
        .from('volunteer')
        .select(
          'id, name, email, phone, address, location, image_url, status, availability_days, availability_times, languages, experience, associated_communities'
        )
        .eq('email', email)
        .single();

      if (error) throw error;

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
      
      // Clear local storage
      await AsyncStorage.multiRemove(['userEmail', 'userRole']);
      
      // Navigate to login screen
      router.replace('/root/(tabs)/login');
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const handleEditProfile = () => {
    router.push('./edit_pro');
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
      {/* Enhanced Profile Header */}
      <LinearGradient
        colors={['#15803d', '#16a34a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-12 px-6 pb-24 rounded-b-[40px]"
      >
        <View className="flex-row justify-between mb-4">
          <TouchableOpacity 
                        onPress={() => router.push('./edit_pro')}
                        className="p-2 rounded-full bg-white/10"
                      >
                        <FontAwesome5 name="user-edit" size={24} color="#FFF" />
                      </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={handleLogout}
            className="bg-white/30 p-3 rounded-full shadow-sm"
          >
            <MaterialIcons name="logout" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View className="items-center">
          <View className="border-4 border-white rounded-full p-1 shadow-lg">
            {profile?.image_url ? (
              <Image
                source={{ uri: profile.image_url }}
                className="w-32 h-32 rounded-full"
              />
            ) : (
              <View className="w-32 h-32 rounded-full bg-gray-200 items-center justify-center">
                <FontAwesome5 name="user-alt" size={40} color="#9ca3af" />
              </View>
            )}
          </View>
          <View className="bg-white/30 px-6 py-2 rounded-full mt-4">
            <Text className="text-white font-rubik text-base">Active Volunteer</Text>
          </View>
          <Text className="text-3xl font-rubik-bold text-white mt-4">
            {profile?.name || 'Volunteer'}
          </Text>
          <Text className="text-white/90 font-rubik mt-1">{profile?.email}</Text>
        </View>
      </LinearGradient>

      {/* Info Cards Container */}
      <View className="px-6 -mt-12">
        {/* Contact Information Card */}
        <View className="bg-white rounded-2xl p-6 shadow-md mb-6">
          <View className="flex-row items-center mb-4">
            <View className="bg-green-100 p-2 rounded-full">
              <MaterialIcons name="contact-phone" size={24} color="#16a34a" />
            </View>
            <Text className="text-lg font-rubik-semibold text-gray-800 ml-3">Contact Information</Text>
          </View>
          
          <View className="space-y-4">
            <View className="flex-row items-center">
              <MaterialIcons name="phone" size={20} color="#16a34a" />
              <Text className="text-gray-700 ml-3 font-rubik">{profile?.phone || 'Not provided'}</Text>
            </View>
            <View className="flex-row items-center">
              <MaterialIcons name="location-on" size={20} color="#16a34a" />
              <Text className="text-gray-700 ml-3 font-rubik flex-1">{profile?.address || 'Not provided'}</Text>
            </View>
          </View>
        </View>

        {/* Skills & Experience Card */}
        <View className="bg-white rounded-2xl p-6 shadow-md mb-6">
          <View className="flex-row items-center mb-4">
            <View className="bg-green-100 p-2 rounded-full">
              <FontAwesome5 name="user-graduate" size={20} color="#16a34a" />
            </View>
            <Text className="text-lg font-rubik-semibold text-gray-800 ml-3">Skills & Experience</Text>
          </View>
          
          <View className="space-y-4">
            <View>
              <Text className="text-gray-600 font-rubik-medium mb-2">Languages</Text>
              <View className="flex-row flex-wrap gap-2">
                {(profile?.languages || 'English').split(',').map((language, index) => (
                  <View key={index} className="bg-green-100 px-3 py-1 rounded-full">
                    <Text className="text-green-700 font-rubik">{language.trim()}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View>
              <Text className="text-gray-600 font-rubik-medium mb-2">Experience</Text>
              <Text className="text-gray-800 font-rubik leading-relaxed">
                {profile?.experience || 'Not specified'}
              </Text>
            </View>
          </View>
        </View>

        {/* Communities Card */}
        <View className="bg-white rounded-2xl p-6 shadow-md mb-8">
          <View className="flex-row items-center mb-4">
            <View className="bg-green-100 p-2 rounded-full">
              <FontAwesome5 name="users" size={20} color="#16a34a" />
            </View>
            <Text className="text-lg font-rubik-semibold text-gray-800 ml-3">Associated Communities</Text>
          </View>
          
          <View className="flex-row flex-wrap gap-2">
            {(profile?.associated_communities || 'None').split(',').map((community, index) => (
              <View key={index} className="bg-green-50 px-4 py-2 rounded-xl">
                <Text className="text-green-700 font-rubik">{community.trim()}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}