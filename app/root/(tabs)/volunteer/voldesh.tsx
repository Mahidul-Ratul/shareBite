import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../../constants/supabaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the Volunteer type
interface Volunteer {
  id: string;
  name: string;
  role: string;
  email: string;
  location: string;
  image_url: string | number; // Accepts both static require and string uri
  badges: string[];
  stats: {
    deliveries: string;
    communities: string;
    rating: string;
    totalHours: string;
    eventsJoined: string;
    donationsHandled: string;
    points: string;
  };
  certifications: Array<{
    id: string;
    name: string;
    issueDate: string;
    expiryDate: string;
  }>;
  upcomingEvents: Array<{
    id: string;
    title: string;
    date: string;
    time: string;
    location: string;
    type: string;
    status: 'confirmed' | 'pending';
  }>;
  recentActivity: Array<{
    id: string;
    image: string | number;
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
      totalHours: '0',
      eventsJoined: '0',
      donationsHandled: '0',
      points: '0',
    },
    recentActivity: [],
  });

  const [welcomeQuote, setWelcomeQuote] = useState('Thank you for making a difference today!');
  const [volunteerStats, setVolunteerStats] = useState({
    totalHours: '0',
    eventsJoined: '0',
    donationsHandled: '0',
    points: '0',
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
        {/* Welcome Section */}
        <View className="bg-white px-6 pt-12 pb-4">
          <Text className="text-2xl font-rubik-bold text-gray-900">
            Welcome back, {volunteer.name}!
          </Text>
          <Text className="text-gray-600 mt-1">{welcomeQuote}</Text>
        </View>

        <LinearGradient
          colors={['#f97316', '#ea580c']} // orange-500 to orange-600
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="pt-5 pb-8 px-6 rounded-b-[40px]"
        >
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
            {/* Update the notification button in the Profile Section */}
            <TouchableOpacity 
              className="bg-white/20 p-2 rounded-full"
              onPress={() => router.push('./notification')}
            >
              <View>
                <MaterialIcons name="notifications" size={24} color="white" />
                <View className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full items-center justify-center">
                  <Text className="text-white text-xs font-bold">2</Text>
                </View>
              </View>
            </TouchableOpacity>
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
          {/* Enhanced Stats Overview */}
          <View className="bg-white rounded-xl shadow-lg shadow-gray-200 border border-gray-100 p-4 mb-6">
            <Text className="text-lg font-rubik-bold text-gray-800 mb-4">Your Impact</Text>
            <View className="flex-row flex-wrap justify-between">
              <View className="w-[48%] mb-4">
                <View className="flex-row items-center">
                  <MaterialIcons name="schedule" size={20} color="#16A34A" />
                  <Text className="text-gray-600 ml-2">Hours</Text>
                </View>
                <Text className="text-xl font-rubik-bold text-gray-800 mt-1">
                  {volunteerStats.totalHours}
                </Text>
              </View>
              <View className="w-[48%] mb-4">
                <View className="flex-row items-center">
                  <MaterialIcons name="event" size={20} color="#2563EB" />
                  <Text className="text-gray-600 ml-2">Events</Text>
                </View>
                <Text className="text-xl font-rubik-bold text-gray-800 mt-1">
                  {volunteerStats.eventsJoined}
                </Text>
              </View>
              <View className="w-[48%]">
                <View className="flex-row items-center">
                  <MaterialIcons name="volunteer-activism" size={20} color="#F97316" />
                  <Text className="text-gray-600 ml-2">Donations</Text>
                </View>
                <Text className="text-xl font-rubik-bold text-gray-800 mt-1">
                  {volunteerStats.donationsHandled}
                </Text>
              </View>
              <View className="w-[48%]">
                <View className="flex-row items-center">
                  <MaterialIcons name="stars" size={20} color="#9333EA" />
                  <Text className="text-gray-600 ml-2">Points</Text>
                </View>
                <Text className="text-xl font-rubik-bold text-gray-800 mt-1">
                  {volunteerStats.points}
                </Text>
              </View>
            </View>
          </View>

          {/* Announcements Section */}
          <View className="bg-white rounded-xl shadow-lg shadow-gray-200 border border-gray-100 p-4 mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-rubik-bold text-gray-800">Announcements</Text>
              <TouchableOpacity>
                <Text className="text-orange-500 font-rubik-medium">View All</Text>
              </TouchableOpacity>
            </View>
            <View className="bg-orange-50 rounded-xl p-4">
              <View className="flex-row items-center mb-2">
                <MaterialIcons name="campaign" size={20} color="#F97316" />
                <Text className="text-orange-700 font-rubik-medium ml-2">New Campaign</Text>
              </View>
              <Text className="text-gray-700">Join our weekend food distribution drive!</Text>
              <Text className="text-gray-500 text-sm mt-2">2 hours ago</Text>
            </View>
          </View>

          {/* Community Feed */}
          <View className="bg-white rounded-xl shadow-lg shadow-gray-200 border border-gray-100 p-4 mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-rubik-bold text-gray-800">Community Feed</Text>
              <TouchableOpacity>
                <Text className="text-orange-500 font-rubik-medium">View All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="bg-gray-50 rounded-xl p-4 mr-4 w-64">
                <Image
                  source={require('@/assets/images/vol.jpg')}
                  className="w-full h-32 rounded-xl mb-3"
                  resizeMode="cover"
                />
                <Text className="text-gray-900 font-rubik-medium">Food Distribution Success!</Text>
                <Text className="text-gray-600 text-sm mt-1">100 meals delivered today</Text>
                <View className="flex-row items-center mt-2">
                  <MaterialIcons name="favorite" size={16} color="#EF4444" />
                  <Text className="text-gray-500 text-sm ml-1">24 likes</Text>
                </View>
              </View>
            </ScrollView>
          </View>

          {/* Quick Actions */}
          <View className="bg-white rounded-xl shadow-lg shadow-gray-200 border border-gray-100 p-4 mb-6">
            <Text className="text-lg font-rubik-bold text-gray-800 mb-4">Quick Actions</Text>
            <View className="flex-row flex-wrap justify-between">
              {/* Log Hours */}
              <TouchableOpacity
                className="w-[48%] bg-green-50 p-4 rounded-xl mb-3"
                onPress={() => router.push('./log-hours')}
              >
                <View className="flex-row items-center">
                  <View className="bg-green-100 p-2 rounded-full">
                    <MaterialIcons name="check-circle" size={24} color="#16A34A" />
                  </View>
                  <Text className="text-green-700 font-rubik-medium ml-3">Log Hours</Text>
                </View>
              </TouchableOpacity>

              {/* Join Event */}
              <TouchableOpacity
                className="w-[48%] bg-blue-50 p-4 rounded-xl mb-3"
                onPress={() => router.push('./join-event')}
              >
                <View className="flex-row items-center">
                  <View className="bg-blue-100 p-2 rounded-full">
                    <MaterialIcons name="add-circle" size={24} color="#2563EB" />
                  </View>
                  <Text className="text-blue-700 font-rubik-medium ml-3">Join Event</Text>
                </View>
              </TouchableOpacity>

              {/* Submit Report */}
              <TouchableOpacity
                className="w-[48%] bg-orange-50 p-4 rounded-xl"
                onPress={() => router.push('./submit-report')}
              >
                <View className="flex-row items-center">
                  <View className="bg-orange-100 p-2 rounded-full">
                    <MaterialIcons name="upload-file" size={24} color="#F97316" />
                  </View>
                  <Text className="text-orange-700 font-rubik-medium ml-3">Report</Text>
                </View>
              </TouchableOpacity>

              {/* View Calendar */}
              <TouchableOpacity
                className="w-[48%] bg-purple-50 p-4 rounded-xl"
                onPress={() => router.push('./calendar')}
              >
                <View className="flex-row items-center">
                  <View className="bg-purple-100 p-2 rounded-full">
                    <MaterialIcons name="calendar-today" size={24} color="#9333EA" />
                  </View>
                  <Text className="text-purple-700 font-rubik-medium ml-3">Calendar</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Activity */}
          <Text className="text-xl font-rubik-bold text-gray-800 mb-4">Recent Activity</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
            {volunteer.recentActivity.map((activity: {
              id: string;
              image: string | number;
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
                  source={typeof activity.image === 'string' ? { uri: activity.image } : activity.image}
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
      <View className="flex-row justify-between items-center bg-white py-3 px-6 border-t border-gray-200 shadow-lg">
        <Link href="./vol_home" asChild>
          <TouchableOpacity className="items-center flex-1">
            <View className="relative">
              <FontAwesome5 name="home" size={24} color="#F97316" />
              <View className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" />
            </View>
            <Text className="text-orange-500 text-xs mt-1 font-rubik-medium">Home</Text>
          </TouchableOpacity>
        </Link>

        <Link href="./news" asChild>
          <TouchableOpacity
            className="items-center flex-1"
            style={{ transform: [{ scale: 1 }] }}
          >
            <FontAwesome5 name="newspaper" size={24} color="#6B7280" />
            <Text className="text-gray-600 text-xs mt-1 font-rubik-medium">News</Text>
          </TouchableOpacity>
        </Link>

        <Link href="./ongoing-donation" asChild>
          <TouchableOpacity className="items-center flex-1">
            <View className="bg-orange-500 p-3 rounded-full -mt-8 border-4 border-white shadow-xl">
              <FontAwesome5 name="plus" size={24} color="white" />
            </View>
            <Text className="text-gray-600 text-xs mt-1 font-rubik-medium">Tasks</Text>
          </TouchableOpacity>
        </Link>

        <Link href="./history" asChild>
          <TouchableOpacity
            className="items-center flex-1"
            style={{ transform: [{ scale: 1 }] }}
          >
            <View className="relative">
              <FontAwesome5 name="history" size={24} color="#6B7280" />
              <View className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full items-center justify-center">
                <Text className="text-white text-xs font-bold">3</Text>
              </View>
            </View>
            <Text className="text-gray-600 text-xs mt-1 font-rubik-medium">History</Text>
          </TouchableOpacity>
        </Link>

        <Link href="./vol_pro" asChild>
          <TouchableOpacity
            className="items-center flex-1"
            activeOpacity={0.7}
          >
            <FontAwesome5 name="user-circle" size={24} color="#6B7280" />
            <Text className="text-gray-600 text-xs mt-1 font-rubik-medium">Profile</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}
