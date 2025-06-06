import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

interface HistoryDetails {
  id: string;
  title: string;
  donorName: string;
  donorAddress: string;
  recipientName: string;
  recipientAddress: string;
  date: string;
  startTime: string;
  endTime: string;
  meals: number;
  status: 'completed' | 'cancelled';
  notes: string;
  images: string[];
  rating?: number;
  feedback?: string;
}

const DEMO_DETAILS: HistoryDetails = {
  id: '1',
  title: 'Food Pickup from Restaurant ABC',
  donorName: 'Restaurant ABC',
  donorAddress: '123 Main Street, City',
  recipientName: 'Community Center XYZ',
  recipientAddress: '456 Center Avenue, City',
  date: '2024-05-01',
  startTime: '2:00 PM',
  endTime: '2:45 PM',
  meals: 25,
  status: 'completed',
  notes: 'All meals were properly packaged and delivered on time. Temperature maintained throughout delivery.',
  images: [
    'https://picsum.photos/800/600',
    'https://picsum.photos/800/601'
  ],
  rating: 5,
  feedback: 'Excellent service! Very punctual and professional.'
};

export default function HistoryDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white pt-12 pb-4 px-6 shadow-sm">
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="mr-4"
          >
            <MaterialIcons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-rubik-bold text-gray-900">Delivery Details</Text>
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* Images */}
        <ScrollView 
          horizontal 
          pagingEnabled 
          className="h-48 bg-gray-100"
        >
          {DEMO_DETAILS.images.map((image, index) => (
            <Image 
              key={index}
              source={{ uri: image }}
              className="w-screen h-48"
              resizeMode="cover"
            />
          ))}
        </ScrollView>

        <View className="p-6">
          {/* Basic Info */}
          <View className="bg-white rounded-xl p-4 mb-4">
            <View className="flex-row justify-between items-start mb-4">
              <Text className="text-xl font-rubik-bold text-gray-900 flex-1 mr-2">
                {DEMO_DETAILS.title}
              </Text>
              <View className={`bg-${DEMO_DETAILS.status === 'completed' ? 'green' : 'red'}-100 px-3 py-1 rounded-full`}>
                <Text className={`text-${DEMO_DETAILS.status === 'completed' ? 'green' : 'red'}-600 text-xs font-rubik-medium capitalize`}>
                  {DEMO_DETAILS.status}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center mb-2">
              <MaterialIcons name="calendar-today" size={16} color="#6B7280" />
              <Text className="text-gray-600 ml-2">{DEMO_DETAILS.date}</Text>
            </View>

            <View className="flex-row items-center mb-2">
              <MaterialIcons name="schedule" size={16} color="#6B7280" />
              <Text className="text-gray-600 ml-2">
                {DEMO_DETAILS.startTime} - {DEMO_DETAILS.endTime}
              </Text>
            </View>

            <View className="flex-row items-center">
              <MaterialIcons name="restaurant" size={16} color="#16A34A" />
              <Text className="text-green-600 ml-2">{DEMO_DETAILS.meals} meals</Text>
            </View>
          </View>

          {/* Locations */}
          <View className="bg-white rounded-xl p-4 mb-4">
            <Text className="font-rubik-bold text-gray-900 mb-3">Pickup & Delivery</Text>
            
            <View className="mb-4">
              <Text className="text-gray-600 mb-1">From:</Text>
              <View className="flex-row items-start">
                <MaterialIcons name="location-on" size={20} color="#16A34A" />
                <View className="flex-1 ml-2">
                  <Text className="text-gray-900 font-rubik-medium">{DEMO_DETAILS.donorName}</Text>
                  <Text className="text-gray-600">{DEMO_DETAILS.donorAddress}</Text>
                </View>
              </View>
            </View>

            <View>
              <Text className="text-gray-600 mb-1">To:</Text>
              <View className="flex-row items-start">
                <MaterialIcons name="flag" size={20} color="#DC2626" />
                <View className="flex-1 ml-2">
                  <Text className="text-gray-900 font-rubik-medium">{DEMO_DETAILS.recipientName}</Text>
                  <Text className="text-gray-600">{DEMO_DETAILS.recipientAddress}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Notes */}
          {DEMO_DETAILS.notes && (
            <View className="bg-white rounded-xl p-4 mb-4">
              <Text className="font-rubik-bold text-gray-900 mb-2">Delivery Notes</Text>
              <Text className="text-gray-600">{DEMO_DETAILS.notes}</Text>
            </View>
          )}

          {/* Feedback */}
          {DEMO_DETAILS.rating && (
            <View className="bg-white rounded-xl p-4">
              <Text className="font-rubik-bold text-gray-900 mb-2">Feedback</Text>
              <View className="flex-row mb-2">
                {[...Array(5)].map((_, i) => (
                  <MaterialIcons 
                    key={i}
                    name="star"
                    size={20}
                    color={i < DEMO_DETAILS.rating! ? '#F59E0B' : '#D1D5DB'}
                  />
                ))}
              </View>
              {DEMO_DETAILS.feedback && (
                <Text className="text-gray-600">{DEMO_DETAILS.feedback}</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}