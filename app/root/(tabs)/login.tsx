import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, Image } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../../constants/supabaseConfig";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { BackHandler } from 'react-native';


export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<string>("Donor"); // Default role
  
  // Prevent hardware back button from navigating back to protected screens
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => true; // Prevent default behavior
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [])
  );

  const handleLogin = async () => {
    try {
      // 1. Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError || !authData.session) {
        throw new Error('Invalid login credentials (Auth)');
      }
      // 2. Use the selected role to check the corresponding table for the email only
      let tableName = '';
      if (role === 'Donor') {
        tableName = 'users';
      } else if (role === 'Receiver') {
        tableName = 'receiver';
      } else if (role === 'Volunteer') {
        tableName = 'volunteer';
      }
      const { data: userData, error: userError } = await supabase
        .from(tableName)
        .select('*')
        .eq('email', email)
        .single();
      if (userError || !userData) {
        await supabase.auth.signOut();
        throw new Error('No profile found for this role.');
      }
      await AsyncStorage.setItem('userEmail', email);
      const userId = userData.id;
      await AsyncStorage.setItem('userId', userId.toString());
      // Navigate based on role
      if (role === 'Donor') {
        router.push('../donor/desh');
      } else if (role === 'Receiver') {
        router.push('../receiver/dashboard');
      } else if (role === 'Volunteer') {
        router.push('../volunteer/voldesh');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Login error:', errorMessage);
      Alert.alert('Error', errorMessage);
    }
  };
  return (
    <View className="flex-1 bg-gray-100">
      {/* Header with Logo+Name (left) and Home Icon (right) - absolutely positioned */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }} className="flex-row items-center justify-between px-6 pt-12 pb-4 w-full bg-gray-100">
        <View className="flex-row items-center">
          <Image
            source={require("../../../assets/images/images.jpeg")}
            style={{ width: 56, height: 56, borderRadius: 14, marginRight: 14 }}
            resizeMode="contain"
          />
          <Text className="text-3xl font-rubik-extrabold text-green-700">ShareBite</Text>
        </View>
        <TouchableOpacity
          className="bg-white p-2 rounded-full shadow"
          onPress={() => router.push("/")}
          style={{ elevation: 4 }}
        >
          <MaterialCommunityIcons name="home" size={28} color="#16a34a" />
        </TouchableOpacity>
      </View>
      {/* Login Card - add top padding to sit below header */}
      <View className="items-center px-4" style={{ paddingTop: 140 }}>
        <View className="w-full max-w-md bg-white rounded-2xl shadow-lg px-8 py-10 items-center">
          <Text className="text-3xl font-rubik-extrabold mb-8 text-green-700">Login</Text>

          <TextInput
            className="w-full bg-gray-100 font-rubik-medium text-black text-lg px-4 py-3 rounded-lg mb-4 border border-gray-200"
            placeholder="Email"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <View className="w-full bg-gray-100 px-2 py-1 rounded-lg flex-row items-center mb-4 border border-gray-200">
            <TextInput
              className="flex-1 text-black font-rubik-medium text-lg"
              placeholder="Password"
              placeholderTextColor="#888"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <MaterialCommunityIcons name={showPassword ? "eye" : "eye-off"} size={24} color="#888" />
            </TouchableOpacity>
          </View>
          <View className="w-full bg-gray-100 rounded-lg mb-4 border border-gray-200">
            <Picker
              selectedValue={role}
              onValueChange={(itemValue) => setRole(itemValue)}
              style={{ color: "#333" }}
            >
              <Picker.Item label="Donor" value="Donor" />
              <Picker.Item label="Receiver" value="Receiver" />
              <Picker.Item label="Volunteer" value="Volunteer" />
            </Picker>
          </View>

          <TouchableOpacity className="w-full bg-green-600 py-4 rounded-lg mt-2 shadow-md" onPress={handleLogin}>
            <Text className="text-white text-lg font-rubik-semibold text-center">Login</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("./forgot-password")}
            className="w-full mt-4">
            <Text className="text-green-600 font-rubik-medium text-lg text-center">Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("../RoleSelection")}
            className="w-full mt-6">
            <Text className="text-gray-700 text-lg text-center">
              Don't have an account? <Text className="text-green-600 font-rubik-medium">Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}