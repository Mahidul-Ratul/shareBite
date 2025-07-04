import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Alert, TouchableOpacity, Image, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../../../constants/supabaseConfig';
import { Link, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

interface FormData {
  volunteerName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  organizationType: string;
  address: string;
  foodTypes: string[];
  capacity: string;
  areasServed: string;
  mobileNumber: string;
  contactPerson: string;
  location: {
    latitude: number;
    longitude: number;
  };
  imageUri: string;
  languages?: string;
  volunteeringType?: string;
  experience?: string;
  associatedCommunities?: Array<{
    name: string;
    role: string;
    duration: string;
    id: string;
  }>;

}

const OrganizationSignUp = () => {
  const [formData, setFormData] = useState<FormData>({
    volunteerName: '',
    email: '',
    mobileNumber: '',
    imageUri: '',
    location: { latitude: 23.8103, longitude: 90.4125 },
    address: '',
    password: '',
    confirmPassword: '',

    phone: '',
    organizationType: 'NGO',
   
    foodTypes: [],
    capacity: '',
     areasServed: '',
    
    contactPerson: '',
    
   
    associatedCommunities: [],
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [locationPermission, setLocationPermission] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 23.8103,
    longitude: 90.4125,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const router = useRouter();
  const times = ['9:00 AM - 11:00 AM', '11:00 AM - 1:00 PM', '1:00 PM - 3:00 PM', '3:00 PM - 5:00 PM'];

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationPermission(true);
        const location = await Location.getCurrentPositionAsync({});
        setMapRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
        setFormData(prev => ({
          ...prev,
          location: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }
        }));
      }
    })();
  }, []);

  const pickImage = async () => {
    Alert.alert(
      "Select Photo",
      "Choose a photo from:",
      [
        {
          text: "Camera",
          onPress: takePhoto,
        },
        {
          text: "Gallery",
          onPress: chooseFromGallery,
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Sorry, we need camera permissions to make this work!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        setFormData(prev => ({ ...prev, imageUri: result.assets[0].uri }));
      }
    } catch (error) {
      Alert.alert('Error taking photo');
    }
  };

  const chooseFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Sorry, we need gallery permissions to make this work!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        setFormData(prev => ({ ...prev, imageUri: result.assets[0].uri }));
      }
    } catch (error) {
      Alert.alert('Error selecting photo');
    }
  };

 
  const handleMapPress = async (e: any) => {
      const { latitude, longitude } = e.nativeEvent.coordinate;
      setFormData(prev => ({
        ...prev,
        location: { latitude, longitude }
      }));
      
      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocode[0]) {
        setFormData(prev => ({
          ...prev,
          address: `${geocode[0].name}, ${geocode[0].city}, ${geocode[0].region}`
        }));
      }
    };

    const handleSignUp = async () => {
      console.log('Register button clicked');
      setLoading(true);
    
      try {
        // Inline validation for required fields
        if (!formData.volunteerName) {
          Alert.alert('Error', 'Volunteer name is required');
          setLoading(false);
          return;
        }
    
        if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
          Alert.alert('Error', 'A valid email is required');
          setLoading(false);
          return;
        }
    
        if (!formData.phone || !/^\d{10,15}$/.test(formData.phone)) {
          console.log('Phone number:', formData.phone);
          Alert.alert('Error', 'A valid phone number is required (10-15 digits)');
          setLoading(false);
          return;
        }
    
        if (!formData.address) {
          Alert.alert('Error', 'Address is required');
          setLoading(false);
          return;
        }
    
        if (!formData.location || !formData.location.latitude || !formData.location.longitude) {
          Alert.alert('Error', 'Location is required');
          setLoading(false);
          return;
        }
    
        if (!formData.imageUri) {
          Alert.alert('Error', 'Profile image is required');
          setLoading(false);
          return;
        }
    
        if (!formData.password || formData.password.length < 6) {
          Alert.alert('Error', 'Password must be at least 6 characters');
          setLoading(false);
          return;
        }
    
        if (formData.password !== formData.confirmPassword) {
          Alert.alert('Error', 'Passwords do not match');
          setLoading(false);
          return;
        }
    
        if (!formData.foodTypes || formData.foodTypes.length === 0) {
          Alert.alert('Error', 'At least one availability day is required');
          setLoading(false);
          return;
        }
    
        if (!formData.languages) {
          Alert.alert('Error', 'Languages spoken is required');
          setLoading(false);
          return;
        }
    
        if (!formData.associatedCommunities || formData.associatedCommunities.length === 0) {
          Alert.alert('Error', 'At least one associated community is required');
          setLoading(false);
          return;
        }
    
        // Convert the image to Base64 format
        let base64Image = '';
        if (formData.imageUri) {
          const response = await fetch(formData.imageUri);
          const blob = await response.blob();
          const reader = new FileReader();
    
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob); // Convert blob to Base64
          });
    
          base64Image = await base64Promise;
        }
    
        // Register with Supabase Auth first
        const { data: authData, error: authError } = await supabase.auth.signUp({ email: formData.email, password: formData.password });
        if (authError) {
          Alert.alert('Error', authError.message);
          setLoading(false);
          return;
        }
    
        // Insert data into the `volunteer` table
        const { error: volunteerError } = await supabase.from('volunteer').insert([{
          name: formData.volunteerName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          location: `POINT(${formData.location.longitude} ${formData.location.latitude})`,
          image_url: base64Image, // Save the Base64 image
          status: 'pending_approval',
          availability_days: formData.foodTypes.filter(day => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(day)),
          availability_times: formData.foodTypes.filter(time => ['9:00 AM - 11:00 AM', '11:00 AM - 1:00 PM', '1:00 PM - 3:00 PM', '3:00 PM - 5:00 PM'].includes(time)),
          languages: formData.languages || '',
          experience: formData.experience || '',
          associated_communities: formData.associatedCommunities || [],
          password: formData.password,
          confirm_password: formData.confirmPassword,
        }]);
    
        if (volunteerError) throw volunteerError;
    
        Alert.alert('Success', 'Registration successful! Please log in.');
        router.push('../login');
      } catch (error) {
        Alert.alert('Error', (error as any).message);
      } finally {
        setLoading(false);
      }
    };

    function toggleDay(day: string): void {
        setFormData(prev => {
            const isDaySelected = prev.foodTypes.includes(day);
            const updatedDays = isDaySelected
                ? prev.foodTypes.filter(selectedDay => selectedDay !== day)
                : [...prev.foodTypes, day];
            return { ...prev, foodTypes: updatedDays };
        });
    }

    function toggleTime(time: string): void {
        setFormData(prev => {
            const isTimeSelected = prev.foodTypes.includes(time);
            const updatedTimes = isTimeSelected
                ? prev.foodTypes.filter(selectedTime => selectedTime !== time)
                : [...prev.foodTypes, time];
            return { ...prev, foodTypes: updatedTimes };
        });
    }

  return (
    <ScrollView className='p-5 pb-4 bg-white '>
      <View className="items-center rounded-b-2xl mb-2">
        <View className="flex-row items-center">
          <Image source={require("@/assets/images/images.jpeg")} className="w-10 h-10 mr-2" />
          <Text className="text-3xl font-rubik-bold text-black-300">ShareBite</Text>
        </View>
      </View>
      <Text className="text-2xl font-rubik-bold mb-5 mt-2 text-center text-green-800">
        Volunteer Registration
      </Text>

      

      {/* Rest of the form sections remain the same as previous */}
      {/* Organization Details */}
      <View className="mb-6 border  border-green-500 rounded-xl p-4">
        <Text className="text-lg font-rubik-semibols mb-4 text-green-700">Personal Information</Text>
        
        <TextInput
          className="h-12 border border-green-600  font-rubik rounded-lg mb-4 px-4 bg-white"
          placeholder="Volunteer Name *"
          value={formData.volunteerName}
          onChangeText={(text) => setFormData({...formData, volunteerName: text})}
        />
        {errors.volunteerName && <Text className="text-red-500 mb-2">{errors.volunteerName}</Text>}
        <TextInput
          className="h-12 border border-green-600 font-rubik rounded-lg mb-4 px-4 bg-white"
          placeholder="Email *"
          keyboardType="email-address"
          value={formData.email}
          onChangeText={(text) => setFormData({...formData, email: text})}
        />
        {errors.email && <Text className="text-red-500 mb-2">{errors.email}</Text>}
        <TextInput
  className="h-12 border border-green-600 font-rubik rounded-lg mb-4 px-4 bg-white"
  placeholder="Phone Number *"
  keyboardType="phone-pad"
  value={formData.phone} // Bind to formData.phone
  onChangeText={(text) => {
    console.log('Phone Input:', text); // Debugging
    setFormData({ ...formData, phone: text }); // Update formData.phone
  }}
/>
        {errors.mobileNumber && <Text className="text-red-500 mb-2">{errors.mobileNumber}</Text>}
        
        
        {/* <View className="border border-green-600 rounded-lg mb-4">
        <Picker
          selectedValue={formData.organizationType}
          onValueChange={(value) => setFormData({...formData, organizationType: value})}
          style={{height: 48, color: '#1a1a1a'}}
          dropdownIconColor="#16a34a"
        >
          <Picker.Item label="NGO" value="NGO" style={{fontFamily: 'Rubik-Regular'}} />
          <Picker.Item label="Charity" value="Charity" style={{fontFamily: 'Rubik-Regular'}} />
          <Picker.Item label="Community Kitchen" value="Community Kitchen" style={{fontFamily: 'Rubik-Regular'}} />
          <Picker.Item label="Food Bank" value="Food Bank" style={{fontFamily: 'Rubik-Regular'}} />
        </Picker>
  </View> */}
  {/* Image Selection Section */}
<View className="mb-4">
  <TouchableOpacity 
    className="flex-row items-center justify-center bg-green-500 p-3 rounded-lg"
    onPress={pickImage}
  >
    <MaterialIcons name="photo-camera" size={24} color="white" />
    <Text className="text-white font-rubik-medium ml-2">
      {formData.imageUri ? 'Change Photo' : 'Add Photo'}
    </Text>
  </TouchableOpacity>
  
  {formData.imageUri && (
    <View className="mt-4 items-center">
      <Image 
        source={{ uri: formData.imageUri }} 
        className="w-32 h-32 rounded-full"
      />
      <TouchableOpacity 
        className="mt-2 bg-red-50 px-3 py-1 rounded-full"
        onPress={() => setFormData(prev => ({ ...prev, imageUri: '' }))}
      >
        <Text className="text-red-600 font-rubik-medium">Remove Photo</Text>
      </TouchableOpacity>
    </View>
  )}
</View>

        {errors.mobileNumber && <Text className="text-red-500 mb-2">{errors.mobileNumber}</Text>}
      </View>

      {/* Contact Information */}
      {/* <View className="mb-6 border  border-green-500 rounded-xl p-4">
        <Text className="text-lg font-rubik-semibols mb-4 text-green-700">Contact Information</Text>
        
        <TextInput
          className="h-12 border border-green-600 font-rubik rounded-lg mb-4 px-4 bg-white"
          placeholder="Contact Person *"
          value={formData.contactPerson}
          onChangeText={(text) => setFormData({...formData, contactPerson: text})}
        />
        {errors.contactPerson && <Text className="text-red-500 mb-2">{errors.contactPerson}</Text>}

        <TextInput
          className="h-12 border border-green-600 font-rubik rounded-lg mb-4 px-4 bg-white"
          placeholder="Email *"
          keyboardType="email-address"
          value={formData.email}
          onChangeText={(text) => setFormData({...formData, email: text})}
        />
        {errors.email && <Text className="text-red-500 mb-2">{errors.email}</Text>}

        <TextInput
          className="h-12 border border-green-600 font-rubik rounded-lg mb-4 px-4 bg-white"
          placeholder="Phone Number"
          keyboardType="phone-pad"
          value={formData.phone}
          onChangeText={(text) => setFormData({...formData, phone: text})}
        />
      </View> */}

      {/* Location Section */}
      <View className="mb-6 border border-green-500 rounded-xl p-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-rubik-semibols text-green-700">📍 Location</Text>
          {locationPermission && (
            <TouchableOpacity 
              onPress={async () => {
                const location = await Location.getCurrentPositionAsync({});
                setMapRegion({
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                  latitudeDelta: 0.0922,
                  longitudeDelta: 0.0421,
                });
                setFormData(prev => ({
                  ...prev,
                  location: {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                  }
                }));
                // Get address from coordinates
                const geocode = await Location.reverseGeocodeAsync({ 
                  latitude: location.coords.latitude, 
                  longitude: location.coords.longitude 
                });
                if (geocode[0]) {
                  setFormData(prev => ({
                    ...prev,
                    address: `${geocode[0].name}, ${geocode[0].city}, ${geocode[0].region}`
                  }));
                }
              }}
              className="flex-row items-center bg-green-50 px-3 py-1 rounded-full"
            >
              <MaterialIcons name="my-location" size={16} color="#16a34a" />
              <Text className="text-green-600 text-sm ml-1 font-rubik">Current Location</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {locationPermission ? (
          <>
            <View className="bg-green-50 rounded-lg p-3 mb-3">
              <Text className="text-sm font-rubik text-green-700 mb-1">
                <MaterialIcons name="info-outline" size={14} /> Tap on the map to select your location
              </Text>
            </View>
            <MapView 
              style={{ height: 200, borderRadius: 10, marginBottom: 10 }}
              region={mapRegion}
              onPress={handleMapPress}
              className="border-2 border-green-100 rounded-xl"
            >
              <Marker 
                coordinate={formData.location}
                title="Selected Location"
                description={formData.address}
              >
                <View className="bg-green-500 p-2 rounded-full">
                  <MaterialIcons name="location-pin" size={24} color="white" />
                </View>
              </Marker>
            </MapView>
          </>
        ) : (
          <View className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
            <View className="flex-row items-center mb-2">
              <MaterialIcons name="warning" size={20} color="#b45309" />
              <Text className="text-yellow-800 font-rubik-medium ml-2">Location Access Required</Text>
            </View>
            <Text className="text-sm font-rubik text-yellow-700">
              Location access is required to serve your area effectively. Please enable location permissions in your device settings.
            </Text>
            <TouchableOpacity
              onPress={async () => {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                  setLocationPermission(true);
                }
              }}
              className="bg-yellow-100 mt-3 py-2 rounded-lg"
            >
              <Text className="text-yellow-800 font-rubik-medium text-center">
                Grant Permission
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View className="mt-3">
          <View className="flex-row items-center mb-2">
            <MaterialIcons name="edit-location" size={18} color="#16a34a" />
            <Text className="text-green-700 ml-2 font-rubik-medium">Address Details</Text>
          </View>
          <TextInput
            className="h-12 border border-green-200 font-rubik rounded-lg px-4 bg-white"
            placeholder="Full Address"
            value={formData.address}
            onChangeText={(text) => setFormData({...formData, address: text})}
            multiline={true}
            numberOfLines={2}
          />
        </View>
      </View>

      {/* Operational Details */}
      <View className="mb-6 border  border-green-500 rounded-xl p-4">
        <View className="">
            <Text className="text-lg font-rubik-semibols  text-green-700">🧭 Availability</Text>
            <View className="border-t border-gray-300 mt-4"></View>
            <Text className="mt-2 mb-2 font-rubik text-gray-700">Available Days</Text>
            <View className="flex-row flex-wrap mb-2">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                <TouchableOpacity
                    key={day}
                    onPress={() => toggleDay(day)}
                    className={`border border-green-600 px-4 py-2 m-1 rounded-full ${
                    formData.foodTypes.includes(day)
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-white border-gray-300 text-gray-800'
                    }`}
                >
                    <Text className="text-sm font-medium">{day}</Text>
                </TouchableOpacity>
                ))}
        </View>
        <View className="border-t border-gray-300 mt-2 mb-3"></View>
        <Text className="mb-3 font-rubik">Available Time Slots</Text>
        {['9:00 AM - 11:00 AM', '11:00 AM - 1:00 PM', '1:00 PM - 3:00 PM', '3:00 PM - 5:00 PM'].map((time: string) => (
          <TouchableOpacity
            key={time}
            onPress={() => toggleTime(time)}
            className={`border border-green-600 px-3 py-1 m-1 rounded-full ${formData.foodTypes.includes(time) ? 'bg-green-500 text-white' : 'bg-white'}`}>
            <Text>{time}</Text>
          </TouchableOpacity>
        ))}
</View>
<View className="border-t border-gray-300 mt-3 mb-4"></View>

      <Text className=" font-rubik mb-2">✅ Preferences & Skills</Text>
      <TextInput className="border border-green-600 font-rubik p-2 rounded mb-2" placeholder="Languages Spoken" value={formData.languages || ''} onChangeText={t => setFormData({ ...formData, languages: t })} />
      <TextInput className="border border-green-600 font-rubik p-2 rounded mb-2" placeholder="Previous Experience (optional)" value={formData.experience || ''} onChangeText={t => setFormData({ ...formData, experience: t })} />
        
        
      </View>

      {/* Associated Communities */}
      <View className="mb-6 border border-green-500 rounded-xl p-4">
        <Text className="text-lg font-rubik-semibols mb-2 text-green-700">
          🤝 Associated Communities
        </Text>
        <Text className="text-sm text-gray-600 mb-4">
          Add any NGOs or charitable organizations you're currently working with
        </Text>

        {(formData.associatedCommunities || []).map((community, index) => (
          <View key={community.id} className="mb-4 bg-green-50/50 p-4 rounded-lg border border-green-100">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="font-rubik-medium text-green-800">Community {index + 1}</Text>
              <TouchableOpacity 
                onPress={() => {
                  setFormData(prev => ({
                    ...prev,
                    associatedCommunities: prev.associatedCommunities?.filter((_, i) => i !== index)
                  }));
                }}
                className="bg-red-50 p-2 rounded-full"
              >
                <MaterialIcons name="close" size={16} color="#dc2626" />
              </TouchableOpacity>
            </View>

            <TextInput
              className="h-12 border border-green-200 font-rubik rounded-lg mb-3 px-4 bg-white"
              placeholder="Organization Name"
              value={community.name}
              onChangeText={(text) => {
                const updatedCommunities = [...(formData.associatedCommunities || [])];
                updatedCommunities[index] = { ...community, name: text };
                setFormData(prev => ({ ...prev, associatedCommunities: updatedCommunities }));
              }}
            />

            <TextInput
              className="h-12 border border-green-200 font-rubik rounded-lg mb-3 px-4 bg-white"
              placeholder="Your Role (e.g., Food Distribution Volunteer)"
              value={community.role}
              onChangeText={(text) => {
                const updatedCommunities = [...(formData.associatedCommunities || [])];
                updatedCommunities[index] = { ...community, role: text };
                setFormData(prev => ({ ...prev, associatedCommunities: updatedCommunities }));
              }}
            />

            <TextInput
              className="h-12 border border-green-200 font-rubik rounded-lg mb-2 px-4 bg-white"
              placeholder="Duration (e.g., 2 years)"
              value={community.duration}
              onChangeText={(text) => {
                const updatedCommunities = [...(formData.associatedCommunities || [])];
                updatedCommunities[index] = { ...community, duration: text };
                setFormData(prev => ({ ...prev, associatedCommunities: updatedCommunities }));
              }}
            />
          </View>
        ))}

        <TouchableOpacity
          onPress={() => {
            setFormData(prev => ({
              ...prev,
              associatedCommunities: [
                ...(prev.associatedCommunities || []),
                { name: '', role: '', duration: '', id: Date.now().toString() }
              ]
            }));
          }}
          className="flex-row items-center justify-center bg-green-50 p-3 rounded-lg border border-green-200"
        >
          <MaterialIcons name="add" size={20} color="#16a34a" />
          <Text className="text-green-700 font-rubik-medium ml-2">Add Community</Text>
        </TouchableOpacity>
      </View>

      {/* Security Information */}
      <View className="mb-6 border  border-green-500 rounded-xl p-4">
        <Text className="text-lg font-rubik-semibols mb-4 text-green-700">Security Information</Text>
        
        <TextInput
          className="h-12 border border-green-600 font-rubik rounded-lg mb-4 px-4 bg-white"
          placeholder="Password *"
          secureTextEntry
          value={formData.password}
          onChangeText={(text) => setFormData({...formData, password: text})}
        />
        {errors.password && <Text className="text-red-500 mb-2">{errors.password}</Text>}

        <TextInput
          className="h-12 border border-green-600 font-rubik rounded-lg mb-4 px-4 bg-white"
          placeholder="Confirm Password *"
          secureTextEntry
          value={formData.confirmPassword}
          onChangeText={(text) => setFormData({...formData, confirmPassword: text})}
        />
        {errors.confirmPassword && <Text className="text-red-500 mb-2">{errors.confirmPassword}</Text>}
      </View>

      <TouchableOpacity
        className={`w-full p-4 rounded-lg ${loading ? 'bg-gray-400' : 'bg-green-500'} ${loading ? 'opacity-50' : ''}`}
        onPress={handleSignUp}
        disabled={loading}
      >
        <Text className="text-white font-rubik-medium text-center">
          {loading ? "Registering..." : "Register "}
        </Text>
      </TouchableOpacity>

      <View className="flex-row justify-center mt-5">
        <Text className="text-gray-600">Already have an account? </Text>
        <Link href="../auth/login" asChild>
          <TouchableOpacity>
            <Text className="text-green-600 font-bold">Login here</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </ScrollView>
  );
};

export default OrganizationSignUp;
