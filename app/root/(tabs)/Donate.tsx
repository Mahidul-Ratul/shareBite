import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location'; // Correct import for location
import MapView, { Marker } from 'react-native-maps';
import DateTimePicker from '@react-native-community/datetimepicker';


const DonateForm = () => {
  const [foodDetails, setFoodDetails] = useState('');
  const [foodType, setFoodType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [foodImages, setFoodImages] = useState<any[]>([]); // Store an array of image URIs
  const [donorName, setDonorName] = useState('');
  const [donorContact, setDonorContact] = useState('');
  const [location, setLocation] = useState<any>(null); // Store selected location (latitude & longitude)
  const [producingTime, setProducingTime] = useState<Date | null>(null);
  const [lastingTime, setLastingTime] = useState<Date | null>(null);
  const [showProducingPicker, setShowProducingPicker] = useState(false);
  const [showLastingPicker, setShowLastingPicker] = useState(false);
  const [locationText, setLocationText] = useState(''); // Store location text for input field
  const [hasLocationPermission, setHasLocationPermission] = useState(false); // Track location permission status
  const router = useRouter();


  const handleProducingTime = (event: any, selectedTime?: Date) => {
    setShowProducingPicker(Platform.OS === 'ios'); // Keep picker open for iOS
    if (selectedTime) setProducingTime(selectedTime);
  };

  const handleLastingTime = (event: any, selectedTime?: Date) => {
    setShowLastingPicker(Platform.OS === 'ios'); // Keep picker open for iOS
    if (selectedTime) setLastingTime(selectedTime);
  };


  // Request permission to access gallery
  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need permission to access your media library.');
    }
  };

  // Handle picking multiple images at once
  const handlePickImages = async () => {
    await requestPermission(); // Request permission before opening the image picker

    // Launch image picker with multiple selection option
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true, // Allow multiple images to be selected
      quality: 1,
    });

    if (!result.canceled) {
      if (result.assets) {
        // Handling multiple images selection
        setFoodImages(result.assets); // Set the selected images (result.assets is an array)
      } else {
        // Handling single image selection
        setFoodImages([result]); // Wrap the single selected image in an array
      }
    }
  };

  // Function to request and get current location from expo-location
  const getCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync(); // Request location permission
    if (status === 'granted') {
      setHasLocationPermission(true);
      const location = await Location.getCurrentPositionAsync({}); // Get current position
      setLocation(location.coords); // Set the location (latitude and longitude)
      setLocationText(await getLocationName(location.coords.latitude, location.coords.longitude)); // Show location name in input
    } else {
      Alert.alert('Location Permission Denied', 'We need location permissions to get your current location.');
    }
  };

  // Reverse geocoding to get location name from coordinates (detailed address)
  const getLocationName = async (latitude: number, longitude: number) => {
    const reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (reverseGeocode.length > 0) {
      const address = reverseGeocode[0];

      // Building a detailed address from multiple fields
      const fullAddress = `${address.name || ''}, ${address.street || ''}, ${address.subregion || ''}, ${address.city || ''}, ${address.region || ''}, ${address.country || ''}`;

      return fullAddress.trim() || 'Location not found';
    }
    return 'Location not found';
  };

  // Handle user selecting a location on the map
  const handleMapPress = async (e: any) => {
    const selectedLocation = e.nativeEvent.coordinate;
    setLocation(selectedLocation); // Set the tapped location (latitude and longitude)
    setLocationText(await getLocationName(selectedLocation.latitude, selectedLocation.longitude)); // Update location input with place name
  };

  // Handle dragging the marker and updating the location and address
  const handleMarkerDragEnd = async (e: any) => {
    const newLocation = e.nativeEvent.coordinate;
    setLocation(newLocation); // Update the location (latitude and longitude)
    setLocationText(await getLocationName(newLocation.latitude, newLocation.longitude)); // Update the location text with the new address
  };

  useEffect(() => {
    getCurrentLocation(); // Get current location on component mount
  }, []);

  const handleSubmit = () => {
    if (!location) {
      Alert.alert('Location required', 'Please select a location for donation.');
      return;
    }
    // Logic to submit the form (e.g., API call)
    console.log('Food Details:', foodDetails);
    console.log('Location:', location);
    router.back(); // Go back to the previous screen (Home)
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }} className="bg-white">
      <View className="px-5 py-4">
        {/* App Icon and App Name */}
        <View className='flex items-center'>
        <View className="flex-row items-center">
                  <Image source={require("@/assets/images/images.jpeg")} className="w-10 h-10 mr-2" />
                  <Text className="text-3xl font-rubik-bold text-black-300">ShareBite</Text>
                </View>
                </View>
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
            <Picker
              selectedValue={foodType}
              onValueChange={setFoodType}
              style={{ height: 50, width: '100%' }}
            >
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
            showsUserLocation={true} // Show the user's current location on the map
            followsUserLocation={true} // Keep map centered on user's location
            initialRegion={{
              latitude: location?.latitude || 37.78825, // Default to San Francisco if no location
              longitude: location?.longitude || -122.4324,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            onPress={handleMapPress}
            onMarkerDragEnd={handleMarkerDragEnd} // Listen for marker drag end event
          >
            {location && <Marker coordinate={location} draggable />}
          </MapView>

          {/* Display the location in input text */}
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
            <TextInput
                className='font-rubik'
                placeholder="Select Location"
                value={locationText}
                onChangeText={setLocationText}
                editable={false}
                style={{
                borderColor: '#ccc',
                borderWidth: 1,
                borderRadius: 8,
                padding: 10,
                marginTop: 10,
                marginBottom: 10,
                minHeight: 40,
                width: '100%',
                }}
            />
          </ScrollView>

           {/* Producing Time Picker */}
      <Text className="text-lg font-rubik-medium mb-1">Producing Time</Text>
      <TouchableOpacity onPress={() => setShowProducingPicker(true)} className="border p-3 rounded-lg">
        <Text className='font-rubik'>{producingTime ? producingTime.toLocaleTimeString() : "Select Producing Time"}</Text>
      </TouchableOpacity>

      {showProducingPicker && (
        <DateTimePicker
          value={producingTime || new Date()}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleProducingTime}
        />
      )}

      {/* Lasting Time Picker */}
      <Text className="text-lg mt-4 mb-1 font-rubik-medium">Lasting Time</Text>
      <TouchableOpacity onPress={() => setShowLastingPicker(true)} className="border p-3 rounded-lg">
        <Text className='font-rubik'>{lastingTime ? lastingTime.toLocaleTimeString() : "Select Lasting Time"}</Text>
      </TouchableOpacity>

      {showLastingPicker && (
        <DateTimePicker
          value={lastingTime || new Date()}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleLastingTime}
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

