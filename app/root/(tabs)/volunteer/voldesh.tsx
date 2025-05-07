import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../../constants/supabaseConfig';
import { useEffect } from 'react';
import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the Volunteer type
interface Volunteer {
  name: string;
  role: string;
  location: string;
  image_url: any;
  stats: {
    deliveries: string;
    communities: string;
    rating: string;
  };
  recentActivity: Array<{
    id: string;
    image: any;
    type: string;
    typeColor: string;
    date: string;
    title: string;
    description: string;
    meals: string;
    location: string;
  }>;
}

export default function VolunteerHome() {
  const router = useRouter();

  const [volunteer, setVolunteer] = useState({
    name: '',
    role: 'Active Volunteer',
    location: '',
    image_url: require('@/assets/images/hasi.jpg'),
    stats: {
      deliveries: '0',
      communities: '0',
      rating: '0.0',
    },
    recentActivity: [],
  });
    // Fetch volunteer data from the backend
    useEffect(() => {
      const fetchVolunteerData = async () => {
        try {
          // Retrieve email from AsyncStorage
          const email = await AsyncStorage.getItem('userEmail');
          if (!email) {
            Alert.alert('Error', 'No email found in storage.');
            return;
          }
  
          // Query Supabase using the email
          const { data, error } = await supabase
            .from('volunteer')
            .select('name, image_url') // Only fetch name and image_url
            .eq('email', email) // Use the email from AsyncStorage
            .single();
  
          if (error) {
            throw error;
          }
  
          // Update state with fetched data
          setVolunteer((prev) => ({
            ...prev,
            name: data.name,
            image_url: data.image_url || require('@/assets/images/hasi.jpg'), // Fallback to default image
          }));
        } catch (error) {
          Alert.alert('Error', (error as Error).message);
        }
      };
  
      fetchVolunteerData();
    }, []);
    
    

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1">
        {/* Replace the gradient View with LinearGradient */}
        <LinearGradient
          colors={['#f97316', '#ea580c']} // orange-500 to orange-600
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="pt-12 pb-8 px-6"
        >
          {/* App Header */}
          <View className="flex-row justify-between items-center mb-6">
            <View className="flex-row items-center">
              <Image 
                source={require("@/assets/images/images.jpeg")} 
                className="w-10 h-10 rounded-full" 
              />
              <Text className="text-xl font-rubik-bold text-white ml-2">
                ShareBite
              </Text>
            </View>
            <TouchableOpacity 
              className="bg-white/20 p-2 rounded-full"
            >
              <View>
                <MaterialIcons name="notifications" size={24} color="white" />
                <View className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full items-center justify-center">
                  <Text className="text-white text-xs font-bold">2</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Profile Section */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center">
              <Image 
                source={typeof volunteer.image_url === 'string' ? { uri: volunteer.image_url } : volunteer.image_url}
                className="w-16 h-16 rounded-full border-2 border-white/20"
              />
              <View className="ml-3">
                <Text className="text-xl font-rubik-bold text-white">{volunteer.name}</Text>
                <View className="flex-row items-center">
                  <MaterialIcons name="verified-user" size={16} color="#FFF" />
                  <Text className="text-white/90 ml-1">{volunteer.role}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Stats Cards */}
          <View className="flex-row mt-4">
            <View className="flex-1 bg-white/10 rounded-xl p-3 mr-2">
              <Text className="text-white/80 text-sm">Deliveries</Text>
              <Text className="text-white text-xl font-rubik-bold mt-1">{volunteer.stats.deliveries}</Text>
            </View>
            <View className="flex-1 bg-white/10 rounded-xl p-3 mx-2">
              <Text className="text-white/80 text-sm">Communities</Text>
              <Text className="text-white text-xl font-rubik-bold mt-1">{volunteer.stats.communities}</Text>
            </View>
            <View className="flex-1 bg-white/10 rounded-xl p-3 ml-2">
              <Text className="text-white/80 text-sm">Rating</Text>
              <View className="flex-row items-center mt-1">
                <Text className="text-white text-xl font-rubik-bold">{volunteer.stats.rating}</Text>
                <MaterialIcons name="star" size={16} color="#FCD34D" className="ml-1" />
              </View>
            </View>
          </View>
        </LinearGradient>

        <View className="px-6 -mt-6">
          {/* Quick Actions */}
          <View className="bg-white rounded-xl shadow-lg shadow-gray-200 border border-gray-100 p-4 mb-6">
            <Text className="text-lg font-rubik-bold text-gray-800 mb-4">Quick Actions</Text>
            <View className="flex-row justify-between">
              <TouchableOpacity 
                className="flex-1 items-center mr-2 bg-orange-50 p-4 rounded-xl"
                onPress={() => router.push('./available-tasks')}
              >
                <MaterialIcons name="search" size={24} color="#F97316" />
                <Text className="text-orange-700 font-rubik-medium mt-2">Find Tasks</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="flex-1 items-center ml-2 bg-green-50 p-4 rounded-xl"
                onPress={() => router.push('./my-tasks')}
              >
                <MaterialIcons name="assignment" size={24} color="#16A34A" />
                <Text className="text-green-700 font-rubik-medium mt-2">My Tasks</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Activity */}
          <Text className="text-xl font-rubik-bold text-gray-800 mb-4">Recent Activity</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            className="mb-6"
          >
            {volunteer.recentActivity.map((activity: {
              id: string;
              image: any;
              type: string;
              typeColor: string;
              date: string;
              title: string;
              description: string;
              meals: string;
              location: string;
            }) => (
              <View 
              key={activity.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 mr-4 w-300"
              >
              <Image 
                source={activity.image}
                className="w-full h-40 rounded-t-xl"
                resizeMode="cover"
              />
              <View className="p-4">
                <View className="flex-row justify-between items-center mb-2">
                <View className={`bg-${activity.typeColor}-50 px-3 py-1 rounded-full`}>
                  <Text className={`text-${activity.typeColor}-600 text-xs font-rubik-medium`}>
                  {activity.type}
                  </Text>
                </View>
                <Text className="text-gray-500 text-xs">{activity.date}</Text>
                </View>
                <Text className="text-lg font-rubik-bold text-gray-800 mb-1">
                {activity.title}
                </Text>
                <Text className="text-gray-600 text-sm mb-3">
                {activity.description}
                </Text>
                <View className="flex-row justify-between items-center">
                <View className="flex-row items-center">
                  <MaterialIcons name="restaurant" size={16} color="#16A34A" />
                  <Text className="text-green-600 text-sm ml-1">{activity.meals} meals</Text>
                </View>
                <View className="flex-row items-center">
                  <MaterialIcons name="location-on" size={16} color="#6B7280" />
                  <Text className="text-gray-600 text-sm ml-1">{activity.location}</Text>
                </View>
                </View>
              </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View className="flex-row justify-between items-center bg-white py-3 px-6 border-t border-gray-200">
  <Link href="./vol_home" asChild>
    <TouchableOpacity className="items-center flex-1">
      <FontAwesome5 name="home" size={24} color="#F97316" />
      <Text className="text-orange-500 text-xs mt-1 font-rubik-medium">Home</Text>
    </TouchableOpacity>
  </Link>

  <Link href="./news" asChild>
    <TouchableOpacity className="items-center flex-1">
      <FontAwesome5 name="newspaper" size={24} color="#6B7280" />
      <Text className="text-gray-600 text-xs mt-1 font-rubik-medium">News</Text>
    </TouchableOpacity>
  </Link>

  <Link href="./available-tasks" asChild>
    <TouchableOpacity className="items-center flex-1">
      <View className="bg-orange-500 p-3 rounded-full -mt-8 border-4 border-white shadow-lg">
        <FontAwesome5 name="plus" size={24} color="white" />
      </View>
      <Text className="text-gray-600 text-xs mt-1 font-rubik-medium">Tasks</Text>
    </TouchableOpacity>
  </Link>

  <Link href="./my-tasks" asChild>
    <TouchableOpacity className="items-center flex-1">
      <FontAwesome5 name="history" size={24} color="#6B7280" />
      <Text className="text-gray-600 text-xs mt-1 font-rubik-medium">History</Text>
    </TouchableOpacity>
  </Link>

  <Link href="./vol_pro" asChild>
    <TouchableOpacity className="items-center flex-1">
      <FontAwesome5 name="user-circle" size={24} color="#6B7280" />
      <Text className="text-gray-600 text-xs mt-1 font-rubik-medium">Profile</Text>
    </TouchableOpacity>
  </Link>
</View>
    </View>
  );
}


// Removed the conflicting local declaration of useEffect.
// Adjusted the Supabase query to match the new table structure
