import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker } from 'react-native-maps';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../../../../constants/supabaseConfig';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';


const DonateForm = () => {
  const [foodDetails, setFoodDetails] = useState('');
  const [foodType, setFoodType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [foodImages, setFoodImages] = useState<any[]>([]);
  const [donorName, setDonorName] = useState('');
  const [donorContact, setDonorContact] = useState('');
  const [location, setLocation] = useState<any>(null); // Store selected location (latitude & longitude)
  const [locationText, setLocationText] = useState(''); // Store location text for input field
  const [producingTime, setProducingTime] = useState<Date | null>(null);
  const [lastingTime, setLastingTime] = useState<Date | null>(null);
  const [showProducingPicker, setShowProducingPicker] = useState(false);
  const [showLastingPicker, setShowLastingPicker] = useState(false);
  const [nearbyNGOs, setNearbyNGOs] = useState<any[]>([]); // Store nearby NGOs
  const [selectedNGO, setSelectedNGO] = useState(''); // Store selected NGO
  const router = useRouter();
  const params = useLocalSearchParams();
  const {
    ngo_id,
    donor_lat,
    donor_lng,
    donor_location,
    ngo_location
  } = params;

  // Request permission to access gallery
  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need permission to access your media library.');
    }
  };

  // Handle picking multiple images
  const handlePickImages = async () => {
    await requestPermission();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      if (result.assets) {
        setFoodImages(result.assets);
      } else {
        setFoodImages([result]);
      }
    }
  };

  // Reverse geocoding to get location name from coordinates
  const getLocationName = async (latitude: number, longitude: number) => {
    try {
      const response = await axios.get(
        `https://api.opencagedata.com/geocode/v1/json`,
        {
          params: {
            q: `${latitude},${longitude}`,
            key: 'ceea64097b1646c4b18647701f0a60dc', // Replace with your OpenCage API key
          },
        }
      );

      const data = response.data as { results: { formatted: string }[] };
      if (data.results.length > 0) {
        return data.results[0].formatted || 'Location not found';
      }
      return 'Location not found';
    } catch (error) {
      console.error('Error fetching location name:', error);
      return 'Location not found';
    }
  };

  // Handle user selecting a location on the map
  const handleMapPress = async (e: any) => {
    const selectedLocation = e.nativeEvent.coordinate;
    setLocation(selectedLocation);
    const locationName = await getLocationName(selectedLocation.latitude, selectedLocation.longitude);
    setLocationText(locationName);
    fetchNearbyNGOs(selectedLocation.latitude, selectedLocation.longitude); // Fetch nearby NGOs based on the selected location
  };

  // Handle marker drag end
  const handleMarkerDragEnd = async (e: any) => {
    const newLocation = e.nativeEvent.coordinate;
    setLocation(newLocation);
    const locationName = await getLocationName(newLocation.latitude, newLocation.longitude);
    setLocationText(locationName);
    fetchNearbyNGOs(newLocation.latitude, newLocation.longitude); // Fetch nearby NGOs based on the dragged marker
  };

  // Fetch nearby NGOs within a 20 km radius
  const fetchNearbyNGOs = async (latitude: number, longitude: number) => {
    try {
      const { data: ngos, error } = await supabase.from('receiver').select('*');
      if (error) {
        console.error('Error fetching NGOs:', error);
        Alert.alert('Error', 'Failed to fetch NGOs.');
        return;
      }

      // Filter NGOs within a 20 km radius
      const nearby = ngos.filter((ngo: any) => {
        const ngoLocation = JSON.parse(ngo.location); // Parse the location field (stored as JSON)
        const distance = calculateDistance(latitude, longitude, ngoLocation.latitude, ngoLocation.longitude);
        return distance <= 20; // 20 km radius
      });

      setNearbyNGOs(nearby);
    } catch (error) {
      console.error('Error fetching nearby NGOs:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
    const R = 6371; // Radius of the Earth in km
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const handleSubmit = async () => {
    if (!locationText) {
      Alert.alert('Location required', 'Please select a location for donation.');
      return;
    }
    if (!foodDetails || !foodType || !quantity || !donorName || !donorContact) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    if (foodImages.length === 0) {
      Alert.alert('Image Required', 'Please pick at least one image of the food.');
      return;
    }
    if (!producingTime || !lastingTime) {
      Alert.alert('Time Required', 'Please select both producing and lasting times.');
      return;
    }
    if (producingTime > lastingTime) {
      Alert.alert('Invalid Time', 'Producing time cannot be later than lasting time.');
      return;
    }
  
    try {
      const coordinates = `${location.latitude},${location.longitude}`;
      const base64Images = await Promise.all(
        foodImages.map(async (image) => {
          const response = await fetch(image.uri);
          const blob = await response.blob();
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        })
      );
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('User not found', 'Please log in again.');
        return;
      }
  
      // Insert the donation into the `donation` table and retrieve the inserted record
      const { data: donationData, error: donationError } = await supabase
        .from('donation')
        .insert([
          {
            Details: foodDetails,
            Types: foodType,
            Quantity: quantity,
            Instructions: specialInstructions,
            Name: donorName,
            Contact: donorContact,
            Image: base64Images,
            Location: locationText,
            coordinates: coordinates,
            Producing: producingTime?.toISOString(),
            Lasting: lastingTime?.toISOString(),
            ngo_id: selectedNGO, // Store the selected NGO's UUID here
            donor_id: userId, 
          },
        ])
        .select(); // Use `.select()` to retrieve the inserted record, including its `id`
  
      if (donationError) {
        console.error('Error inserting data:', donationError);
        Alert.alert('Submission Failed', 'There was an error submitting your donation. Please try again.');
        return;
      }
  
      const donationId = donationData[0]?.id; // Get the `id` of the inserted donation
  
      // Insert a notification for the admin, linking it to the donation
      const { error: notificationError } = await supabase.from('notifications').insert([
        {
          title: 'New Donation Posted',
          message: `A new donation has been posted by ${donorName}.`,
          donation_id: donationId, // Link the notification to the donation
          for:"admin",

        },
      ]);
  
      if (notificationError) {
        console.error('Error inserting notification:', notificationError);
      }
  
      Alert.alert('Success', 'Your donation has been submitted successfully!');
      router.push('./desh');
    } catch (error) {
      console.error('Error submitting donation:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  useEffect(() => {
    // Only set if not already set
    if (ngo_id && donor_lat && donor_lng && donor_location && (!location || !selectedNGO)) {
      setSelectedNGO(ngo_id as string);
      setLocation({ latitude: Number(donor_lat), longitude: Number(donor_lng) });
      setLocationText(donor_location as string);
    } else if (ngo_id && ngo_location && !selectedNGO) {
      setSelectedNGO(ngo_id as string);
      try {
        const parsed = typeof ngo_location === 'string' ? JSON.parse(ngo_location as string) : ngo_location;
        if (parsed && parsed.latitude && parsed.longitude) {
          setLocation({ latitude: parsed.latitude, longitude: parsed.longitude });
          setLocationText('');
        } else {
          setLocationText(ngo_location as string);
        }
      } catch {
        setLocationText(ngo_location as string);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ngo_id, donor_lat, donor_lng, donor_location, ngo_location]);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }} className="bg-white">
        <View className="px-5 py-4">
          <Text className="font-rubik-semibols text-3xl px-3 pt-3 mb-5">Donate Food</Text>

          {/* Food Details */}
          <TextInput
            placeholder="Enter details about the food you want to donate"
            value={foodDetails}
            onChangeText={setFoodDetails}
            className="border border-gray-300 font-rubik rounded-lg p-3 mt-2 mb-4"
          />

          {/* Food Type Picker */}
          <Text className="text-lg font-rubik-medium">Food Type</Text>
          <View className="border border-gray-300 rounded-lg mb-4">
            <Picker selectedValue={foodType} onValueChange={setFoodType} style={{ height: 50, width: '100%' }}>
              <Picker.Item label="Select Food Type" value="" />
              <Picker.Item label="Fruits" value="fruits" />
              <Picker.Item label="Vegetables" value="vegetables" />
              <Picker.Item label="Grains" value="grains" />
              <Picker.Item label="Prepared Meals" value="prepared_meals" />
            </Picker>
          </View>

          {/* Quantity */}
          <TextInput
            placeholder="Quantity"
            keyboardType="numeric"
            value={quantity}
            onChangeText={setQuantity}
            className="border border-gray-300 font-rubik rounded-lg p-3 mt-2 mb-4"
          />

          {/* Special Instructions */}
          <TextInput
            placeholder="Special Instructions"
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            className="border border-gray-300 font-rubik rounded-lg p-3 mt-2 mb-4"
          />

          {/* Donor Information */}
          <TextInput
            placeholder="Your Name"
            value={donorName}
            onChangeText={setDonorName}
            className="border border-gray-300 font-rubik rounded-lg p-3 mt-2 mb-4"
          />
          <TextInput
            placeholder="Your Contact Number"
            value={donorContact}
            onChangeText={setDonorContact}
            keyboardType="phone-pad"
            className="border border-gray-300 rounded-lg p-3 mt-2 mb-4"
          />

          {/* Food Images */}
          <TouchableOpacity onPress={handlePickImages} className="bg-green-600 py-3 px-5 rounded-lg mb-4">
            <Text className="text-lg text-white text-center font-rubik-medium">Pick Food Images</Text>
          </TouchableOpacity>
          {foodImages.length > 0 && (
            <View className="flex-row">
              {foodImages.map((image, index) => (
                <Image key={index} source={{ uri: image.uri }} className="w-20 h-20 rounded-md mr-2" />
              ))}
            </View>
          )}

          {/* Map to select location */}
          <Text className="text-lg font-rubik-medium mt-5">Select Location</Text>
          <MapView
            style={{ width: '100%', height: 200 }}
            initialRegion={{
              latitude: location?.latitude || 23.8103,
              longitude: location?.longitude || 90.4125,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            onPress={handleMapPress}
          >
            {location && <Marker coordinate={location} draggable onDragEnd={handleMarkerDragEnd} />}
          </MapView>

          {/* Display the location in input text */}
          <TextInput
            placeholder="Selected Location"
            value={locationText}
            onChangeText={setLocationText}
            editable={false}
            className="border border-gray-300 rounded-lg p-3 mt-2 mb-4"
          />

          {/* NGO Selection */}
          {nearbyNGOs.length > 0 && (
            <>
              <Text className="text-lg font-rubik-medium mb-2">Select Nearby NGO/Charity</Text>
              <View className="border border-gray-300 rounded-lg mb-4">
                <Picker
                  selectedValue={selectedNGO}
                  onValueChange={(itemValue) => setSelectedNGO(itemValue)}
                  style={{ height: 50, width: '100%' }}
                >
                  <Picker.Item label="Select an NGO" value="" />
                  {nearbyNGOs.map((ngo) => (
                    <Picker.Item key={ngo.id} label={ngo.name} value={ngo.id} />
                  ))}
                </Picker>
              </View>
            </>
          )}

          {/* Producing Time Picker */}
          <Text className="text-lg font-rubik-medium mb-1">Producing Time</Text>
          <TouchableOpacity onPress={() => setShowProducingPicker(true)} className="border p-3 rounded-lg">
            <Text className="font-rubik">
              {producingTime ? producingTime.toLocaleTimeString() : 'Select Producing Time'}
            </Text>
          </TouchableOpacity>
          {showProducingPicker && (
            <DateTimePicker
              value={producingTime || new Date()}
              mode="time"
              is24Hour={true}
              display="default"
              onChange={(event, selectedTime) => {
                setShowProducingPicker(false);
                if (selectedTime) setProducingTime(selectedTime);
              }}
            />
          )}

          {/* Lasting Time Picker */}
          <Text className="text-lg mt-4 mb-1 font-rubik-medium">Lasting Time</Text>
          <TouchableOpacity onPress={() => setShowLastingPicker(true)} className="border p-3 rounded-lg">
            <Text className="font-rubik">
              {lastingTime ? lastingTime.toLocaleTimeString() : 'Select Lasting Time'}
            </Text>
          </TouchableOpacity>
          {showLastingPicker && (
            <DateTimePicker
              value={lastingTime || new Date()}
              mode="time"
              is24Hour={true}
              display="default"
              onChange={(event, selectedTime) => {
                setShowLastingPicker(false);
                if (selectedTime) setLastingTime(selectedTime);
              }}
            />
          )}

          {/* Submit Button */}
          <TouchableOpacity onPress={handleSubmit} className="bg-green-600 py-2 px-4 rounded-lg mt-4">
            <Text className="text-white font-rubik-semibols text-center">Submit Request</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default DonateForm;