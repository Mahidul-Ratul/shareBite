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

// News/Event type for recent stories
interface NewsItem {
  id: string;
  title: string;
  news: string;
  tag: string;
  created_at: string;
  picture: string;
  Location?: string;
}

// Donation type for recent activity
interface DonationActivity {
  id: string;
  Details: string;
  date: string;
  meals: string;
  Location: string;
  Image?: string;
  status: string;
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
    deliveries: 0,
    communities: 0,
    points: 0,
    hours: 0,
  });

  // News state for recent events & stories
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);

  const [recentDonations, setRecentDonations] = useState<DonationActivity[]>([]);
  const [donationsLoading, setDonationsLoading] = useState(true);

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
          .select('id, name, image_url, associated_communities, point')
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

        // Fetch deliveries (count of donations for this volunteer)
        const { count: deliveriesCount, error: deliveriesError } = await supabase
          .from('donation')
          .select('id', { count: 'exact', head: true })
          .eq('volunteer_id', data.id);
        if (deliveriesError) throw deliveriesError;

        // Communities: length of associated_communities array
        let communitiesCount = 0;
        if (data.associated_communities) {
          try {
            const arr = typeof data.associated_communities === 'string' ? JSON.parse(data.associated_communities) : data.associated_communities;
            communitiesCount = Array.isArray(arr) ? arr.length : 0;
          } catch {
            communitiesCount = 0;
          }
        }

        // Point
        const points = data.point || 0;

        // Hours = deliveries * 2
        const hours = (deliveriesCount || 0) * 2;

        setVolunteerStats({
          deliveries: deliveriesCount || 0,
          communities: communitiesCount,
          points,
          hours,
        });
      } catch (error) {
        Alert.alert('Error', (error as Error).message);
      }
    };

    fetchVolunteerData();
  }, []);

  useEffect(() => {
    // Fetch recent news/events
    const fetchNews = async () => {
      setNewsLoading(true);
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);
      if (!error && data) setNews(data);
      setNewsLoading(false);
    };
    fetchNews();
  }, []);

  useEffect(() => {
    // Fetch recent donations assisted by this volunteer
    const fetchRecentDonations = async () => {
      setDonationsLoading(true);
      try {
        const email = await AsyncStorage.getItem('userEmail');
        if (!email) return;
        // Get volunteer id
        const { data: volunteerData, error: volunteerError } = await supabase
          .from('volunteer')
          .select('id')
          .eq('email', email)
          .maybeSingle();
        if (volunteerError || !volunteerData) return;
        const volunteerId = volunteerData.id;
        // Debug log
        console.log('Volunteer ID used for donation query:', volunteerId);
        // Fetch all donations where this volunteer assisted
        const { data: donations, error: donationsError } = await supabase
          .from('donation')
          .select('id, Details, Quantity, Location, Image, status')
          .eq('volunteer_id', volunteerId)
          .order('id', { ascending: false })
          .limit(5);
        
        if (!donationsError && donations) {
          setRecentDonations(
            donations.map((d: any) => {
              // Handle image data - it might be a stringified array or a single string
              let imageData = undefined;
              if (d.Image) {
                try {
                  // Try to parse as JSON array first
                  const imageArray = JSON.parse(d.Image);
                  if (Array.isArray(imageArray) && imageArray.length > 0) {
                    imageData = imageArray[0]; // Take the first image
                  } else {
                    imageData = d.Image; // Use as single string
                  }
                } catch (e) {
                  // If parsing fails, use as single string
                  imageData = d.Image;
                }
              }
              
              return {
                id: d.id,
                Details: d.Details || 'Donation',
                date: '-',
                meals: d.Quantity || '-',
                Location: d.Location || '-',
                Image: imageData,
                status: d.status || '',
              };
            })
          );
        }
      } catch (err) {
        // ignore
      }
      setDonationsLoading(false);
    };
    fetchRecentDonations();
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
              <Text className="text-white text-xl font-rubik-bold mt-1">{volunteerStats.deliveries}</Text>
            </View>
            <View className="flex-1 bg-white/10 rounded-xl p-3 mx-2">
              <Text className="text-white/80 text-sm">Communities</Text>
              <Text className="text-white text-xl font-rubik-bold mt-1">{volunteerStats.communities}</Text>
            </View>
            <View className="flex-1 bg-white/10 rounded-xl p-3 ml-2">
              <Text className="text-white/80 text-sm">Point</Text>
              <View className="flex-row items-center mt-1">
                <Text className="text-white text-xl font-rubik-bold">{volunteerStats.points}</Text>
                <MaterialIcons name="stars" size={16} color="#FCD34D" className="ml-1" />
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
                  <MaterialIcons name="volunteer-activism" size={20} color="#F97316" />
                  <Text className="text-gray-600 ml-2">Deliveries</Text>
                </View>
                <Text className="text-xl font-rubik-bold text-gray-800 mt-1">
                  {volunteerStats.deliveries}
                </Text>
              </View>
              <View className="w-[48%] mb-4">
                <View className="flex-row items-center">
                  <MaterialIcons name="schedule" size={20} color="#16A34A" />
                  <Text className="text-gray-600 ml-2">Hours</Text>
                </View>
                <Text className="text-xl font-rubik-bold text-gray-800 mt-1">
                  {volunteerStats.hours}
                </Text>
              </View>
              <View className="w-[48%]">
                <View className="flex-row items-center">
                  <MaterialIcons name="stars" size={20} color="#9333EA" />
                  <Text className="text-gray-600 ml-2">Point</Text>
                </View>
                <Text className="text-xl font-rubik-bold text-gray-800 mt-1">
                  {volunteerStats.points}
                </Text>
              </View>
            </View>
          </View>

          {/* Recent Events & Stories Section */}
          <View className="bg-white rounded-xl shadow-lg shadow-gray-200 border border-gray-100 p-4 mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-rubik-bold text-gray-800">Recent Events & Stories</Text>
              <TouchableOpacity onPress={() => router.push('../All_News')}>
                <Text className="text-orange-500 font-rubik-medium">View All</Text>
              </TouchableOpacity>
            </View>
            {newsLoading ? (
              <Text className="text-gray-400 text-center">Loading...</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
                {news.map((item, idx) => (
                  <View key={item.id || idx} className="bg-white p-4 rounded-2xl shadow-md mr-4 w-72 border border-gray-100">
                    <View className="absolute top-5 right-5 bg-black/50 px-3 py-1 rounded-full z-10">
                      <Text className="text-white font-rubik-medium text-xs">{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</Text>
                    </View>
                    <Image
                      source={item.picture.startsWith('data:') ? { uri: item.picture } : { uri: `data:image/jpeg;base64,${item.picture}` }}
                      className="w-full h-40 rounded-xl mb-3"
                      resizeMode="cover"
                    />
                    <View className="flex-row justify-between items-center mb-2">
                      <View className={`px-3 py-1 rounded-full ${item.tag === 'Featured' ? 'bg-blue-50' : item.tag === 'Holiday Special' ? 'bg-orange-50' : 'bg-green-50'}`}> 
                        <Text className={`font-rubik-medium text-sm ${item.tag === 'Featured' ? 'text-blue-600' : item.tag === 'Holiday Special' ? 'text-orange-600' : 'text-green-600'}`}>{item.tag || 'Latest Update'}</Text>
                      </View>
                      <View className="flex-row items-center">
                        <MaterialIcons name="restaurant" size={16} color="#16a34a" />
                        <Text className="text-green-600 font-rubik text-sm ml-1">{item.title}</Text>
                      </View>
                    </View>
                    <Text className="text-lg font-rubik-medium text-gray-800 mb-2">
                      {item.title}
                    </Text>
                    <Text className="text-gray-600 font-rubik text-sm mb-3">
                      {item.news}
                    </Text>
                    <View className="flex-row justify-between items-center">
                      <View className="flex-row items-center">
                        <MaterialIcons name="schedule" size={16} color="#6B7280" />
                        <Text className="text-gray-500 font-rubik text-sm ml-1">{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</Text>
                      </View>
                      <View className="flex-row items-center">
                        <MaterialIcons name="location-on" size={16} color="#6B7280" />
                        <Text className="text-gray-500 font-rubik text-sm ml-1">{item.Location || 'N/A'}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Recent Activity */}
          <Text className="text-xl font-rubik-bold text-gray-800 mb-4">Recent Activity</Text>
          {donationsLoading ? (
            <Text className="text-gray-400 mb-6">Loading...</Text>
          ) : recentDonations.length === 0 ? (
            <Text className="text-gray-400 mb-6">No recent donations found.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
              {recentDonations.map((donation) => {
                // Color badge based on status
                let badgeColor = 'bg-gray-100';
                let textColor = 'text-gray-600';
                if (donation.status === 'delivered the food') {
                  badgeColor = 'bg-green-100';
                  textColor = 'text-green-700';
                } else if (donation.status === 'on the way to deliver food' || donation.status === 'on the way to receive food') {
                  badgeColor = 'bg-blue-100';
                  textColor = 'text-blue-700';
                }
                return (
                  <View
                    key={donation.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 mr-4 w-72"
                  >
                    <Image
                      source={
                        donation.Image 
                          ? donation.Image.startsWith('data:') 
                            ? { uri: donation.Image }
                            : { uri: `data:image/jpeg;base64,${donation.Image}` }
                          : require('@/assets/images/food.jpg')
                      }
                      className="w-full h-40 rounded-t-xl"
                      resizeMode="cover"
                    />
                    <View className="p-4">
                      <View className="flex-row justify-between items-center mb-2">
                        <View className={`${badgeColor} px-3 py-1 rounded-full`}>
                          <Text className={`${textColor} text-xs font-rubik-medium capitalize`}>
                            {donation.status || 'Status unknown'}
                          </Text>
                        </View>
                        <Text className="text-gray-500 text-xs">{donation.date}</Text>
                      </View>
                      <Text className="text-lg font-rubik-bold text-gray-800 mb-1">
                        {donation.Details}
                      </Text>
                      <View className="flex-row items-center mb-2">
                        <MaterialIcons name="restaurant" size={16} color="#16A34A" />
                        <Text className="text-green-600 text-sm ml-1">{donation.meals} meals</Text>
                      </View>
                      <View className="flex-row items-center">
                        <MaterialIcons name="location-on" size={16} color="#6B7280" />
                        <Text className="text-gray-600 text-sm ml-1">{donation.Location}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}

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
        </View>
      </ScrollView>
    </View>
  );
}
