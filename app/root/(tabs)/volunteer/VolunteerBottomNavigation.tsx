import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';

const VolunteerBottomNavigation = () => {
  const router = useRouter();
  return (
    <View className="flex-row justify-between items-center bg-white py-3 px-6 border-t border-gray-200 shadow-lg">
      <Link href="./voldesh" asChild>
        <TouchableOpacity className="items-center flex-1">
          <View className="relative">
            <FontAwesome5 name="home" size={24} color="#F97316" />
            <View className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" />
          </View>
          <Text className="text-orange-500 text-xs mt-1 font-rubik-medium">Home</Text>
        </TouchableOpacity>
      </Link>
      <Link href="./All_News" asChild>
        <TouchableOpacity className="items-center flex-1" activeOpacity={0.7}>
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
        <TouchableOpacity className="items-center flex-1" activeOpacity={0.7}>
          <View className="relative">
            <FontAwesome5 name="history" size={24} color="#6B7280" />
          </View>
          <Text className="text-gray-600 text-xs mt-1 font-rubik-medium">History</Text>
        </TouchableOpacity>
      </Link>
      <Link href="./vol_pro" asChild>
        <TouchableOpacity className="items-center flex-1" activeOpacity={0.7}>
          <FontAwesome5 name="user-circle" size={24} color="#6B7280" />
          <Text className="text-gray-600 text-xs mt-1 font-rubik-medium">Profile</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
};

export default VolunteerBottomNavigation; 