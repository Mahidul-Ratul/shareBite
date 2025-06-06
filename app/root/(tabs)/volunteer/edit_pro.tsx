import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../../constants/supabaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function EditProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState({
    name: '',
    phone: '',
    address: '',
    languages: '',
    experience: '',
    associated_communities: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const email = await AsyncStorage.getItem('userEmail');
      if (!email) return;

      const { data, error } = await supabase
        .from('volunteer')
        .select('*')
        .eq('email', email)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile');
    }
  };

  const handleUpdate = async () => {
    try {
      const email = await AsyncStorage.getItem('userEmail');
      if (!email) return;

      const { error } = await supabase
        .from('volunteer')
        .update(profile)
        .eq('email', email);

      if (error) throw error;

      Alert.alert('Success', 'Profile updated successfully');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      <View className="flex-row items-center mb-6">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="p-2 rounded-full bg-green-100"
        >
          <Ionicons name="arrow-back" size={24} color="#16a34a" />
        </TouchableOpacity>
        <Text className="text-xl font-rubik-semibold ml-4">Edit Profile</Text>
      </View>

      <View className="space-y-4">
        <View>
          <Text className="text-gray-600 font-rubik-medium mb-2">Full Name</Text>
          <TextInput
            value={profile.name}
            onChangeText={(text) => setProfile(prev => ({ ...prev, name: text }))}
            className="bg-white p-4 rounded-xl border border-gray-200"
            placeholder="Enter your full name"
          />
        </View>

        <View>
          <Text className="text-gray-600 font-rubik-medium mb-2">Phone</Text>
          <TextInput
            value={profile.phone}
            onChangeText={(text) => setProfile(prev => ({ ...prev, phone: text }))}
            className="bg-white p-4 rounded-xl border border-gray-200"
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
          />
        </View>

        <View>
          <Text className="text-gray-600 font-rubik-medium mb-2">Address</Text>
          <TextInput
            value={profile.address}
            onChangeText={(text) => setProfile(prev => ({ ...prev, address: text }))}
            className="bg-white p-4 rounded-xl border border-gray-200"
            placeholder="Enter your address"
            multiline
          />
        </View>

        <View>
          <Text className="text-gray-600 font-rubik-medium mb-2">Languages (comma-separated)</Text>
          <TextInput
            value={profile.languages}
            onChangeText={(text) => setProfile(prev => ({ ...prev, languages: text }))}
            className="bg-white p-4 rounded-xl border border-gray-200"
            placeholder="English, Spanish, etc."
          />
        </View>

        <View>
          <Text className="text-gray-600 font-rubik-medium mb-2">Experience</Text>
          <TextInput
            value={profile.experience}
            onChangeText={(text) => setProfile(prev => ({ ...prev, experience: text }))}
            className="bg-white p-4 rounded-xl border border-gray-200"
            placeholder="Describe your volunteer experience"
            multiline
            numberOfLines={4}
          />
        </View>

        <View>
          <Text className="text-gray-600 font-rubik-medium mb-2">Communities (comma-separated)</Text>
          <TextInput
            value={profile.associated_communities}
            onChangeText={(text) => setProfile(prev => ({ ...prev, associated_communities: text }))}
            className="bg-white p-4 rounded-xl border border-gray-200"
            placeholder="Community names"
          />
        </View>

        <TouchableOpacity
          onPress={handleUpdate}
          className="bg-green-600 p-4 rounded-xl mt-6"
        >
          <Text className="text-white text-center font-rubik-semibold">Save Changes</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}