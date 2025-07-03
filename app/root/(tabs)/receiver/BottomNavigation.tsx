import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Link, usePathname } from "expo-router";
import { FontAwesome, Ionicons } from "@expo/vector-icons";

interface BottomNavigationProps {
  currentPage: string;
}

export default function BottomNavigation({ currentPage }: BottomNavigationProps) {
  const getIconColor = (page: string) => {
    return currentPage === page ? "#F97316" : "#6B7280";
  };

  const getTextColor = (page: string) => {
    return currentPage === page ? "text-orange-500" : "text-gray-600";
  };

  return (
    <View className="flex-row justify-between items-center bg-white py-3 px-6 border-t border-gray-200">
      <Link href="./dashboard" asChild>
        <TouchableOpacity className="items-center flex-1">
          <FontAwesome name="home" size={24} color={getIconColor("dashboard")} />
          <Text className={`text-xs mt-1 font-rubik-medium ${getTextColor("dashboard")}`}>Home</Text>
        </TouchableOpacity>
      </Link>

      <Link href="./profile" asChild>
        <TouchableOpacity className="items-center flex-1">
          <FontAwesome name="user" size={24} color={getIconColor("profile")} />
          <Text className={`text-xs mt-1 font-rubik-medium ${getTextColor("profile")}`}>Profile</Text>
        </TouchableOpacity>
      </Link>

      <Link href="./request" asChild>
        <TouchableOpacity className="items-center flex-1">
          <View className="bg-orange-500 p-3 rounded-full -mt-8 border-4 border-white shadow-lg">
            <FontAwesome name="plus" size={24} color="white" />
          </View>
          <Text className={`text-xs mt-1 font-rubik-medium ${getTextColor("request")}`}>Request</Text>
        </TouchableOpacity>
      </Link>

      <Link href="./past_donat" asChild>
        <TouchableOpacity className="items-center flex-1">
          <FontAwesome name="history" size={24} color={getIconColor("past_donat")} />
          <Text className={`text-xs mt-1 font-rubik-medium ${getTextColor("past_donat")}`}>History</Text>
        </TouchableOpacity>
      </Link>

      <Link href="./settings" asChild>
        <TouchableOpacity className="items-center flex-1">
          <Ionicons name="settings-outline" size={24} color={getIconColor("settings")} />
          <Text className={`text-xs mt-1 font-rubik-medium ${getTextColor("settings")}`}>Settings</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
} 