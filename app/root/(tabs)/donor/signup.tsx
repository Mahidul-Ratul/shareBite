import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../../../constants/supabaseConfig";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { Picker } from "@react-native-picker/picker";
import logo from "@/assets/images/icon.png";

interface UserData {
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  location: string;
  password: string;
  profileImage: string | null;
  type: string;
}

export default function SignUpScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userType, setUserType] = useState("Individual");

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Sorry, we need camera roll permissions to make this work!");
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      setImage(imageUri);
      try {
        const base64Image = await fetch(imageUri)
          .then((response) => response.blob())
          .then((blob) => new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          }));
        setImage(base64Image);
      } catch (error) {
        console.log("Error converting image to base64:", error);
      }
    }
  };

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match!");
      return;
    }
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw authError;
      let imageUrl = null;
      if (image) imageUrl = image;
      const userData: UserData = { fullName, email, phoneNumber, address, location, password, profileImage: imageUrl || "", type: userType };
      const { error: insertError } = await supabase.from("users").insert([userData]);
      if (insertError) throw insertError;
      Alert.alert("Success", "Sign-up successful! Please log in.");
      router.push("../login");
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "An unknown error occurred");
    }
  };

  return (
    <ScrollView className="p-2 bg-white">
      <View style={{ width: '100%', maxWidth: 400, backgroundColor: 'white', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, marginVertical: 32, alignSelf: 'center' }}>
        
        <Text className="font-rubik-bold text-3xl mb-6 text-center" style={{ color: '#1e293b' }}>Sign Up</Text>
        <TextInput
          className="h-12 border border-green-600 font-rubik rounded-lg mb-4 px-4 bg-white"
          placeholder="Full Name"
          placeholderTextColor="#56ab2f"
          value={fullName}
          onChangeText={setFullName}
        />
        <TextInput
          className="h-12 border border-green-600 font-rubik rounded-lg mb-4 px-4 bg-white"
          placeholder="Email"
          placeholderTextColor="#56ab2f"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          className="h-12 border border-green-600 font-rubik rounded-lg mb-4 px-4 bg-white"
          placeholder="Phone Number"
          placeholderTextColor="#56ab2f"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
        />
        <TextInput
          className="h-12 border border-green-600 font-rubik rounded-lg mb-4 px-4 bg-white"
          placeholder="Address"
          placeholderTextColor="#56ab2f"
          value={address}
          onChangeText={setAddress}
        />
        <TextInput
          className="h-12 border border-green-600 font-rubik rounded-lg mb-4 px-4 bg-white"
          placeholder="Location"
          placeholderTextColor="#56ab2f"
          value={location}
          onChangeText={setLocation}
        />
        <View className="border border-green-600 rounded-lg mb-4" style={{ backgroundColor: '#e6f4ea' }}>
          <Picker
            selectedValue={userType}
            onValueChange={(itemValue) => setUserType(itemValue)}
            style={{ color: "#388e3c" }}
          >
            <Picker.Item label="Individual" value="Individual" />
            <Picker.Item label="Restaurants" value="Restaurants" />
            <Picker.Item label="Caterer" value="Caterer" />
          </Picker>
        </View>
        <View className="rounded-lg px-2 flex-row items-center mb-4 border border-green-600 bg-white">
          <TextInput
            className="flex-1 text-black font-rubik-medium text-lg"
            placeholder="Password"
            placeholderTextColor="#56ab2f"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <MaterialCommunityIcons name={showPassword ? "eye" : "eye-off"} size={24} color="#388e3c" />
          </TouchableOpacity>
        </View>
        <View className="rounded-lg px-2 flex-row items-center mb-4 border border-green-600 bg-white">
          <TextInput
            className="flex-1 text-black font-rubik-medium text-lg"
            placeholder="Confirm Password"
            placeholderTextColor="#56ab2f"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            <MaterialCommunityIcons name={showConfirmPassword ? "eye" : "eye-off"} size={24} color="#388e3c" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity className="w-full p-3 bg-green-500 rounded-lg mb-4 flex-row items-center justify-center" onPress={pickImage}>
          <Text className="text-center font-rubik-medium text-base text-white">Pick Profile Image</Text>
        </TouchableOpacity>
        {image && (
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Image source={{ uri: image }} style={{ width: 80, height: 80, borderRadius: 40, marginBottom: 8 }} />
          </View>
        )}
        <TouchableOpacity className="w-full p-3 bg-green-600 rounded-lg mb-4" onPress={handleSignUp}>
          <Text className="text-center font-rubik-bold text-lg text-white">Sign Up</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("../login")}> 
          <Text className="text-center font-rubik-medium text-base text-green-700">Already have an account? <Text style={{ color: '#388e3c', fontWeight: 'bold' }}>Log In</Text></Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}