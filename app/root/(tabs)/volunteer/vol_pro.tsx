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

  // Example stats (replace with real data if available)
  const stats = [
    { label: 'Deliveries', value: '24', icon: 'local-shipping', color: '#f97316' },
    { label: 'Events', value: '8', icon: 'event', color: '#2563EB' },
    { label: 'Points', value: '1200', icon: 'stars', color: '#9333EA' },
  ];

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
      await AsyncStorage.multiRemove(['userEmail', 'userRole']);
      router.replace('../login');
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
      {/* Modern Profile Header */}
      <LinearGradient
        colors={['#f97316', '#ea580c']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-14 px-6 pb-10 rounded-b-[40px] relative"
      >
        {/* Action Buttons */}
        <View className="flex-row justify-between mb-2">
          <TouchableOpacity onPress={handleEditProfile} className="p-2 rounded-full bg-white/20">
            <FontAwesome5 name="user-edit" size={22} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} className="p-2 rounded-full bg-white/20">
            <MaterialIcons name="logout" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
        <View className="items-center mt-2">
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
          <View className="flex-row items-center mt-4">
            <Text className="text-3xl font-rubik-bold text-white mr-2">
              {profile?.name || 'Volunteer'}
            </Text>
            <View className="bg-white/30 px-4 py-1 rounded-full">
              <Text className="text-white font-rubik text-base">{profile?.status || 'Active Volunteer'}</Text>
            </View>
          </View>
          <Text className="text-white/90 font-rubik mt-1">{profile?.email}</Text>
          <Text className="text-white/80 font-rubik mt-2 italic text-base">“Thank you for making a difference!”</Text>
        </View>
        {/* Stats Section */}
        <View className="flex-row justify-between mt-8">
          {stats.map((stat, idx) => (
            <View key={idx} className="flex-1 bg-white/20 rounded-2xl mx-1 p-4 items-center shadow-md">
              <MaterialIcons name={stat.icon as any} size={28} color={stat.color} />
              <Text className="text-white text-xl font-rubik-bold mt-2">{stat.value}</Text>
              <Text className="text-white/80 text-xs mt-1">{stat.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* Info Cards Container */}
      <View className="px-6 -mt-8">
        {/* Contact Information Card */}
        <View className="bg-white rounded-2xl p-6 shadow-lg mb-6 border border-gray-100">
          <View className="flex-row items-center mb-4">
            <View className="bg-orange-100 p-2 rounded-full">
              <MaterialIcons name="contact-phone" size={24} color="#f97316" />
            </View>
            <Text className="text-lg font-rubik-semibold text-gray-800 ml-3">Contact Information</Text>
          </View>
          <View className="space-y-4">
            <View className="flex-row items-center">
              <MaterialIcons name="phone" size={20} color="#f97316" />
              <Text className="text-gray-700 ml-3 font-rubik">{profile?.phone || 'Not provided'}</Text>
            </View>
            <View className="flex-row items-center">
              <MaterialIcons name="location-on" size={20} color="#f97316" />
              <Text className="text-gray-700 ml-3 font-rubik flex-1">{profile?.address || 'Not provided'}</Text>
            </View>
          </View>
        </View>

        {/* Skills & Experience Card */}
        <View className="bg-white rounded-2xl p-6 shadow-lg mb-6 border border-gray-100">
          <View className="flex-row items-center mb-4">
            <View className="bg-orange-100 p-2 rounded-full">
              <FontAwesome5 name="user-graduate" size={20} color="#f97316" />
            </View>
            <Text className="text-lg font-rubik-semibold text-gray-800 ml-3">Skills & Experience</Text>
          </View>
          <View className="space-y-4">
            <View>
              <Text className="text-gray-600 font-rubik-medium mb-2">Languages</Text>
              <View className="flex-row flex-wrap gap-2">
                {(profile?.languages || 'English').split(',').map((language, index) => (
                  <View key={index} className="bg-orange-100 px-3 py-1 rounded-full mb-2">
                    <Text className="text-orange-700 font-rubik">{language.trim()}</Text>
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
        <View className="bg-white rounded-2xl p-6 shadow-lg mb-8 border border-gray-100">
          <View className="flex-row items-center mb-4">
            <View className="bg-orange-100 p-2 rounded-full">
              <FontAwesome5 name="users" size={20} color="#f97316" />
            </View>
            <Text className="text-lg font-rubik-semibold text-gray-800 ml-3">Associated Communities</Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {(profile?.associated_communities || 'None').split(',').map((community, index) => (
              <View key={index} className="bg-orange-50 px-4 py-2 rounded-xl mb-2">
                <Text className="text-orange-700 font-rubik">{community.trim()}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}