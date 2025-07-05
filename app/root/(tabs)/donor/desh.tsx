import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ImageBackground ,
} from "react-native";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { Link } from "expo-router";
import { supabase } from "../../../../constants/supabaseConfig";
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';

const DonorDashboard = () => {
  interface Donor {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    profileImage?: string;
    
    address: string;
  }
  interface Receiver {
    id: string;
    name: string;
    type: string;
    registration: string;
    contact_person: string;
    email: string;
    phone: string;
    location: string;
    areas: string;
    capacity: string;
    image_url?: string;
  }
   const [news, setNews] = useState<any[]>([]);
   const [newsLoading, setNewsLoading] = useState(true);
  const [donor, setDonor] = useState<Donor[]>([]);
  const [receivers, setReceivers] = useState<Receiver[]>([]); // State for receivers
  const [loading, setLoading] = useState(true);
  const [loadingReceivers, setLoadingReceivers] = useState(true); // Loading state for receivers
  const [searchQuery, setSearchQuery] = useState("");
  const [topDonors, setTopDonors] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchDonor = async () => {
      try {
        const id=await AsyncStorage.getItem('userId');

        // Retrieve the email from AsyncStorage
        const email = await AsyncStorage.getItem('userEmail');
        if (!email) {
          Alert.alert('Error', 'No email found in storage. Please log in again.');
          setLoading(false);
          return;
        }

        // Query the donor data using the email
        const { data, error } = await supabase
          .from('users') // Replace 'users' with your actual table name
          .select('*')
          .eq('email', email)
          .single();

        if (error) {
          console.error(error);
          Alert.alert('Error', 'Failed to fetch donor data.');
        } else {
          setDonor([data]); // Wrap the single donor object in an array
        }
        await AsyncStorage.setItem('userId', data.id);
      } catch (error) {
        console.error('Error fetching donor data:', error);
        Alert.alert('Error', 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchDonor();
  }, []);


  useEffect(() => {
    const fetchReceivers = async () => {
      try {
        const { data, error } = await supabase.from("receiver").select("*");

        if (error) {
          console.error("Error fetching receivers:", error);
          Alert.alert("Error", "Failed to fetch featured organizations.");
        } else {
          setReceivers(data || []); // Set the fetched data
        }
      } catch (error) {
        console.error("Unexpected error:", error);
        Alert.alert("Error", "An unexpected error occurred.");
      } finally {
        setLoadingReceivers(false);
      }
    };

    fetchReceivers();
  }, []);

  useEffect(() => {
      // Fetch news/events
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
      // Fetch top donors by donation count
      const fetchTopDonors = async () => {
        // Get all users and their donation counts
        const { data: users, error: userError } = await supabase
          .from('users')
          .select('id, fullName, profileImage, address');
        if (userError || !users) return;
        // For each user, count their donations
        const donorCounts = await Promise.all(users.map(async (user: any) => {
          const { count } = await supabase
            .from('donation')
            .select('id', { count: 'exact', head: true })
            .eq('donor_id', user.id);
          return { ...user, donationCount: count || 0 };
        }));
        // Sort and take top 3
        const sorted = donorCounts.sort((a, b) => b.donationCount - a.donationCount).slice(0, 3);
        setTopDonors(sorted);
      };
      fetchTopDonors();
    }, []);

  // Filtered receivers for search
  const filteredReceivers = receivers.filter((receiver) =>
    receiver.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!donor.length) {
    return (
      <View style={styles.container}>
        <Text>No donor information found.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row justify-between items-center px-5 py-3 mb-3">
      <View className="flex-row items-center">
        <MaterialIcons name="location-on" size={20} color="#FF5722" />
        <Text className="font-rubik-medium text-sm text-gray-800 ml-1">{donor[0]?.address}</Text>
      </View>
      <TouchableOpacity onPress={() => router.push("./profile")}>
        <Image source={donor[0]?.profileImage ? { uri: donor[0].profileImage } : require("@/assets/images/avatar.png")} className="w-10 h-10 rounded-full border-2 border-orange-100" />
      </TouchableOpacity>
      </View>
      {/* Search Bar */}
      <View className="px-4 ">
        <View className="flex-row items-center bg-white rounded-xl px-4 py-2 border border-gray-100">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            placeholder="Search organizations"
            className="flex-1 ml-2 font-rubik text-gray-600"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        {/* Search Results Dropdown */}
        {searchQuery.length > 0 && (
          <ScrollView style={{ maxHeight: 200, backgroundColor: '#fff', borderRadius: 8, marginTop: 4, borderWidth: 1, borderColor: '#eee' }}>
            {filteredReceivers.length === 0 ? (
              <Text style={{ padding: 12, color: '#888' }}>No organizations found.</Text>
            ) : (
              filteredReceivers.map((receiver) => (
                <TouchableOpacity
                  key={receiver.id}
                  style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#f3f3f3' }}
                  onPress={() => router.push({ pathname: './receiver_profile', params: { id: receiver.id } })}
                >
                  <Text style={{ color: '#222', fontWeight: 'bold' }}>{receiver.name}</Text>
                  <Text style={{ color: '#888', fontSize: 12 }}>{receiver.type}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}
      </View>
      <ScrollView className="flex-1">
      {/* Donate Banner */}
      <View className="px-4 pt-4">
                <ImageBackground 
                  source={require('@/assets/images/back.jpg')}
                  className="rounded-2xl overflow-hidden"
                >
                  <View className="p-6 bg-black/40">
                    <Text className="font-rubik-bold text-xl text-white mb-1">
                      Welcome {donor[0]?.fullName}
                    </Text>
                    <Text className="text-white font-rubik text-sm mb-4">
                      Ready to make a difference? Share your excess food with those in need.
                    </Text>
                    <TouchableOpacity
                      onPress={() => router.push("./donate")}
                      className="bg-green-600 py-3 px-4 rounded-xl self-start flex-row items-center"
                    >
                      <Text className="text-white font-rubik-bold mr-2">Donate Now</Text>
                      <MaterialIcons name="arrow-forward" size={20} color="white" />
                    </TouchableOpacity>
                  </View>
                </ImageBackground>
              </View>
      {/* Top Donors */}
      <View className="mt-6">
        <View className="px-4 flex-row justify-between items-center mb-3">
          <Text className="font-rubik-bold text-lg text-gray-800">Top Donors</Text>
          <TouchableOpacity>
            <Text className="text-orange-500 font-rubik-medium">View All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mx-5 mt-3">
          {topDonors.map((donor, idx) => (
            <View key={donor.id} className="items-center mr-4 bg-white p-4 rounded-xl shadow border border-gray-100 w-40">
              <Image source={donor.profileImage ? { uri: donor.profileImage } : require("@/assets/images/avatar.png")} className="w-16 h-16 rounded-full mb-2" />
              <Text className="font-rubik-bold text-gray-800 text-center">{donor.fullName}</Text>
              <Text className="text-xs text-gray-500 text-center mb-1">{donor.address}</Text>
              <View className="flex-row items-center justify-center mt-1">
                <MaterialIcons name="star" size={18} color="#facc15" />
                <Text className="ml-1 text-green-700 font-bold">{donor.donationCount} Donations</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
       <View className="p-5 rounded-lg mb-5">
                      <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-2xl font-rubik-bold text-gray-800">Recent Events & Stories</Text>
                        <TouchableOpacity onPress={() => router.push("../All_News")}>
                          <Text className="text-green-600 font-rubik-medium">View All</Text>
                        </TouchableOpacity>
                      </View>
                      {newsLoading ? (
                          <Text className="text-gray-400 text-center">Loading...</Text>
                        ) : (
                        <ScrollView 
                          horizontal 
                          showsHorizontalScrollIndicator={false} 
                          className="mb-3"
                        >
                          {news.map((item, idx) => (
                            <View key={item.id || idx} className="bg-white p-4 rounded-2xl shadow-md mr-4 w-72 border border-gray-100">
                              <View className="absolute top-5 right-5 bg-black/50 px-3 py-1 rounded-full z-10">
                                <Text className="text-white font-rubik-medium text-xs">{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</Text>
                              </View>
                              <Image
                                source={{ uri: item.picture.startsWith('data:') ? item.picture : `data:image/jpeg;base64,${item.picture}` }}
                                className="w-full h-48 rounded-xl mb-3"
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
      {/* Featured Organizations */}
       <View className="px-4 mt-6 mb-24">
                  
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="font-rubik-bold text-lg text-gray-800">Featured Organizations</Text>
                  <TouchableOpacity>
                    <Text className="text-orange-500 font-rubik-medium">See All</Text>
                  </TouchableOpacity>
                </View>
      
                <View className="space-y-4">
            {receivers.map((receiver) => (
              <TouchableOpacity
                key={receiver.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                onPress={() => router.push({ pathname: './receiver_profile', params: { id: receiver.id } })}
              >
                <View className="flex-row items-center mb-3">
                  <Image
                    source={
                      receiver.image_url
                        ? { uri: receiver.image_url }
                        : require("@/assets/images/avatar.png")
                    }
                    className="w-12 h-12 rounded-xl mr-3"
                  />
                  <View className="flex-1">
                    <Text className="font-rubik-bold text-gray-800">{receiver.name}</Text>
                    <Text className="text-xs font-rubik text-gray-500">
                      {receiver.type || "Non-profit organization"}
                    </Text>
                  </View></View>
                <Text className="text-sm font-rubik text-gray-600 mb-3">
                  {receiver.areas || "No description available."}
                </Text>
                <TouchableOpacity className="flex-row items-center">
                  <Text className="text-orange-500 font-rubik-medium mr-1">Donate</Text>
                  <MaterialIcons name="arrow-forward" size={16} color="#F97316" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
              </View>
      </ScrollView>
      

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 10,
  },
  searchBar: {
    flexDirection: "row",
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    padding: 8,
    margin: 10,
    alignItems: "center",
  },
  searchInput: {
    marginLeft: 10,
    flex: 1,
    fontSize: 16,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 15,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  cardInfo: {
    flex: 1,
  },
  donorName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  donorDetail: {
    fontSize: 14,
    color: "#555",
  },
  viewButton: {
    backgroundColor: "#FF5722",
    padding: 8,
    borderRadius: 6,
  },
  viewText: {
    color: "white",
    fontWeight: "bold",
  },
  logoutButton: {
    backgroundColor: "#FF5722",
    padding: 12,
    borderRadius: 6,
    marginTop: 20,
    alignItems: "center",
  },
  logoutText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default DonorDashboard;