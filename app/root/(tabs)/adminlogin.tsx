import React, { useState } from "react";
import { View, Text, TextInput, ImageBackground, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../../constants/supabaseConfig";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from '@react-native-async-storage/async-storage';


export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<string>("Donor"); // Default role

  const handleLogin = async () => {
    try {
      // Determine the table based on the selected role
     
  
      // Debugging: Log the table name and input values
     
      console.log("Email:", email);
      console.log("Password:", password);
  
      // Query the corresponding table to verify the user exists and credentials match
      const { data: userData, error: userError } = await supabase
        .from('admin')
        .select("*")
        .eq("email", email)
        .eq("password", password) // Match both email and password
        .single();
  
      // Debugging: Log the query result
      console.log("Query result:", userData, userError);
  
      if (userError || !userData) {
        throw new Error("Invalid login credentials");
      }
      await AsyncStorage.setItem("userEmail", email);
  
      // Navigate based on role
      
        router.push("../admin/dashboard");
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      console.error("Login error:", errorMessage);
      Alert.alert("Error", errorMessage);
    }
  };
  return (
    <ImageBackground source={require("@/assets/images/pexels-cottonbro-6590933.jpg")} className="flex-1 justify-center">
      {/* bg-black/50 */}
      <View className="absolute inset-0 bg-black/30" /> 
      <View className="flex-1 justify-center items-center px-8">
        <Text className="text-white text-3xl font-rubik-extrabold mb-6">Login</Text>

        <TextInput
          className="w-full bg-white/40 font-rubik-medium text-black text-lg px-4 py-3 rounded-lg mb-4"
          placeholder="Email"
          placeholderTextColor="#ffffff"
          value={email}
          onChangeText={setEmail}
        />
        <View className="w-full bg-white/40 px-2 py-1 rounded-lg flex-row items-center mb-4">
          <TextInput
          className="flex-1 text-white font-rubik-medium text-lg"
          placeholder="Password"
          placeholderTextColor="#ffffff"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <MaterialCommunityIcons name={showPassword ? "eye" : "eye-off"} size={24} color="white" />
          </TouchableOpacity>
        </View>
       

        <TouchableOpacity className="w-full bg-green-600 py-4 rounded-lg mt-2 shadow-md" onPress={handleLogin}>
          <Text className="text-white text-lg font-rubik-semibols text-center">Login</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("./forgot-password")}>
          <Text className="text-green-600 mt-4 font-rubik-medium text-lg">Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("./signup")}>
          <Text className="text-white mt-6 text-lg">
            Don't have an account? <Text className="text-green-600  font-rubik-medium">Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}