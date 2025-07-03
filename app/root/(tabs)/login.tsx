import React, { useState } from "react";
import { View, Text, TextInput, ImageBackground, TouchableOpacity, Alert } from "react-native";
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
        <View className="w-full bg-white/40 rounded-lg mb-4">
          <Picker
            selectedValue={role}
            onValueChange={(itemValue) => setRole(itemValue)}
            style={{ color: "white" }}
          >
            <Picker.Item label="Donor" value="Donor" />
            <Picker.Item label="Receiver" value="Receiver" />
            <Picker.Item label="Volunteer" value="Volunteer" />
            
          </Picker>
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