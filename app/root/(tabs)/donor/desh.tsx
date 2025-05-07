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

  const [donor, setDonor] = useState<Donor[]>([]);
  const [receivers, setReceivers] = useState<Receiver[]>([]); // State for receivers
  const [loading, setLoading] = useState(true);
  const [loadingReceivers, setLoadingReceivers] = useState(true); // Loading state for receivers
  const [searchQuery, setSearchQuery] = useState("");
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
        {donor.map((donor) => (
        <TouchableOpacity
          key={donor.id}
          onPress={() => router.push(`./donor/${donor.id}`)}
          className="items-center mr-4"
        >
          <Image source={donor.profileImage ? { uri: donor.profileImage } : require("@/assets/images/avatar.png")} className="w-12 h-12 rounded-full" />
          <Text className="text-sm text-gray-700 font-rubik-light mt-1">{donor.fullName}</Text>
        </TouchableOpacity>
        ))}
      </ScrollView>
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
      
      {/* Bottom Navigation */}
      <View className="flex-row justify-between items-center bg-white py-3 px-6 border-t border-gray-200">
  <Link href="./desh" asChild>
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

  

  <Link href="./donate" asChild>
    <TouchableOpacity className="items-center flex-1">
      <View className="bg-orange-500 p-3 rounded-full -mt-8 border-4 border-white shadow-lg">
        <FontAwesome5 name="plus" size={24} color="white" />
      </View>
      <Text className="text-gray-600 text-xs mt-1 font-rubik-medium">Donate</Text>
    </TouchableOpacity>
  </Link>

  <Link href="./d_history" asChild>
    <TouchableOpacity className="items-center flex-1">
      <FontAwesome5 name="history" size={24} color="#6B7280" />
      <Text className="text-gray-600 text-xs mt-1 font-rubik-medium">History</Text>
    </TouchableOpacity>
  </Link>
  <Link href="./notification" asChild>
    <TouchableOpacity className="items-center flex-1">
      <View className="relative">
        <Ionicons name="notifications-outline" size={24} color="#6B7280" />
        <View className="absolute -top-1 -right-1 bg-orange-500 w-4 h-4 rounded-full items-center justify-center">
          <Text className="text-white text-xs font-rubik-bold">2</Text>
        </View>
      </View>
      <Text className="text-gray-600 text-xs mt-1 font-rubik-medium">Notifications</Text>
    </TouchableOpacity>
  </Link>
  
</View>
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