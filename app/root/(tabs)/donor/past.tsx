import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, Modal, Dimensions } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const { width: screenWidth } = Dimensions.get('window');

export default function PastDonations() {
  const [selectedImages, setSelectedImages] = useState(null);
  interface Donation {
    id: number;
    date: string;
    location: string;
    time: string;
  }
  
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'

  // Group donations by month and year
  // Sample donations data
    const donations = [
      { id: 1, date: '2023-10-01', location: 'Community Center', time: '10:00 AM' },
      { id: 2, date: '2023-10-15', location: 'Local Shelter', time: '2:00 PM' },
      { id: 3, date: '2023-09-20', location: 'Food Bank', time: '11:30 AM' },
    ];
  
    const groupedDonations = donations.reduce((groups: { [key: string]: typeof donations }, donation) => {
    const date = new Date(donation.date);
    const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }
    groups[monthYear].push(donation);
    return groups;
  }, {});

  const renderListView = () => (
    <ScrollView className="flex-1">
      {Object.entries(groupedDonations).map(([monthYear, monthDonations]) => (
        <View key={monthYear} className="mb-4">
          <View className="bg-gray-100 px-4 py-2">
            <Text className="font-rubik-medium text-gray-700">{monthYear}</Text>
          </View>
          
          {monthDonations.map((donation) => (
            <TouchableOpacity
              key={donation.id}
              onPress={() => {
                setSelectedDonation(donation);
                setViewMode('detail');
              }}
              className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100"
            >
              <View className="flex-row items-center">
                <View className="bg-green-100 p-2 rounded-full mr-3">
                  <MaterialIcons name="restaurant" size={20} color="#16a34a" />
                </View>
                <View>
                  <Text className="font-rubik-medium text-gray-800">{donation.location}</Text>
                  <View className="flex-row items-center mt-1">
                    <MaterialIcons name="schedule" size={14} color="#6B7280" />
                    <Text className="text-xs text-gray-500 ml-1">{donation.time}</Text>
                  </View>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#6B7280" />
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </ScrollView>
  );

  const renderDetailView = () => (
    <View className="flex-1">
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200">
        <TouchableOpacity 
          onPress={() => setViewMode('list')}
          className="mr-3"
        >
          <MaterialIcons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-rubik-medium text-gray-800">Donation Details</Text>
      </View>
      
      <ScrollView className="flex-1 px-4 py-4">
        {/* Existing donation detail card code */}
        <View className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* ... Your existing donation card content ... */}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <Text className="text-2xl font-rubik-bold text-gray-800">Past Donations</Text>
        <Text className="text-sm font-rubik text-gray-600">Track your previous contributions</Text>
      </View>

      {viewMode === 'list' ? renderListView() : renderDetailView()}

      {/* Keep your existing image viewer modal code */}
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