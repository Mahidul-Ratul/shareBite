import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Alert, TouchableOpacity, Image } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../../../constants/supabaseConfig';
import { Link, useRouter } from 'expo-router';

interface FormData {
  organizationName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  organizationType: string;
  address: string;
  foodTypes: string[];
  capacity: string;
  areasServed: string;
  registrationNumber: string;
  contactPerson: string;
  location: {
    latitude: number;
    longitude: number;
  };
  imageUri: string;
}

const OrganizationSignUp = () => {
  const [formData, setFormData] = useState<FormData>({
    organizationName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    organizationType: 'NGO',
    address: '',
    foodTypes: [],
    capacity: '',
    areasServed: '',
    registrationNumber: '',
    contactPerson: '',
    location: { latitude: 23.8103, longitude: 90.4125 },
    imageUri: '',
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
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    
    if (!result.canceled) {
      setFormData(prev => ({ ...prev, imageUri: result.assets[0].uri }));
    }
  };

  const validateForm = () => {
    let newErrors: Partial<FormData> = {};
    if (!formData.organizationName) newErrors.organizationName = 'Organization name is required';
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords must match';
    if (!formData.registrationNumber) newErrors.registrationNumber = 'Registration number is required';
    if (!formData.contactPerson) newErrors.contactPerson = 'Contact person is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      if (!validateForm()) return;
      setLoading(true);
      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });
        if (authError) throw authError;

        let base64Image = '';
        if (formData.imageUri) {
          // Fetch the image as a Blob and convert to Base64
          const response = await fetch(formData.imageUri);
          const blob = await response.blob();
          base64Image = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        }
        await saveReceiverData(authData.user?.id, base64Image);
      } catch (error) {
        Alert.alert('Error', (error as any).message);
      } finally {
        setLoading(false);
      }
    };
    
    interface ReceiverData {
      id: string;
      name: string;
      type: string;
      registration: string;
      contact_person: string;
      email: string;
      phone: string;
      location: {
        latitude: number;
        longitude: number;
      };
      areas: string;
      capacity: string;
      password: string;
      cpassword: string;
      image_url: string;
    }

    const saveReceiverData = async (userId: string | undefined, base64Image: string = ''): Promise<void> => {
      try {
        const receiverData: ReceiverData = {
          id: userId || '',
          name: formData.organizationName,
          type: formData.organizationType,
          registration: formData.registrationNumber,
          contact_person: formData.contactPerson,
          email: formData.email,
          phone: formData.phone,
          location: formData.location,
          areas: formData.areasServed,
          capacity: formData.capacity,
          password: formData.password,
          cpassword: formData.confirmPassword,
          image_url: base64Image,
        };

        const { error: receiverError } = await supabase.from('receiver').insert([receiverData]);

        if (receiverError) throw receiverError;
        Alert.alert('Success', 'Registration submitted for approval');
        router.push('./dashboard');
      } catch (error) {
        Alert.alert('Error', (error as any).message);
      }
    };
    

  return (
    <ScrollView className='p-5 pb-4 bg-white '>
      <Text className="text-2xl font-rubik-bold mb-5 text-center text-green-800">
        Organization Registration
      </Text>

      

      {/* Rest of the form sections remain the same as previous */}
      {/* Organization Details */}
      <View className="mb-6 border  border-green-500 rounded-xl p-4">
        <Text className="text-lg font-rubik-semibols mb-4 text-green-700">Basic Information</Text>
        
        <TextInput
          className="h-12 border border-green-600  font-rubik rounded-lg mb-4 px-4 bg-white"
          placeholder="Organization Name *"
          value={formData.organizationName}
          onChangeText={(text) => setFormData({...formData, organizationName: text})}
        />
        {errors.organizationName && <Text className="text-red-500 mb-2">{errors.organizationName}</Text>}
        
        <View className="border border-green-600 rounded-lg mb-4">
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
  </View>
  <TouchableOpacity className='w-full p-3 bg-green-500 rounded-lg mb-4' onPress={pickImage}>
        <Text className='text-white text-center'>Pick an Image</Text>
      </TouchableOpacity>
      {formData.imageUri ? <Image source={{ uri: formData.imageUri }} style={{ width: 100, height: 100, alignSelf: 'center', marginBottom: 10 }} /> : null}
        <TextInput
          className="h-12 border border-green-600 font-rubik rounded-lg mb-4 px-4 bg-white"
          placeholder="Registration Number *"
          value={formData.registrationNumber}
          onChangeText={(text) => setFormData({...formData, registrationNumber: text})}
        />
        {errors.registrationNumber && <Text className="text-red-500 mb-2">{errors.registrationNumber}</Text>}
      </View>

      {/* Contact Information */}
      <View className="mb-6 border  border-green-500 rounded-xl p-4">
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
      </View>

      {/* Location Section */}
      <View className="mb-6 border  border-green-500 rounded-xl p-4">
        <Text className="text-lg font-rubik-semibols mb-4 text-green-700">Location</Text>
        
        {locationPermission ? (
          <>
            <Text className="text-sm mb-2 font-rubik">Tap map to select location</Text>
            <MapView className='font-rubik-medium'
              style={{ height: 200, borderRadius: 10, marginBottom: 10 }}
              region={mapRegion}
              onPress={handleMapPress}
            >
              <Marker coordinate={formData.location} />
            </MapView>
          </>
        ) : (
          <View className="bg-yellow-100 p-4 rounded-lg">
            <Text className="text-sm font-rubik text-yellow-800">
              Location access is required to serve your area effectively.
              Please enable location permissions in settings.
            </Text>
          </View>
        )}

        <TextInput
          className="h-12 border border-green-600 font-rubik rounded-lg mb-4 px-4 bg-white"
          placeholder="Address"
          value={formData.address}
          onChangeText={(text) => setFormData({...formData, address: text})}
        />
      </View>

      {/* Operational Details */}
      <View className="mb-6 border  border-green-500 rounded-xl p-4">
        <Text className="text-lg font-rubik-semibols mb-4 text-green-700">Operational Details</Text>
        
        <TextInput
          className="h-12 border border-green-600 font-rubik rounded-lg mb-4 px-4 bg-white"
          placeholder="Areas Served (comma-separated)"
          value={formData.areasServed}
          onChangeText={(text) => setFormData({...formData, areasServed: text})}
        />

        <TextInput
          className="h-12 border border-green-600 font-rubik rounded-lg mb-4 px-4 bg-white"
          placeholder="Daily Capacity (meals)"
          keyboardType="numeric"
          value={formData.capacity}
          onChangeText={(text) => setFormData({...formData, capacity: text})}
        />
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
          {loading ? "Registering..." : "Register Organization"}
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
