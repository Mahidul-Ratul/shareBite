import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const BottomNavigation = () => {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-around",
        backgroundColor: "#fff",
        paddingVertical: 10,
        borderTopWidth: 1,
        borderColor: "#ddd",
      }}
    >
      <TouchableOpacity style={{ alignItems: "center" }}>
        <Ionicons name="home-outline" size={24} color="#FF5722" />
        <Text>Home</Text>
      </TouchableOpacity>
      <TouchableOpacity style={{ alignItems: "center" }}>
        <Ionicons name="heart-outline" size={24} color="#888" />
        <Text>Donations</Text>
      </TouchableOpacity>
      <TouchableOpacity style={{ alignItems: "center" }}>
        <Ionicons name="notifications-outline" size={24} color="#888" />
        <Text>Notifications</Text>
      </TouchableOpacity>
    </View>
  );
};

export default BottomNavigation;
