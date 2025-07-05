import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import MapView, { Marker } from 'react-native-maps';
import { supabase } from '../../../../constants/supabaseConfig';
import axios from 'axios';

interface LocationData {
  latitude: number;
  longitude: number;
}

export default function SelectLocation() {
  const router = useRouter();
  const { request_id, receiver_id, receiver_name } = useLocalSearchParams();
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [receiverLocation, setReceiverLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => {
    fetchReceiverLocation();
  }, []);

  const fetchReceiverLocation = async () => {
    try {
      if (!receiver_id) {
        Alert.alert('Error', 'Receiver information not available.');
        return;
      }

      // Fetch receiver data
      const { data: receiverData, error } = await supabase
        .from('receiver')
        .select('location')
        .eq('id', receiver_id)
        .single();

      if (error || !receiverData) {
        Alert.alert('Error', 'Failed to fetch receiver location.');
        return;
      }

      console.log('Receiver location from database:', receiverData.location);

      // Check if location is already in JSON format
      let coordinates: LocationData | null = null;
      
      try {
        const locationData = JSON.parse(receiverData.location);
        if (locationData && locationData.latitude && locationData.longitude) {
          coordinates = {
            latitude: locationData.latitude,
            longitude: locationData.longitude,
          };
          console.log('Parsed coordinates from JSON:', coordinates);
        }
      } catch (error) {
        console.log('Location is not JSON, trying to geocode address');
        // If not JSON, try to geocode the address
        coordinates = await geocodeAddress(receiverData.location);
      }

      if (coordinates) {
        console.log('Setting receiver location to:', coordinates);
        setReceiverLocation(coordinates);
      } else {
        console.log('Failed to get coordinates for location:', receiverData.location);
        Alert.alert('Error', 'Could not determine receiver location.');
      }
    } catch (error) {
      console.error('Error fetching receiver location:', error);
      Alert.alert('Error', 'Failed to fetch receiver location.');
    } finally {
      setLoading(false);
    }
  };

  const geocodeAddress = async (address: string): Promise<LocationData | null> => {
    try {
      const API_KEY = "ceea64097b1646c4b18647701f0a60dc";
      
      // Try multiple search strategies
      const searchQueries = [
        `${address}, Dhaka, Bangladesh`,
        `${address}, Bangladesh`,
        `Dhaka, Bangladesh`,
        address
      ];
      
      for (const searchQuery of searchQueries) {
        console.log('Trying to geocode:', searchQuery);
        
        const response = await axios.get(
          `https://api.opencagedata.com/geocode/v1/json`,
          {
            params: {
              q: searchQuery,
              key: API_KEY,
              countrycode: 'bd', // Restrict to Bangladesh
              limit: 1,
            },
          }
        );

        const data = response.data as { results: { geometry: { lat: number; lng: number } }[] };
        if (data.results.length > 0) {
          const result = data.results[0];
          console.log('Successfully geocoded:', searchQuery, 'to coordinates:', result.geometry);
          
          // Verify the coordinates are in Bangladesh (rough check)
          const lat = result.geometry.lat;
          const lng = result.geometry.lng;
          
          if (lat >= 20 && lat <= 27 && lng >= 88 && lng <= 93) {
            return {
              latitude: lat,
              longitude: lng,
            };
          } else {
            console.log('Coordinates outside Bangladesh bounds, trying next query');
            continue;
          }
        }
      }
      
      console.log('No valid geocoding results found for any query');
      return null;
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return distance;
  };

  const handleMapPress = (e: any) => {
    const location = e.nativeEvent.coordinate;
    setSelectedLocation(location);
    
    if (receiverLocation) {
      const calculatedDistance = calculateDistance(
        location.latitude,
        location.longitude,
        receiverLocation.latitude,
        receiverLocation.longitude
      );
      setDistance(calculatedDistance);
    }
  };

  const handleContinue = () => {
    if (!selectedLocation) {
      Alert.alert('No Location Selected', 'Please select a location on the map.');
      return;
    }

    if (!distance) {
      Alert.alert('Error', 'Could not calculate distance.');
      return;
    }

    if (distance > 15) {
      Alert.alert(
        'Location Too Far',
        `The selected location is ${distance.toFixed(1)}km away from the receiver. You can only donate from locations within 15km radius.`
      );
      return;
    }

    // If within radius, proceed to donation form
    router.push({
      pathname: './donate',
      params: {
        request_id: request_id as string,
        receiver_id: receiver_id as string,
        receiver_name: receiver_name as string,
        donor_lat: selectedLocation.latitude.toString(),
        donor_lng: selectedLocation.longitude.toString(),
      }
    });
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="text-gray-600 mt-4">Loading map...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-xl font-rubik-bold text-gray-800">Select Donation Location</Text>
      </View>

      {/* Request Info */}
      {receiver_name && (
        <View className="bg-orange-50 p-4 border-b border-orange-200">
          <Text className="font-rubik-bold text-orange-800 text-lg">Donating for: {receiver_name}</Text>
          <Text className="font-rubik text-orange-600 text-sm mt-1">Select your donation pickup location</Text>
        </View>
      )}

      {/* Map */}
      <View className="flex-1">
        <MapView
          style={{ flex: 1 }}
          initialRegion={{
            latitude: receiverLocation?.latitude || 23.8103,
            longitude: receiverLocation?.longitude || 90.4125,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          onPress={handleMapPress}
        >
          {/* Receiver marker */}
          {receiverLocation && (
            <Marker
              coordinate={receiverLocation}
              title="Receiver Location"
              description={receiver_name as string}
              pinColor="purple"
            />
          )}
          
          {/* Selected location marker */}
          {selectedLocation && (
            <Marker
              coordinate={selectedLocation}
              title="Selected Location"
              description="Your donation pickup location"
              pinColor="orange"
            />
          )}
        </MapView>
      </View>

      {/* Distance Info */}
      {selectedLocation && distance !== null && (
        <View className="bg-white p-4 border-t border-gray-200">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="font-rubik-bold text-gray-800">Distance to Receiver</Text>
            <Text className={`font-rubik-bold text-lg ${distance <= 15 ? 'text-green-600' : 'text-red-600'}`}>
              {distance.toFixed(1)} km
            </Text>
          </View>
          
          {distance <= 15 ? (
            <View className="bg-green-50 p-3 rounded-lg border border-green-200">
              <Text className="text-green-800 font-rubik-medium">
                ✓ Location is within 15km radius
              </Text>
            </View>
          ) : (
            <View className="bg-red-50 p-3 rounded-lg border border-red-200">
              <Text className="text-red-800 font-rubik-medium">
                ✗ Location is too far. Please select a closer location.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View className="bg-white p-4 border-t border-gray-200">
        <TouchableOpacity
          className={`py-4 rounded-xl items-center ${
            selectedLocation && distance !== null && distance <= 15
              ? 'bg-orange-500'
              : 'bg-gray-300'
          }`}
          onPress={handleContinue}
          disabled={!selectedLocation || distance === null || distance > 15}
        >
          <Text className={`font-rubik-bold text-lg ${
            selectedLocation && distance !== null && distance <= 15
              ? 'text-white'
              : 'text-gray-500'
          }`}>
            Continue to Donation Form
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
} 