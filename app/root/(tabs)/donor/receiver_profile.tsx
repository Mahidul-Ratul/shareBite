import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, ActivityIndicator, StyleSheet, TouchableOpacity, Alert, Dimensions, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../../constants/supabaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import MapView, { Marker } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

const ReceiverProfile = () => {
  const { id } = useLocalSearchParams();
  const [receiver, setReceiver] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkingRange, setCheckingRange] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [locationText, setLocationText] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchReceiver = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('receiver')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) setReceiver(data);
      setLoading(false);
    };
    if (id) fetchReceiver();
  }, [id]);

  // Calculate distance between two points (Haversine formula)
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
    const R = 6371; // Radius of the Earth in km
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  const getReceiverCoordinates = () => {
    if (!receiver?.location) return null;
    try {
      if (typeof receiver.location === 'string') {
        const parsed = JSON.parse(receiver.location);
        if (parsed.latitude && parsed.longitude) return parsed;
      } else if (receiver.location.latitude && receiver.location.longitude) {
        return receiver.location;
      }
    } catch {
      // fallback: try to geocode
    }
    return null;
  };

  const geocodeAddress = async (address: string) => {
    try {
      const response = await axios.get(
        `https://api.opencagedata.com/geocode/v1/json`,
        {
          params: {
            q: address,
            key: 'ceea64097b1646c4b18647701f0a60dc',
          },
        }
      );
      const results = (response.data as any).results;
      if (results && results.length > 0) {
        return {
          latitude: results[0].geometry.lat,
          longitude: results[0].geometry.lng,
        };
      }
    } catch (e) {}
    return null;
  };

  const getLocationName = async (latitude: number, longitude: number) => {
    try {
      const response = await axios.get(
        `https://api.opencagedata.com/geocode/v1/json`,
        {
          params: {
            q: `${latitude},${longitude}`,
            key: 'ceea64097b1646c4b18647701f0a60dc',
          },
        }
      );
      const data = response.data as { results: { formatted: string }[] };
      if (data.results.length > 0) {
        return data.results[0].formatted || 'Location not found';
      }
      return 'Location not found';
    } catch (error) {
      return 'Location not found';
    }
  };

  const handleDonate = async () => {
    setCheckingRange(true);
    let receiverCoords = getReceiverCoordinates();
    if (!receiverCoords && receiver?.location) {
      receiverCoords = await geocodeAddress(receiver.location);
    }
    if (!receiverCoords) {
      setCheckingRange(false);
      setShowMap(true);
      return;
    }
    const donorLocationStr = await AsyncStorage.getItem('lastDonorLocation');
    let donorCoords = null;
    if (donorLocationStr) {
      try {
        donorCoords = JSON.parse(donorLocationStr);
      } catch {}
    }
    if (!donorCoords) {
      setCheckingRange(false);
      setShowMap(true);
      return;
    }
    const distance = calculateDistance(
      donorCoords.latitude,
      donorCoords.longitude,
      receiverCoords.latitude,
      receiverCoords.longitude
    );
    if (distance <= 20) {
      router.push({ pathname: './donate', params: { ngo_id: receiver.id, ngo_name: receiver.name, ngo_location: receiver.location } });
    } else {
      Alert.alert('Not Available', 'This NGO/charity is not available in your area.');
    }
    setCheckingRange(false);
  };

  const handleMapPress = async (e: any) => {
    const selected = e.nativeEvent.coordinate;
    setSelectedLocation(selected);
    const locationName = await getLocationName(selected.latitude, selected.longitude);
    setLocationText(locationName);
  };

  const handleMapDonate = async () => {
    if (!selectedLocation) {
      Alert.alert('Location required', 'Please select a location on the map.');
      return;
    }
    let receiverCoords = getReceiverCoordinates();
    if (!receiverCoords && receiver?.location) {
      receiverCoords = await geocodeAddress(receiver.location);
    }
    if (!receiverCoords) {
      Alert.alert('Error', 'Could not determine receiver location.');
      return;
    }
    const distance = calculateDistance(
      selectedLocation.latitude,
      selectedLocation.longitude,
      receiverCoords.latitude,
      receiverCoords.longitude
    );
    if (distance <= 20) {
      // Save donor location for future
      await AsyncStorage.setItem('lastDonorLocation', JSON.stringify(selectedLocation));
      router.push({ pathname: './donate', params: { ngo_id: receiver.id, ngo_name: receiver.name, ngo_location: receiver.location, donor_lat: selectedLocation.latitude, donor_lng: selectedLocation.longitude, donor_location: locationText } });
    } else {
      Alert.alert('Not Available', 'This NGO/charity is not available in your area.');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}><ActivityIndicator size="large" color="#6366f1" /></View>
    );
  }
  if (!receiver) {
    return (
      <View style={styles.centered}><Text style={{ color: '#dc2626' }}>Receiver profile not found.</Text></View>
    );
  }

  let imageUri = receiver.image_url;
  if (imageUri && !imageUri.startsWith('data:image')) {
    imageUri = `data:image/jpeg;base64,${imageUri}`;
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ minHeight: height, paddingBottom: 40 }}>
      <LinearGradient colors={["#f8fafc", "#e0e7ff"]} style={{ flex: 1, minHeight: height }}>
        <View style={styles.headerContainer}>
          <View style={styles.avatarShadow}>
            <Image source={imageUri ? { uri: imageUri } : require('@/assets/images/avatar.png')} style={styles.avatarRect} />
          </View>
          <Text style={styles.name}>{receiver.name}</Text>
          <Text style={styles.type}>{receiver.type}</Text>
          <View style={styles.infoRow}><Ionicons name="mail" size={18} color="#6366f1" /><Text style={styles.infoText}>{receiver.email}</Text></View>
          <View style={styles.infoRow}><Ionicons name="call" size={18} color="#6366f1" /><Text style={styles.infoText}>{receiver.phone}</Text></View>
          <View style={styles.infoRow}><MaterialIcons name="location-on" size={18} color="#f59e42" /><Text style={styles.infoText}>{typeof receiver.location === 'string' ? receiver.location : JSON.stringify(receiver.location)}</Text></View>
          <View style={styles.infoRow}><MaterialIcons name="groups" size={18} color="#16a34a" /><Text style={styles.infoText}>{receiver.areas}</Text></View>
          <View style={styles.infoRow}><MaterialIcons name="warehouse" size={18} color="#0ea5e9" /><Text style={styles.infoText}>Capacity: {receiver.capacity}</Text></View>
        </View>
        <View style={{ alignItems: 'center', marginTop: 24 }}>
          {!showMap ? (
            <TouchableOpacity
              style={styles.donateButton}
              onPress={handleDonate}
              disabled={checkingRange}
            >
              <Text style={styles.donateButtonText}>{checkingRange ? 'Checking...' : `Donate to ${receiver.name}`}</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: width * 0.92, alignItems: 'center', marginTop: 10 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#22223b', marginBottom: 8 }}>Select Your Donation Location</Text>
              <MapView
                style={{ width: width * 0.9, height: 220, borderRadius: 18, marginBottom: 12 }}
                initialRegion={{
                  latitude: 23.8103,
                  longitude: 90.4125,
                  latitudeDelta: 0.0922,
                  longitudeDelta: 0.0421,
                }}
                onPress={handleMapPress}
              >
                {selectedLocation && (
                  <Marker coordinate={selectedLocation} />
                )}
              </MapView>
              <Text style={{ color: '#6366f1', marginBottom: 8 }}>{locationText}</Text>
              <TouchableOpacity
                style={[styles.donateButton, { backgroundColor: selectedLocation ? '#16a34a' : '#a7f3d0' }]}
                onPress={handleMapDonate}
                disabled={!selectedLocation}
              >
                <Text style={styles.donateButtonText}>Continue to Donate</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </LinearGradient>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  headerContainer: { alignItems: 'center', paddingTop: 36, paddingBottom: 16, backgroundColor: 'transparent' },
  avatarShadow: { shadowColor: '#6366f1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8, borderRadius: 18, marginBottom: 12 },
  avatarRect: { width: width * 0.9, height: 180, borderRadius: 18, borderWidth: 3, borderColor: '#e0e7ff', backgroundColor: '#fff', resizeMode: 'cover' },
  name: { fontSize: 28, fontWeight: 'bold', color: '#22223b', marginBottom: 4, marginTop: 18 },
  type: { color: '#6366f1', fontSize: 16, marginBottom: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  infoText: { color: '#374151', fontSize: 15, marginLeft: 8 },
  donateButton: { backgroundColor: '#16a34a', paddingVertical: 14, paddingHorizontal: 36, borderRadius: 30, marginTop: 8, shadowColor: '#16a34a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  donateButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18, letterSpacing: 1 },
});

export default ReceiverProfile;
