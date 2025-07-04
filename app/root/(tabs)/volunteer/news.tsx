import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: string;
  image: string | number; // Accepts both static require and string uri
  category: string;
  author: string;
  readTime: string;
}

export default function NewsScreen() {
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', 'Initiative', 'Events', 'Success Stories', 'Updates'];
  const newsItems: NewsItem[] = [
    {
      id: '1',
      title: 'New Food Rescue Initiative Launches',
      content: 'Local restaurants and food banks join forces in a groundbreaking initiative to reduce food waste and feed more people in need...',
      date: '2024-05-08',
      image: require('@/assets/images/vol.jpg'),
      category: 'Initiative',
      author: 'Sarah Miller',
      readTime: '3 min read'
    },
    // Add more items as needed
  ];
  const filteredNews = activeCategory === 'All' ? newsItems : newsItems.filter(item => item.category === activeCategory);
  const { width } = Dimensions.get('window');

  return (
    <View className="flex-1 bg-gray-50">
      {/* Custom Header */}
      <View className="bg-white pt-12 pb-4 px-6 shadow-sm">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-2xl font-rubik-bold text-gray-900">Community News</Text>
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={24} color="#374151" />
          </TouchableOpacity>
        </View>
        {/* Categories */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="mt-2"
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              onPress={() => setActiveCategory(category)}
              className={`mr-3 px-4 py-2 rounded-full ${activeCategory === category ? 'bg-orange-500' : 'bg-gray-100'}`}
            >
              <Text className={`${activeCategory === category ? 'text-white' : 'text-gray-600'} font-rubik-medium`}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1">
        {/* Featured News */}
        {filteredNews.length > 0 && (
          <View className="px-6 py-4">
            <Text className="text-lg font-rubik-bold text-gray-800 mb-4">Featured</Text>
            <TouchableOpacity className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
              <Image 
                source={typeof filteredNews[0].image === 'string' ? { uri: filteredNews[0].image } : filteredNews[0].image}
                className="w-full h-48"
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)']}
                className="absolute bottom-0 left-0 right-0 h-24 justify-end p-4"
              >
                <Text className="text-white font-rubik-bold text-xl mb-1">
                  {filteredNews[0].title}
                </Text>
                <View className="flex-row items-center">
                  <Text className="text-white/80 text-xs mr-4">
                    {filteredNews[0].date}
                  </Text>
                  <Text className="text-white/80 text-xs">
                    {filteredNews[0].readTime}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
        {/* Latest News */}
        <View className="px-6">
          <Text className="text-lg font-rubik-bold text-gray-800 mb-4">Latest News</Text>
          {filteredNews.map(item => (
            <TouchableOpacity 
              key={item.id}
              className="flex-row bg-white rounded-xl shadow-sm mb-4 overflow-hidden"
            >
              <Image 
                source={typeof item.image === 'string' ? { uri: item.image } : item.image}
                className="w-24 h-24"
                resizeMode="cover"
              />
              <View className="flex-1 p-3">
                <View className="flex-row items-center mb-2">
                  <View className="bg-orange-50 px-2 py-1 rounded-full">
                    <Text className="text-orange-600 text-xs font-rubik-medium">
                      {item.category}
                    </Text>
                  </View>
                  <Text className="text-gray-500 text-xs ml-2">{item.readTime}</Text>
                </View>
                <Text className="text-gray-900 font-rubik-medium mb-1" numberOfLines={2}>
                  {item.title}
                </Text>
                <View className="flex-row items-center">
                  <MaterialIcons name="person" size={12} color="#6B7280" />
                  <Text className="text-gray-500 text-xs ml-1">{item.author}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}