import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';

interface HistoryItem {
  id: string;
  title: string;
  donorName: string;
  location: string;
  date: string;
  time: string;
  meals: number;
  status: 'completed' | 'cancelled';
  imageUrl?: string;
}

const DEMO_HISTORY: HistoryItem[] = [
  {
    id: '1',
    title: 'Food Pickup from Restaurant ABC',
    donorName: 'Restaurant ABC',
    location: '123 Main Street, City',
    date: '2024-05-01',
    time: '2:00 PM',
    meals: 25,
    status: 'completed',
    imageUrl: 'https://picsum.photos/200'
  },
  {
    id: '2',
    title: 'Bakery Donation Collection',
    donorName: 'Fresh Bakery',
    location: '456 Baker Street',
    date: '2024-04-28',
    time: '3:30 PM',
    meals: 15,
    status: 'completed',
    imageUrl: 'https://picsum.photos/201'
  },
  {
    id: '3',
    title: 'Restaurant XYZ Surplus',
    donorName: 'Restaurant XYZ',
    location: '789 Food Court',
    date: '2024-04-25',
    time: '5:00 PM',
    meals: 30,
    status: 'cancelled',
    imageUrl: 'https://picsum.photos/202'
  }
];

export default function MyTasksScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');

  const filteredHistory = DEMO_HISTORY.filter(item => 
    filter === 'all' ? true : item.status === filter
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white pt-12 pb-4 px-6 shadow-sm">
        <Text className="text-2xl font-rubik-bold text-gray-900">Donation History</Text>
      </View>

      {/* Filters */}
      <View className="flex-row px-6 py-4 bg-white border-b border-gray-200">
        {(['all', 'completed', 'cancelled'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            onPress={() => setFilter(type)}
            className={`flex-1 items-center py-2 border-b-2 ${
              filter === type ? 'border-orange-500' : 'border-transparent'
            }`}
          >
            <Text className={`${
              filter === type ? 'text-orange-500 font-rubik-medium' : 'text-gray-600'
            } capitalize`}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* History List */}
      <ScrollView className="flex-1">
        <View className="p-6">
          {filteredHistory.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => router.push({
                pathname: '/root/(tabs)/volunteer/history_details',
                params: { id: item.id }
              })}
              className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden border border-gray-100"
            >
              <View className="flex-row">
                {item.imageUrl && (
                  <Image
                    source={{ uri: item.imageUrl }}
                    className="w-24 h-24"
                    resizeMode="cover"
                  />
                )}
                <View className="flex-1 p-4">
                  <View className="flex-row justify-between items-start">
                    <Text className="text-gray-900 font-rubik-bold mb-1 flex-1 mr-2">
                      {item.title}
                    </Text>
                    <View className={`bg-${item.status === 'completed' ? 'green' : 'red'}-100 px-2 py-1 rounded-full`}>
                      <Text className={`text-${item.status === 'completed' ? 'green' : 'red'}-600 text-xs font-rubik-medium capitalize`}>
                        {item.status}
                      </Text>
                    </View>
                  </View>
                  
                  <View className="flex-row items-center mb-2">
                    <MaterialIcons name="business" size={16} color="#6B7280" />
                    <Text className="text-gray-600 text-sm ml-1">{item.donorName}</Text>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <MaterialIcons name="restaurant" size={16} color="#16A34A" />
                      <Text className="text-green-600 text-sm ml-1">{item.meals} meals</Text>
                    </View>
                    <Text className="text-gray-500 text-sm">{item.date}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {filteredHistory.length === 0 && (
            <View className="items-center justify-center py-12">
              <MaterialIcons name="history" size={48} color="#9CA3AF" />
              <Text className="text-gray-500 mt-4">No {filter} donations found</Text>
            </View>
          )}
        </View>
      </ScrollView>

      // ...existing code...

{/* Bottom Navigation */}
<View className="flex-row justify-between items-center bg-white py-3 px-6 border-t border-gray-200 shadow-lg">
  <Link href="./voldesh" asChild>
    <TouchableOpacity className="items-center flex-1">
      <View className="relative">
        <FontAwesome5 name="home" size={24} color="#6B7280" />
      </View>
      <Text className="text-gray-600 text-xs mt-1 font-rubik-medium">Home</Text>
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

  <Link href="./available-tasks" asChild>
    <TouchableOpacity className="items-center flex-1">
      <View className="bg-orange-500 p-3 rounded-full -mt-8 border-4 border-white shadow-xl">
        <FontAwesome5 name="plus" size={24} color="white" />
      </View>
      <Text className="text-gray-600 text-xs mt-1 font-rubik-medium">Tasks</Text>
    </TouchableOpacity>
  </Link>

  <Link href="./my-tasks" asChild>
    <TouchableOpacity
      className="items-center flex-1"
      style={{ transform: [{ scale: 1 }] }}
    >
      <View className="relative">
        <FontAwesome5 name="history" size={24} color="#F97316" />
        <View className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full items-center justify-center">
          <Text className="text-white text-xs font-bold">3</Text>
        </View>
      </View>
      <Text className="text-orange-500 text-xs mt-1 font-rubik-medium">History</Text>
    </TouchableOpacity>
  </Link>

  <Link href="./not" asChild>
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