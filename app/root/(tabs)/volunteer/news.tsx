import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: string;
  image: any;
  category: string;
}

export default function NewsScreen() {
  const newsItems: NewsItem[] = [
    {
      id: '1',
      title: 'New Food Rescue Initiative',
      content: 'Local restaurants join forces to reduce food waste...',
      date: '2024-05-08',
      image: require('@/assets/images/vol.jpg'),
      category: 'Initiative'
    },
    // Add more news items
  ];

  return (
    <View className="flex-1 bg-white">
      <LinearGradient
        colors={['#f97316', '#ea580c']}
        className="pt-12 pb-6 px-6"
      >
        <Text className="text-2xl font-rubik-bold text-white">Latest Updates</Text>
      </LinearGradient>

      <ScrollView className="flex-1 px-4">
        {newsItems.map(item => (
          <TouchableOpacity 
            key={item.id}
            className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden border border-gray-100"
          >
            <Image 
              source={item.image}
              className="w-full h-48"
              resizeMode="cover"
            />
            <View className="p-4">
              <View className="flex-row justify-between items-center mb-2">
                <View className="bg-orange-50 px-3 py-1 rounded-full">
                  <Text className="text-orange-600 text-xs font-rubik-medium">
                    {item.category}
                  </Text>
                </View>
                <Text className="text-gray-500 text-xs">{item.date}</Text>
              </View>
              <Text className="text-lg font-rubik-bold text-gray-800 mb-2">
                {item.title}
              </Text>
              <Text className="text-gray-600 text-sm">{item.content}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}