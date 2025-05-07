import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";

interface DonationItem {
  name: string;
  quantity: string;
}

interface Donation {
  id: string;
  created_at: string;
  status: "completed" | "pending" | "in_progress";
  items: DonationItem[];
  organization: string;
  image: any; // for require() type
  volunteer?: {
    name: string;
    phone: string;
    image: any;
  };
}

export default function DonationHistory() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('all');

  const donations: Donation[] = [
    {
      id: '1',
      created_at: '2024-04-26',
      status: 'completed',
      items: [
        { name: 'Rice', quantity: '10 kg' },
        { name: 'Dal', quantity: '5 kg' },
      ],
      organization: 'Food Bank Bangladesh',
      image: require('@/assets/images/ngo.jpg'),
      volunteer: {
        name: 'Abdul Karim',
        phone: '+880 1712345678',
        image: require('@/assets/images/hasi.jpg')
      }
    },
    {
      id: '2',
      created_at: '2024-04-25',
      status: 'in_progress',
      items: [
        { name: 'Bread', quantity: '20 pieces' },
        { name: 'Milk', quantity: '10 L' },
      ],
      organization: 'Shelter Home',
      image: require('@/assets/images/ngo.jpg'),
      volunteer: {
        name: 'Sarah Akter',
        phone: '+880 1812345678',
        image: require('@/assets/images/hasi.jpg')
      }
    },
    {
      id: '3',
      created_at: '2024-04-24',
      status: 'pending',
      items: [
        { name: 'Fruits', quantity: '5 kg' },
        { name: 'Vegetables', quantity: '8 kg' },
      ],
      organization: 'Child Care Center',
      image: require('@/assets/images/ngo.jpg')
    }
  ];

  const getStatusStyle = (status: Donation['status']) => {
    switch (status) {
      case 'completed':
        return {
          bg: 'bg-green-100',
          text: 'text-green-700',
          icon: 'check-circle'
        };
      case 'in_progress':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-700',
          icon: 'clock'
        };
      case 'pending':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-700',
          icon: 'hourglass-start'
        };
    }
  };

  const filteredDonations = activeFilter === 'all' 
    ? donations 
    : donations.filter(d => d.status === activeFilter);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header with Filters */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-xl font-rubik-bold text-gray-800">My Donations</Text>
          <TouchableOpacity 
            className="p-2 rounded-full bg-gray-100"
            onPress={() => router.back()}
          >
            <MaterialIcons name="keyboard-arrow-left" size={24} color="#4B5563" />
          </TouchableOpacity>
        </View>
        
        {/* Filter Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="flex-row space-x-2"
        >
          {['all', 'completed', 'in_progress', 'pending'].map((filter) => (
            <TouchableOpacity 
              key={filter} 
              onPress={() => setActiveFilter(filter)} 
              className={`px-4 py-2 rounded-full border ${
                activeFilter === filter 
                  ? 'bg-green-50 border-green-500' 
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <Text className={`font-rubik-medium capitalize ${
                activeFilter === filter ? 'text-green-700' : 'text-gray-600'
              }`}>
                {filter.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Donation List */}
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="space-y-4">
          {filteredDonations.map((donation) => (
            <TouchableOpacity 
              key={donation.id}
              className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100"
              onPress={() => router.push(`./donation-details/${donation.id}`)}
            >
              <View className="flex-row items-center mb-3">
                <Image 
                  source={donation.image}
                  className="w-16 h-16 rounded-xl"
                />
                <View className="flex-1 ml-3">
                  <Text className="font-rubik-bold text-gray-800">
                    {donation.organization}
                  </Text>
                  <Text className="text-xs font-rubik text-gray-500 mt-1">
                    {new Date(donation.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                </View>
                <View className={`px-3 py-1 rounded-full ${getStatusStyle(donation.status).bg}`}>
                  <View className="flex-row items-center space-x-1">
                    <FontAwesome5 
                      name={getStatusStyle(donation.status).icon} 
                      size={12} 
                      color={getStatusStyle(donation.status).text.replace('text-', '')} 
                      solid 
                    />
                    <Text className={`text-xs font-rubik-medium ${getStatusStyle(donation.status).text}`}>
                      {donation.status.replace('_', ' ').charAt(0).toUpperCase() + 
                       donation.status.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="border-t border-gray-100 pt-3">
                <Text className="font-rubik-medium text-gray-700 mb-2">
                  Donated Items:
                </Text>
                <View className="flex-row flex-wrap">
                  {donation.items.map((item, index) => (
                    <View key={index} className="flex-row items-center mr-4 mb-1">
                      <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                      <Text className="text-gray-600 font-rubik">
                        {item.quantity} {item.name}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {donation.volunteer && (
                <View className="border-t border-gray-100 mt-3 pt-3">
                  <Text className="font-rubik-medium text-gray-700 mb-2">
                    Volunteer Assigned:
                  </Text>
                  <View className="flex-row items-center">
                    <Image 
                      source={donation.volunteer.image}
                      className="w-8 h-8 rounded-full"
                    />
                    <Text className="ml-2 text-sm text-gray-600 font-rubik">
                      {donation.volunteer.name}
                    </Text>
                  </View>
                </View>
              )}

              <TouchableOpacity 
                className="flex-row items-center justify-end mt-3"
                onPress={() => router.push(`./donation-details/${donation.id}`)}
              >
                <Text className="text-green-600 font-rubik-medium mr-1">
                  View Details
                </Text>
                <MaterialIcons name="arrow-forward-ios" size={14} color="#16a34a" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View className="flex-row justify-between items-center bg-white py-3 px-6 border-t border-gray-200">
        <Link href="./desh" asChild>
          <TouchableOpacity className="items-center flex-1">
            <FontAwesome5 name="home" size={24} color="#6B7280" />
            <Text className="text-gray-600 text-xs mt-1 font-rubik-medium">Home</Text>
          </TouchableOpacity>
        </Link>

        <Link href="./news" asChild>
          <TouchableOpacity className="items-center flex-1">
            <FontAwesome5 name="newspaper" size={24} color="#6B7280" />
            <Text className="text-gray-600 text-xs mt-1 font-rubik-medium">News</Text>
          </TouchableOpacity>
        </Link>

        <Link href=".././Donate" asChild>
          <TouchableOpacity className="items-center flex-1">
            <View className="bg-orange-500 p-3 rounded-full -mt-8 border-4 border-white shadow-lg">
              <FontAwesome5 name="plus" size={24} color="white" />
            </View>
            <Text className="text-gray-600 text-xs mt-1 font-rubik-medium">Donate</Text>
          </TouchableOpacity>
        </Link>

        <Link href="./notifications" asChild>
          <TouchableOpacity className="items-center flex-1">
            <View className="relative">
              <Ionicons name="notifications-outline" size={24} color="#6B7280" />
              <View className="absolute -top-1 -right-1 bg-orange-500 w-4 h-4 rounded-full items-center justify-center">
                <Text className="text-white text-xs font-rubik-bold">2</Text>
              </View>
            </View>
            <Text className="text-gray-600 text-xs mt-1 font-rubik-medium">Alerts</Text>
          </TouchableOpacity>
        </Link>

        <Link href="./d_history" asChild>
          <TouchableOpacity className="items-center flex-1">
            <FontAwesome5 name="history" size={24} color="#F97316" />
            <Text className="text-orange-500 text-xs mt-1 font-rubik-medium">History</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}