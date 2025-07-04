import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { supabase } from '../../../../constants/supabaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ReceiverBottomNavigation() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      const ngo_id = await AsyncStorage.getItem("ngo_id");
      if (!ngo_id) return;
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .in('for', ['receiver', 'all'])
        .eq('ngo_id', ngo_id)
        .eq('isread', false);
      if (!error && typeof count === 'number') setUnreadCount(count);
    };
    fetchUnreadCount();
  }, []);

  return (
    <View className="flex-row justify-between items-center bg-white py-3 px-6 border-t border-gray-200">
      <Link href="./dashboard" asChild>
        <TouchableOpacity className="items-center flex-1">
          <FontAwesome name="home" size={24} color="#F97316" />
          <Text className="text-orange-500 text-xs mt-1 font-rubik-medium">Home</Text>
        </TouchableOpacity>
      </Link>

      <Link href="./profile" asChild>
        <TouchableOpacity className="items-center flex-1">
          <FontAwesome name="user" size={24} color="#6B7280" />
          <Text className="text-gray-600 text-xs mt-1 font-rubik-medium">Profile</Text>
        </TouchableOpacity>
      </Link>

      <Link href="./request" asChild>
        <TouchableOpacity className="items-center flex-1">
          <View className="bg-orange-500 p-3 rounded-full -mt-8 border-4 border-white shadow-lg">
            <FontAwesome name="plus" size={24} color="white" />
          </View>
          <Text className="text-gray-600 text-xs mt-1 font-rubik-medium">Request</Text>
        </TouchableOpacity>
      </Link>

      <Link href="./past_donat" asChild>
        <TouchableOpacity className="items-center flex-1">
          <FontAwesome name="history" size={24} color="#6B7280" />
          <Text className="text-gray-600 text-xs mt-1 font-rubik-medium">History</Text>
        </TouchableOpacity>
      </Link>

      <Link href="./All_News" asChild>
        <TouchableOpacity className="items-center flex-1">
          <MaterialIcons name="feed" size={24} color="#6B7280" />
          <Text className="text-gray-600 text-xs mt-1 font-rubik-medium">News</Text>
        </TouchableOpacity>
      </Link>

      <Link href="./notification" asChild>
        <TouchableOpacity className="items-center flex-1">
          <View className="relative">
            <Ionicons name="notifications-outline" size={24} color="#6B7280" />
            {unreadCount > 0 && (
              <View className="absolute -top-1 -right-2 w-5 h-5 bg-red-500 rounded-full items-center justify-center">
                <Text className="text-white text-xs font-bold">{unreadCount}</Text>
              </View>
            )}
          </View>
          <Text className="text-gray-600 text-xs mt-1 font-rubik-medium">Notifications</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
} 