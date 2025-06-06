import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ImageBackground,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../../../constants/supabaseConfig";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { Picker } from "@react-native-picker/picker";


interface UserData {
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  password: string;
  profileImage: string | null; // Add profileImage to store image URI
  type: string;
}


export default function SignUpScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [image, setImage] = useState<string | null>(null); // Store base64 image string
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userType, setUserType] = useState("Individual"); // Default value

  // Image picker function
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
      console.log("Image URI:", imageUri);

      // Convert image to base64
      try {
        const base64Image = await fetch(imageUri)
          .then((response) => response.blob())
          .then((blob) => new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          }));

        // Now store the base64 image string
        setImage(base64Image);
        console.log("Base64 Image String:", base64Image);
      } catch (error) {
        console.log("Error converting image to base64:", error);
      }
    }
  };

  // Handle sign up
  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match!");
      return;
    }

    try {
      console.log("Attempting sign-up...");

      const { error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) {
        console.log("Auth Error:", authError.message);
        throw authError;
      }

      let imageUrl = null;
      if (image) {
        // Store the base64 string as the profile image
        imageUrl = image;
      }

      console.log("Inserting user data into database...");
      const userData: UserData = { fullName, email, phoneNumber, address, password, profileImage: imageUrl || "", type: userType };
      const { error: insertError } = await supabase.from("users").insert([userData]);

      if (insertError) {
        console.log("Database Insert Error:", insertError.message);
        throw insertError;
      }

      Alert.alert("Success", "Sign-up successful! Please check your email.");
      router.push(".././login");
    } catch (error) {
      console.log("Sign-Up Error:", error);
      Alert.alert("Error", error instanceof Error ? error.message : "An unknown error occurred");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ImageBackground
          source={require("@/assets/images/pexels-photo-6591162.webp")}
          className="flex-1 bg-black/50"
        >
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 20 }}>
            <Text className="text-white font-rubik-bold text-3xl mb-6 text-center">Sign Up</Text>
            <TextInput
              className="w-full bg-white/40 p-3 font-rubik-medium rounded-lg text-black text-lg mb-4"
              placeholder="Full Name"
              placeholderTextColor="#ffffff"
              value={fullName}
              onChangeText={setFullName}
            />
            <TextInput
              className="w-full bg-white/40 p-3 font-rubik-medium rounded-lg text-black text-lg mb-4"
              placeholder="Email"
              placeholderTextColor="#ffffff"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              className="w-full bg-white/40 p-3 font-rubik-medium rounded-lg text-black text-lg mb-4"
              placeholder="Phone Number"
              placeholderTextColor="#ffffff"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
            <TextInput
              className="w-full bg-white/40 p-3 font-rubik-medium rounded-lg text-black text-lg mb-4"
              placeholder="Address"
              placeholderTextColor="#ffffff"
              value={address}
              onChangeText={setAddress}
            />

            {/* User Type Selection */}
            <View className="w-full bg-white/40 font-rubik-medium text-lg rounded-lg mb-4">
              <Picker
                selectedValue={userType}
                onValueChange={(itemValue) => setUserType(itemValue)}
                style={{ color: "white" }}
              >
                <Picker.Item label="Individual" value="Individual" />
                <Picker.Item label="Restaurants" value="Restaurants" />
                <Picker.Item label="Caterer" value="Caterer" />
              </Picker>
            </View>

            <View className="w-full bg-white/40 rounded-lg px-2 flex-row items-center mb-4">
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

            <View className="w-full bg-white/40 rounded-lg px-2 flex-row items-center mb-4">
              <TextInput
                className="flex-1 text-white font-rubik-medium text-lg"
                placeholder="Confirm Password"
                placeholderTextColor="#ffffff"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <MaterialCommunityIcons name={showConfirmPassword ? "eye" : "eye-off"} size={24} color="white" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity className="w-full bg-white/40 p-3 rounded-lg mb-4 flex-row items-center justify-center" onPress={pickImage}>
              <Text className="text-white font-rubik-medium text-lg text-center">📷 Pick Profile Image</Text>
            </TouchableOpacity>
            {image && (
              <Image source={{ uri: image }} className="w-24 h-24 rounded-full mb-4 border-2 border-white" />
            )}

            <TouchableOpacity className="w-full bg-orange-500 p-4 rounded-lg" onPress={handleSignUp}>
              <Text className="text-white text-lg font-rubik-semibold text-center">Sign Up</Text>
            </TouchableOpacity>
          </ScrollView>
        </ImageBackground>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}