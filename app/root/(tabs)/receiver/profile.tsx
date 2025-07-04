import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, Alert, ImageBackground, Dimensions } from 'react-native';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../../../constants/supabaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

export default function ReceiverProfile() {
  const router = useRouter();
  const [receiver, setReceiver] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRequests: 0,
    completedRequests: 0,
    pendingRequests: 0,
    totalDonations: 0,
  });

  useEffect(() => {
    const fetchReceiverData = async () => {
      setLoading(true);
      try {
        const userEmail = await AsyncStorage.getItem("userEmail");
        if (!userEmail) {
          Alert.alert('Error', 'No user email found');
          return;
        }

        // Get receiver info by email
        const { data, error } = await supabase
          .from('receiver')
          .select('*')
          .eq('email', userEmail)
          .single();

        if (error) throw error;
        setReceiver(data);

        // Fetch statistics
        const { count: totalRequests } = await supabase
          .from('donation')
          .select('id', { count: 'exact', head: true })
          .eq('receiver_id', data.id);

        const { count: completedRequests } = await supabase
          .from('donation')
          .select('id', { count: 'exact', head: true })
          .eq('receiver_id', data.id)
          .eq('status', 'delivered the food');

        const { count: pendingRequests } = await supabase
          .from('donation')
          .select('id', { count: 'exact', head: true })
          .eq('receiver_id', data.id)
          .in('status', ['pending', 'approved', 'approvedF']);

        setStats({
          totalRequests: totalRequests || 0,
          completedRequests: completedRequests || 0,
          pendingRequests: pendingRequests || 0,
          totalDonations: totalRequests || 0,
        });

      } catch (error) {
        console.error('Error fetching receiver data:', error);
        Alert.alert('Error', 'Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchReceiverData();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            await supabase.auth.signOut();
            router.replace('/root/(tabs)/login');
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    router.push('./edit-profile');
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#F97316" />
        <Text className="text-gray-600 mt-4">Loading profile...</Text>
      </View>
    );
  }

  if (!receiver) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <MaterialIcons name="error" size={48} color="#DC2626" />
        <Text className="text-red-600 mt-4 text-lg">Profile not found</Text>
      </View>
    );
  }

  // Prepare image
  let imageUri = receiver.image_url;
  if (imageUri && !imageUri.startsWith('data:image') && !imageUri.startsWith('http')) {
    imageUri = `data:image/jpeg;base64,${imageUri}`;
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1">
        {/* Subtle Gradient Background at Top */}
        <LinearGradient
          colors={['#fff7ed', '#fbbf24', '#fff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 180, zIndex: 0 }}
        />

        {/* Profile Card - Card Stack Layout */}
        <View style={{ marginHorizontal: 24, marginTop: 80, marginBottom: 32, backgroundColor: '#fff', borderRadius: 24, paddingTop: 70, paddingBottom: 24, paddingHorizontal: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2, alignItems: 'center', position: 'relative', zIndex: 2 }}>
          {/* Profile Image Overlapping Card - Robust Centering */}
          <View style={{ position: 'absolute', top: -60, left: 0, right: 0, alignItems: 'center', zIndex: 3 }}>
            <Image
              source={imageUri ? { uri: imageUri } : require('@/assets/images/avatar.png')}
              style={{ width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#f97316', backgroundColor: '#fff' }}
            />
            <TouchableOpacity onPress={handleEditProfile} style={{ position: 'absolute', bottom: 8, right: 8, backgroundColor: '#fff', borderRadius: 20, padding: 8, shadowColor: '#f97316', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 }}>
              <MaterialIcons name="edit" size={20} color="#f97316" />
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 4, marginTop: 8, textAlign: 'center' }}>{receiver.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 2, marginBottom: 6, alignSelf: 'center' }}>
            <MaterialIcons name="verified" size={18} color="#fbbf24" />
            <Text style={{ color: '#f97316', fontWeight: '700', marginLeft: 6, textTransform: 'capitalize' }}>{receiver.type}</Text>
          </View>
          <Text style={{ color: '#64748b', fontSize: 14, fontStyle: 'italic', textAlign: 'center', marginBottom: 8 }}>
            "Together, we can end hunger."
          </Text>
        </View>

        {/* Impact Stats - Card Style */}
        <View style={{ marginHorizontal: 24, marginBottom: 24, backgroundColor: '#fff', borderRadius: 20, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <MaterialIcons name="list" size={20} color="#f97316" />
            <Text style={{ color: '#f97316', fontWeight: 'bold', fontSize: 18 }}>{stats.totalRequests}</Text>
            <Text style={{ color: '#64748b', fontSize: 12 }}>Total</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <MaterialIcons name="check-circle" size={20} color="#16a34a" />
            <Text style={{ color: '#16a34a', fontWeight: 'bold', fontSize: 18 }}>{stats.completedRequests}</Text>
            <Text style={{ color: '#64748b', fontSize: 12 }}>Completed</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <MaterialIcons name="hourglass-empty" size={20} color="#2563eb" />
            <Text style={{ color: '#2563eb', fontWeight: 'bold', fontSize: 18 }}>{stats.pendingRequests}</Text>
            <Text style={{ color: '#64748b', fontSize: 12 }}>Pending</Text>
          </View>
        </View>

        {/* Organization Information - Card Style */}
        <View style={{ marginHorizontal: 24, marginBottom: 24, backgroundColor: '#fff', borderRadius: 20, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#f97316', marginBottom: 10 }}>Organization Information</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <MaterialIcons name="badge" size={20} color="#f97316" />
            <Text style={{ color: '#374151', fontSize: 15, marginLeft: 10 }}>Registration: <Text style={{ fontWeight: 'bold' }}>{receiver.registration || 'N/A'}</Text></Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <MaterialIcons name="person" size={20} color="#f97316" />
            <Text style={{ color: '#374151', fontSize: 15, marginLeft: 10 }}>Contact: <Text style={{ fontWeight: 'bold' }}>{receiver.contact_person || 'N/A'}</Text></Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <MaterialIcons name="phone" size={20} color="#f97316" />
            <Text style={{ color: '#374151', fontSize: 15, marginLeft: 10 }}>Phone: <Text style={{ fontWeight: 'bold' }}>{receiver.phone || 'N/A'}</Text></Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <MaterialIcons name="email" size={20} color="#f97316" />
            <Text style={{ color: '#374151', fontSize: 15, marginLeft: 10 }}>Email: <Text style={{ fontWeight: 'bold' }}>{receiver.email}</Text></Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <MaterialIcons name="groups" size={20} color="#f97316" />
            <Text style={{ color: '#374151', fontSize: 15, marginLeft: 10 }}>Capacity: <Text style={{ fontWeight: 'bold' }}>{receiver.capacity || 'N/A'}</Text></Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 0 }}>
            <MaterialIcons name="location-on" size={20} color="#f97316" />
            <Text style={{ color: '#374151', fontSize: 15, marginLeft: 10 }}>Location: <Text style={{ fontWeight: 'bold' }}>{receiver.location || 'N/A'}</Text></Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
            <MaterialIcons name="map" size={20} color="#f97316" />
            <Text style={{ color: '#374151', fontSize: 15, marginLeft: 10 }}>Areas: <Text style={{ fontWeight: 'bold' }}>{receiver.areas || 'N/A'}</Text></Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-rubik-bold text-gray-800 mb-4">Quick Actions</Text>
          
          <View className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <View className="space-y-3">
              <TouchableOpacity 
                onPress={handleEditProfile}
                className="flex-row items-center p-3 bg-orange-50 rounded-xl"
              >
                <View className="bg-orange-100 p-2 rounded-full">
                  <MaterialIcons name="edit" size={20} color="#F97316" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-gray-900 font-rubik-medium">Edit Profile</Text>
                  <Text className="text-gray-600 text-sm">Update your organization information</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => router.push('./notification')}
                className="flex-row items-center p-3 bg-blue-50 rounded-xl"
              >
                <View className="bg-blue-100 p-2 rounded-full">
                  <MaterialIcons name="notifications" size={20} color="#2563EB" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-gray-900 font-rubik-medium">Notifications</Text>
                  <Text className="text-gray-600 text-sm">View your notifications</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => router.push('./past_donat')}
                className="flex-row items-center p-3 bg-green-50 rounded-xl"
              >
                <View className="bg-green-100 p-2 rounded-full">
                  <MaterialIcons name="history" size={20} color="#16A34A" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-gray-900 font-rubik-medium">Donation History</Text>
                  <Text className="text-gray-600 text-sm">View your donation history</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => router.push('./All_News')}
                className="flex-row items-center p-3 bg-purple-50 rounded-xl"
              >
                <View className="bg-purple-100 p-2 rounded-full">
                  <MaterialIcons name="article" size={20} color="#9333EA" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-gray-900 font-rubik-medium">News & Updates</Text>
                  <Text className="text-gray-600 text-sm">Stay updated with latest news</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Account Settings */}
        <View className="px-6 mb-8">
          <Text className="text-lg font-rubik-bold text-gray-800 mb-4">Account Settings</Text>
          
          <View className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <View className="space-y-3">
              <TouchableOpacity 
                onPress={() => router.push('./settings')}
                className="flex-row items-center p-3 bg-gray-50 rounded-xl"
              >
                <View className="bg-gray-100 p-2 rounded-full">
                  <MaterialIcons name="settings" size={20} color="#6B7280" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-gray-900 font-rubik-medium">Settings</Text>
                  <Text className="text-gray-600 text-sm">Manage your account settings</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={handleLogout}
                className="flex-row items-center p-3 bg-red-50 rounded-xl"
              >
                <View className="bg-red-100 p-2 rounded-full">
                  <MaterialIcons name="logout" size={20} color="#DC2626" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-red-600 font-rubik-medium">Logout</Text>
                  <Text className="text-red-500 text-sm">Sign out of your account</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#DC2626" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
