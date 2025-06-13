import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, Modal, Dimensions, ActivityIndicator } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from '../../../../constants/supabaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth } = Dimensions.get('window');

export default function PastDonations() {
  const [selectedImages, setSelectedImages] = useState(null);
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDonation, setSelectedDonation] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'
  const router = useRouter();

  useEffect(() => {
    const fetchDonations = async () => {
      setLoading(true);
      const donorId = await AsyncStorage.getItem('userId');
      if (!donorId) {
        setDonations([]);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('donation')
        .select('*')
        .eq('donor_id', donorId)
        .order('Producing', { ascending: false });
      if (!error && data) setDonations(data);
      setLoading(false);
    };
    fetchDonations();
  }, []);

  // Group donations by month and year
  const groupedDonations = donations.reduce((groups: { [key: string]: any[] }, donation) => {
    const date = new Date(donation.Producing || donation.created_at);
    const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }
    groups[monthYear].push(donation);
    return groups;
  }, {});

  const getStatus = (status: string | null) => {
    if (!status) return { label: 'Pending', color: '#facc15' };
    if (status === 'delivered the food') return { label: 'Completed', color: '#22c55e' };
    return { label: 'In Progress', color: '#3b82f6' };
  };

  const renderListView = () => (
    <ScrollView className="flex-1">
      {Object.entries(groupedDonations).map(([monthYear, monthDonations]) => (
        <View key={monthYear} className="mb-4">
          <View className="bg-gray-100 px-4 py-2">
            <Text className="font-rubik-medium text-gray-700">{monthYear}</Text>
          </View>
          {monthDonations.map((donation) => {
            const statusObj = getStatus(donation.status);
            return (
              <TouchableOpacity
                key={donation.id}
                onPress={() => router.push({ pathname: './not_dt', params: { donation_id: donation.id } })}
                className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100"
              >
                <View className="flex-row items-center">
                  <View className="bg-green-100 p-2 rounded-full mr-3">
                    <MaterialIcons name="restaurant" size={20} color="#16a34a" />
                  </View>
                  <View>
                    <Text className="font-rubik-medium text-gray-800">{donation.Location}</Text>
                    <View className="flex-row items-center mt-1">
                      <MaterialIcons name="schedule" size={14} color="#6B7280" />
                      <Text className="text-xs text-gray-500 ml-1">{donation.Producing ? new Date(donation.Producing).toLocaleString() : ''}</Text>
                    </View>
                  </View>
                </View>
                <View style={{ backgroundColor: statusObj.color, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>{statusObj.label}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#6B7280" />
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <Text className="text-2xl font-rubik-bold text-gray-800">Past Donations</Text>
        <Text className="text-sm font-rubik text-gray-600">Track your previous contributions</Text>
      </View>
      {loading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#22c55e" /></View>
      ) : renderListView()}
      {/* Image viewer modal if needed */}
      {selectedImages && (
        <Modal
          visible={true}
          transparent={true}
          onRequestClose={() => setSelectedImages(null)}
        >
          <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
            <Image
              source={{ uri: selectedImages }}
              style={{ width: screenWidth * 0.8, height: screenWidth * 0.8 }}
              resizeMode="contain"
            />
            <TouchableOpacity
              onPress={() => setSelectedImages(null)}
              className="mt-4 bg-white px-4 py-2 rounded-full"
            >
              <Text className="text-gray-800">Close</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </View>
  );
}