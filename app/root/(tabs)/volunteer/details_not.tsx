import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../../constants/supabaseConfig';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

interface DonationDetails {
  id: string;
  Details: string;
  Types: string[];
  Quantity: string;
  Instructions: string;
  Name: string;
  Contact: string;
  Image: string[];
  Location: string;
  Producing: string;
  Lasting: string;
  coordinates: { latitude: number; longitude: number } | null;
  ngo_id: string;
  status: string;
  donor_id: string;
  volunteer_id: string | null;
}

interface ReceiverInfo {
  id: string;
  name: string;
  type: string;
  registration: string;
  contact_person: string;
  email: string;
  phone: string;
  location: string;
  areas: string;
  capacity: string;
  image_url: string;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  function toRad(x: number) { return x * Math.PI / 180; }
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
  return fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=ceea64097b1646c4b18647701f0a60dc&limit=1&countrycode=bd`)
    .then(res => res.json())
    .then(data => {
      if (data.results && data.results.length > 0) {
        return {
          latitude: data.results[0].geometry.lat,
          longitude: data.results[0].geometry.lng,
        };
      }
      return null;
    })
    .catch(() => null);
}

export default function DonationDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const donationId = typeof params.id === 'string' ? params.id : typeof params.donationId === 'string' ? params.donationId : null;

  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<DonationDetails | null>(null);
  const [receiver, setReceiver] = useState<ReceiverInfo | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [mapCoords, setMapCoords] = useState<{ donor?: { latitude: number; longitude: number }, receiver?: { latitude: number; longitude: number }, volunteer?: { latitude: number; longitude: number } }>({});
  const [mapLoading, setMapLoading] = useState(false);

  useEffect(() => {
    if (!donationId) {
      Alert.alert('Error', 'No donation ID provided');
      return;
    }
    fetchDonationDetails();
    // Get user location
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let loc = await Location.getCurrentPositionAsync({});
      setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    })();
  }, [donationId]);

  useEffect(() => {
    if (details && details.ngo_id) {
      fetchReceiverInfo(details.ngo_id);
    }
    // Calculate distance if both locations are available
    if (details && details.coordinates && userLocation) {
      setDistance(
        haversineDistance(
          userLocation.latitude,
          userLocation.longitude,
          details.coordinates.latitude,
          details.coordinates.longitude
        )
      );
    }
  }, [details, userLocation]);

  useEffect(() => {
    const fetchMapPoints = async () => {
      if (!details) return;
      setMapLoading(true);
      const coords: { donor?: { latitude: number; longitude: number }, receiver?: { latitude: number; longitude: number }, volunteer?: { latitude: number; longitude: number } } = {};
      // Donor
      if (details.Location) {
        const donorCoords = await geocodeAddress(details.Location);
        if (donorCoords) coords.donor = donorCoords;
      }
      // Receiver (NGO)
      if (receiver?.location) {
        // Await geocoding and only set if result
        const receiverCoords = await geocodeAddress(receiver.location);
        if (receiverCoords) coords.receiver = receiverCoords;
      }
      // Volunteer (current user)
      if (userLocation) {
        coords.volunteer = userLocation;
      }
      setMapCoords(coords);
      setMapLoading(false);
    };
    if (details && receiver && userLocation) {
      fetchMapPoints();
    }
  }, [details, receiver, userLocation]);

  const fetchDonationDetails = async () => {
    if (!donationId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('donation')
        .select('*')
        .eq('id', donationId)
        .single();
      if (error) throw error;

      // Parse coordinates
      let coords = null;
      if (data.coordinates) {
        try {
          if (typeof data.coordinates === 'string') {
            const trimmed = data.coordinates.trim();
            if (!trimmed || trimmed === ',' || trimmed === '{}' || trimmed === 'null') {
              coords = null;
            } else {
              try {
                // Only try to parse if it looks like JSON (starts with { or [)
                if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                  const raw = JSON.parse(trimmed);
                  if (raw && typeof raw.latitude === 'number' && typeof raw.longitude === 'number') {
                    coords = { latitude: raw.latitude, longitude: raw.longitude };
                  }
                } else {
                  coords = null;
                }
              } catch (err) {
                coords = null;
                if (trimmed !== ',') {
                  console.warn('Invalid coordinates format:', err);
                }
              }
            }
          } else if (typeof data.coordinates === 'object' && data.coordinates !== null) {
            if (typeof data.coordinates.latitude === 'number' && typeof data.coordinates.longitude === 'number') {
              coords = { latitude: data.coordinates.latitude, longitude: data.coordinates.longitude };
            }
          }
        } catch (err) {
          coords = null;
          console.warn('Invalid coordinates format:', err);
        }
      }
      // Parse Images (comma separated string)
      let images: string[] = [];
      if (data.Image) {
        if (Array.isArray(data.Image)) {
          images = data.Image;
        } else if (typeof data.Image === 'string') {
          images = data.Image.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
      }
      // Parse Types (comma separated string)
      let types: string[] = [];
      if (data.Types) {
        if (Array.isArray(data.Types)) {
          types = data.Types;
        } else if (typeof data.Types === 'string') {
          types = data.Types.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
      }
      setDetails({
        id: data.id,
        Details: data.Details || '',
        Types: types,
        Quantity: data.Quantity || '',
        Instructions: data.Instructions || '',
        Name: data.Name || '',
        Contact: data.Contact || '',
        Image: images,
        Location: data.Location || '',
        Producing: data.Producing || '',
        Lasting: data.Lasting || '',
        coordinates: coords,
        ngo_id: data.ngo_id || '',
        status: data.status || '',
        donor_id: data.donor_id || '',
        volunteer_id: data.volunteer_id || null,
      });
    } catch (err) {
      console.error('Error fetching donation details:', err);
      Alert.alert('Error', 'Failed to load donation details');
    } finally {
      setLoading(false);
    }
  };

  const fetchReceiverInfo = async (ngo_id: string) => {
    try {
      const { data, error } = await supabase
        .from('receiver')
        .select('*')
        .eq('id', ngo_id)
        .single();
      if (!error && data) {
        setReceiver(data);
      }
    } catch (err) {
      // ignore
    }
  };

  // Get volunteer's unique id from volunteer table using email
  const getVolunteerId = async () => {
    // Get the current session user reliably
    let userEmail = null;
    try {
      const { data, error } = await supabase.auth.getSession();
      if (!error && data?.session?.user?.email) {
        userEmail = data.session.user.email;
      }
    } catch (e) {
      // fallback
    }
    if (!userEmail) {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (!error && data?.user?.email) {
          userEmail = data.user.email;
        }
      } catch (e) {}
    }
    if (!userEmail) {
      Alert.alert(
        'Error',
        'You are not logged in. Please log in again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => router.replace('/root/(tabs)/login') }
        ]
      );
      throw new Error('User not logged in');
    }
    // Now fetch the volunteer id from the volunteer table using the email
    const { data: volunteerRow, error: volunteerRowError } = await supabase
      .from('volunteer')
      .select('id')
      .eq('email', userEmail)
      .maybeSingle();
    if (volunteerRowError || !volunteerRow) {
      Alert.alert('Error', 'Volunteer profile not found for this email.');
      throw new Error('Volunteer not found');
    }
    return volunteerRow.id;
  };

  const handleAccept = async () => {
    if (!donationId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('donation')
        .select('status,volunteer_id,ngo_id,donor_id,Location')
        .eq('id', donationId)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        Alert.alert('Error', 'Donation not found.');
        setLoading(false);
        return;
      }
      if (data.status === 'volunteer is assigned' || data.volunteer_id) {
        Alert.alert('Sorry', 'This donation is already assigned to a volunteer.');
        return;
      }
      // Get volunteer info from volunteer table using email
      const volunteerId = await getVolunteerId();
      // Calculate distance (optional, fallback to '-')
      let distance = '-';
      // Assign volunteer to donation
      const { error: updateError } = await supabase
        .from('donation')
        .update({
          status: 'volunteer is assigned',
          volunteer_id: volunteerId,
        })
        .eq('id', donationId);
      if (updateError) throw updateError;
      // Send notifications to admin, donor, and receiver
      const notifications = [
        {
          title: 'Volunteer Assigned',
          message: `A volunteer has accepted the donation for delivery.`,
          type: 'assigned',
          isread: false,
          for: 'admin',
          donation_id: donationId,
          created_at: new Date().toISOString(),
          volunteer_id: volunteerId,
        },
        {
          title: 'Volunteer Assigned',
          message: `A volunteer will collect and deliver your donation.`,
          type: 'assigned',
          isread: false,
          for: 'donor',
          donation_id: donationId,
          created_at: new Date().toISOString(),
          donor_id: data.donor_id,
          volunteer_id: volunteerId,
        },
        {
          title: 'Volunteer Assigned',
          message: `A volunteer will deliver the donation to you.`,
          type: 'assigned',
          isread: false,
          for: 'receiver',
          donation_id: donationId,
          created_at: new Date().toISOString(),
          ngo_id: data.ngo_id,
          volunteer_id: volunteerId,
        },
        // Notify donor that a specific volunteer is assigned
        {
          title: 'Volunteer Assigned',
          message: `A volunteer has been assigned and will collect your food donation soon.`,
          type: 'assigned',
          isread: false,
          for: 'donor',
          donation_id: donationId,
          created_at: new Date().toISOString(),
          donor_id: data.donor_id,
          volunteer_id: volunteerId,
        },
      ];
      const { error: notifError } = await supabase.from('notifications').insert(notifications);
      if (notifError) {
        console.error('Notification insert error:', notifError);
        Alert.alert('Warning', 'Volunteer assigned, but notification failed to send.');
      }
      Alert.alert('Success', 'You have been assigned to this donation!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
      fetchDonationDetails();
    } catch (err) {
      console.error('Error accepting donation:', err);
      Alert.alert('Error', 'Failed to accept donation');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!donationId) return;
    setLoading(true);
    try {
      // Get volunteer info from volunteer table using email
      const volunteerId = await getVolunteerId();
      // Find the notification for this volunteer and this donation (for: 'volunteer')
      const { data: notifications, error: notifFetchError } = await supabase
        .from('notifications')
        .select('id')
        .eq('donation_id', donationId)
        .eq('volunteer_id', volunteerId)
        .eq('for', 'volunteer');
      if (notifFetchError) throw notifFetchError;
      if (notifications && notifications.length > 0) {
        const notifIds = notifications.map((n: any) => n.id);
        // Mark as unavailable/declined only for this volunteer
        const { data: updatedRows, error: notifUpdateError } = await supabase
          .from('notifications')
          .update({ isread: true, status: 'declined' })
          .in('id', notifIds)
          .select();
        if (notifUpdateError) {
          console.error('Notification update error:', notifUpdateError);
          throw notifUpdateError;
        } else {
          if (updatedRows && updatedRows.some((n: any) => !n.status || n.status === '')) {
            await supabase
              .from('notifications')
              .update({ isread: true, status: 'declined' })
              .in('id', notifIds);
            console.log('Patched declined status for notifications:', notifIds);
          } else {
            console.log('Declined notification(s) updated:', updatedRows);
          }
        }
      } else {
        console.warn('No notification found for this volunteer and donation.');
      }
      // If no notification found, try to find and update any notification for this volunteer and donation that is not already declined
      if (!notifications || notifications.length === 0) {
        const { data: declinedRows, error: declinedFetchError } = await supabase
          .from('notifications')
          .select('id, status')
          .eq('donation_id', donationId)
          .eq('volunteer_id', volunteerId)
          .eq('for', 'volunteer');
        if (declinedFetchError) throw declinedFetchError;
        if (declinedRows && declinedRows.length > 0) {
          const toDecline = declinedRows.filter((n: any) => n.status !== 'declined');
          if (toDecline.length > 0) {
            const notifIds = toDecline.map((n: any) => n.id);
            await supabase
              .from('notifications')
              .update({ isread: true, status: 'declined' })
              .in('id', notifIds);
            console.log('Force-declined notification(s):', notifIds);
          } else {
            console.log('All notifications for this volunteer and donation are already declined.');
          }
        } else {
          console.warn('Still no notification found for this volunteer and donation.');
        }
      }
      // Debug: log volunteerId and donationId
      console.log('Decline pressed for volunteerId:', volunteerId, 'donationId:', donationId);
      // Debug: log all notifications for this donation
      const { data: allNotifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('donation_id', donationId);
      console.log('All notifications for this donation:', allNotifs);
      setLoading(false);
      Alert.alert('Declined', 'You have declined this donation request.');
      router.back();
    } catch (err) {
      setLoading(false);
      console.error('Error declining donation:', err);
      Alert.alert('Error', 'Failed to decline donation');
    } finally {
      setLoading(false);
    }
  };

  // NOTE: To ensure notifications are unique per volunteer, make sure that when a donation is created or becomes available,
  // a notification row is inserted for each eligible volunteer (with for: 'volunteer', volunteer_id, and donation_id).
  // This should be handled in the backend or wherever donations are made available to volunteers.
  // NOTE: If status is not updating, ensure a notification row exists for this volunteer and donation with the correct volunteer_id (auth user id) in the database.

  if (loading && !details) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Text>Loading...</Text>
      </View>
    );
  }
  if (!details) return null;
  const { Image: images, Types: requirements } = details;

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView>
        <View className="bg-white pt-12 pb-4 px-6 shadow-sm">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <MaterialIcons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="text-xl font-rubik-bold text-gray-900">Donation Details</Text>
          </View>
        </View>
        {/* Image Carousel - show first image immediately, only scroll if >1 */}
        {images.length > 0 && (
          images.length === 1 ? (
            <Image source={{ uri: images[0].startsWith('data:') ? images[0] : `data:image/jpeg;base64,${images[0]}` }} style={{ width: '100%', height: 220, borderRadius: 12, marginTop: 10 }} resizeMode="cover" />
          ) : (
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{ height: 220, marginTop: 10 }}>
              {images.map((uri, idx) => {
                const imgSrc = uri.startsWith('data:') ? uri : `data:image/jpeg;base64,${uri}`;
                return (
                  <Image key={idx} source={{ uri: imgSrc }} style={{ width: 350, height: 220, borderRadius: 12, marginRight: 8 }} resizeMode="cover" />
                );
              })}
            </ScrollView>
          )
        )}
        <View className="p-6">
          {/* Donation Info Card */}
          <View className="bg-white rounded-xl p-4 mb-4 shadow">
            <Text className="text-2xl font-rubik-bold text-gray-900 mb-2">{details.Details}</Text>
            <Text className="text-gray-600 mb-4">{details.Instructions}</Text>
            <View className="flex-row items-center mb-3">
              <MaterialIcons name="person" size={20} color="#6B7280" />
              <Text className="text-gray-700 ml-2">{details.Name}</Text>
            </View>
            <View className="flex-row items-center mb-3">
              <MaterialIcons name="phone" size={20} color="#6B7280" />
              <Text className="text-gray-700 ml-2">{details.Contact}</Text>
            </View>
            <View className="flex-row items-center mb-3">
              <MaterialIcons name="info" size={20} color="#16A34A" />
              <Text className="text-green-600 ml-2">Quantity: {details.Quantity}</Text>
            </View>
            <View className="flex-row items-center mb-3">
              <MaterialIcons name="restaurant" size={20} color="#16A34A" />
              <Text className="text-green-600 ml-2">Producing: {details.Producing}</Text>
            </View>
            <View className="flex-row items-center mb-3">
              <MaterialIcons name="timer-off" size={20} color="#DC2626" />
              <Text className="text-red-600 ml-2">Lasting: {details.Lasting}</Text>
            </View>
            {distance !== null && (
              <View className="flex-row items-center mb-3">
                <MaterialIcons name="directions" size={20} color="#f97316" />
                <Text className="text-orange-600 ml-2">{distance.toFixed(2)} km from you</Text>
              </View>
            )}
          </View>
          {/* Map Section */}
          <View className="bg-white rounded-xl p-4 mb-4 shadow">
            <Text className="font-rubik-bold text-gray-900 mb-3">Locations Map</Text>
            <View style={{ width: '100%', height: 220, borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
              {mapLoading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator size="large" color="#f97316" />
                </View>
              ) : (
                <MapView
                  style={{ flex: 1 }}
                  initialRegion={{
                    latitude: mapCoords.donor?.latitude || mapCoords.receiver?.latitude || 23.8103,
                    longitude: mapCoords.donor?.longitude || mapCoords.receiver?.longitude || 90.4125,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                  }}
                >
                  {mapCoords.donor && (
                    <Marker
                      coordinate={mapCoords.donor}
                      pinColor="#f97316"
                      title="Donor"
                      description={details.Name}
                    />
                  )}
                  {mapCoords.receiver && (
                    <Marker
                      coordinate={mapCoords.receiver}
                      pinColor="#6366f1"
                      title="NGO / Receiver"
                      description={receiver?.name}
                    />
                  )}
                  {mapCoords.volunteer && (
                    <Marker
                      coordinate={mapCoords.volunteer}
                      pinColor="#16a34a"
                      title="You (Volunteer)"
                      description="Your Location"
                    />
                  )}
                </MapView>
              )}
            </View>
            {/* Map Legend */}
            <View className="flex-row items-center mb-2 space-x-4">
              <View className="flex-row items-center"><View style={{ width: 12, height: 12, backgroundColor: '#f97316', borderRadius: 6, marginRight: 4 }} /><Text className="text-xs text-gray-700">Donor</Text></View>
              <View className="flex-row items-center"><View style={{ width: 12, height: 12, backgroundColor: '#6366f1', borderRadius: 6, marginRight: 4 }} /><Text className="text-xs text-gray-700">NGO</Text></View>
              <View className="flex-row items-center"><View style={{ width: 12, height: 12, backgroundColor: '#16a34a', borderRadius: 6, marginRight: 4 }} /><Text className="text-xs text-gray-700">You</Text></View>
            </View>
          </View>
          {/* Requirements Card */}
          <View className="bg-white rounded-xl p-4 mb-4 shadow">
            <Text className="font-rubik-bold text-gray-900 mb-3">Types / Requirements</Text>
            {requirements.map((req, idx) => (
              <View key={idx} className="flex-row items-center mb-2">
                <MaterialIcons name="check-circle" size={20} color="#16A34A" />
                <Text className="text-gray-600 ml-2">{req}</Text>
              </View>
            ))}
            {requirements.length === 0 && <Text className="text-gray-500">No requirements.</Text>}
          </View>
          {/* Receiver Info Card - styled like donation info */}
          {receiver && (
            <View className="bg-white rounded-xl p-4 mb-6 shadow">
              <Text className="text-2xl font-rubik-bold text-indigo-900 mb-2">{receiver.name}</Text>
              <Text className="text-gray-600 mb-4">{receiver.type}</Text>
              <View className="flex-row items-center mb-3">
                <MaterialIcons name="person" size={20} color="#6366f1" />
                <Text className="text-gray-700 ml-2">Contact: {receiver.contact_person}</Text>
              </View>
              <View className="flex-row items-center mb-3">
                <MaterialIcons name="phone" size={20} color="#6366f1" />
                <Text className="text-gray-700 ml-2">{receiver.phone}</Text>
              </View>
              <View className="flex-row items-center mb-3">
                <MaterialIcons name="email" size={20} color="#6366f1" />
                <Text className="text-gray-700 ml-2">{receiver.email}</Text>
              </View>
              <View className="flex-row items-center mb-3">
                <MaterialIcons name="location-on" size={20} color="#6366f1" />
                <Text className="text-gray-700 ml-2">{receiver.location}</Text>
              </View>
              <View className="flex-row items-center mb-3">
                <MaterialIcons name="area-chart" size={20} color="#6366f1" />
                <Text className="text-gray-700 ml-2">Areas: {receiver.areas}</Text>
              </View>
              <View className="flex-row items-center mb-3">
                <MaterialIcons name="groups" size={20} color="#6366f1" />
                <Text className="text-gray-700 ml-2">Capacity: {receiver.capacity}</Text>
              </View>
              <View className="flex-row items-center mb-3">
                <MaterialIcons name="badge" size={20} color="#6366f1" />
                <Text className="text-gray-500 ml-2">Reg#: {receiver.registration}</Text>
              </View>
              {receiver.image_url ? (
                <Image source={{ uri: receiver.image_url }} style={{ width: '100%', height: 180, borderRadius: 12, marginTop: 10 }} resizeMode="cover" />
              ) : null}
            </View>
          )}
        </View>
      </ScrollView>
      {details.status === 'volunteer is assigned' || details.volunteer_id ? (
        <View className="bg-yellow-100 border border-yellow-300 rounded-xl p-4 mb-6">
          <Text className="text-yellow-800 font-bold text-center">
            This donation is already assigned to a volunteer.
          </Text>
        </View>
      ) : (
        <View className="bg-white px-6 py-4 border-t border-gray-200">
          <View className="flex-row space-x-4">
            <TouchableOpacity onPress={handleDecline} className="flex-1 py-3 border border-gray-300 rounded-xl">
              <Text className="text-gray-700 text-center font-rubik-medium">Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAccept}
              disabled={loading}
              className="flex-1 py-3 bg-green-500 rounded-xl"
            >
              <Text className="text-white text-center font-rubik-medium">
                {loading ? 'Accepting...' : 'Accept'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
