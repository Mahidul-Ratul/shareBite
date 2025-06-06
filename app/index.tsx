import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import Swiper from "react-native-swiper";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { supabase } from '../constants/supabaseConfig';

const { width } = Dimensions.get('window');

export default function Index() {
  const router = useRouter();
  const [stories, setStories] = useState<{ id: any; title: any; news: any; picture: any; created_at: any; tag:any; }[]>([]);

  // Static image imports
  const sliderImages = [
    require('@/assets/images/second.jpg'),
    require('@/assets/images/COVID.jpeg'),
    require('@/assets/images/third.jpg')
  ];

  const impactStories = [
    {
      image: require('@/assets/images/istockphoto-1478316232-612x612.jpg'),
      title: "500+ meals distributed",
      desc: "Supporting local shelters"
    },
    {
      image: require('@/assets/images/hasi.jpg'),
      title: "Children's Food Program",
      desc: "Helping underprivileged kids"
    },
    {
      image: require('@/assets/images/food.jpg'),
      title: "Holiday Food Drive",
      desc: "Community support initiative"
    }
  ];

  const features = [
    {
      icon: "handshake-o",
      title: "Connect",
      description: "Bridge the gap between surplus food and those in need"
    },
    {
      icon: "heart",
      title: "Share",
      description: "Make a difference by sharing your excess food"
    },
    {
      icon: "users",
      title: "Community",
      description: "Join a network of caring individuals and organizations"
    },
    {
      icon: "clock",
      title: "Real-time",
      description: "Instant updates and tracking of your food donations"
    }
  ];

  useEffect(() => {
    fetchLatestNews();
  }, []);

  const fetchLatestNews = async () => {
    const { data, error } = await supabase
      .from('news')
      .select('id, title, news, picture, created_at,tag')
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) {
      console.error('Error fetching news:', error);
    } else {
      setStories(data);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      {/* Image Slider with Overlay */}
      <View className="h-80 relative">
        <Swiper 
          showsPagination 
          autoplay 
          dotColor="rgba(255,255,255,0.5)"
          activeDotColor="white"
          autoplayTimeout={4}
        >
          {sliderImages.map((image, index) => (
            <View key={index} className="relative">
              <Image 
                source={image}
                className="w-full h-80" 
                resizeMode="cover"
              />
              <View className="absolute inset-0 bg-black/40" />
            </View>
          ))}
        </Swiper>
        
        {/* Floating Logo Section */}
        <View className="absolute bottom-0 left-0 right-0 items-center -mb-12">
          <View className="bg-white px-6 py-5 rounded-3xl  shadow-xl mx-4 w-11/12 border border-green-500">
          <View className="flex-row items-center justify-center mb-2">
              <Image 
                source={require("@/assets/images/images.jpeg")} 
                className="w-12 h-12 rounded-xl mr-3" 
              />
              <Text className="text-3xl font-rubik-bold text-gray-800">ShareBite</Text>
            </View>
            <Text className="text-base text-center font-rubik text-gray-600">
              Help those in need by donating excess food
            </Text>
          </View>
        </View>
      </View>

      {/* Features Section */}
      <View className="mt-16 px-4 mb-8">
        <Text className="text-2xl font-rubik-bold text-gray-800 mb-6">Why Choose ShareBite?</Text>
        <View className="flex-row flex-wrap justify-between">
          {features.map((feature, index) => (
            <View 
              key={index} 
              className="bg-white rounded-2xl p-5 mb-4 shadow-md border border-gray-100" 
              style={{ width: width * 0.44 }}
            >
              <View className="bg-green-50 w-12 h-12 rounded-full items-center justify-center mb-3">
                <FontAwesome5 name={feature.icon} size={24} color="#16a34a" />
              </View>
              <Text className="text-lg font-rubik-bold text-gray-800 mb-2">
                {feature.title}
              </Text>
              <Text className="text-sm text-gray-600 leading-5">
                {feature.description}
              </Text>
              <TouchableOpacity className="flex-row items-center">
                  <Text className="text-green-600 text-sm font-rubik-medium mr-1">Read More</Text>
                  <MaterialIcons name="arrow-forward" size={14} color="#16a34a" />
                </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      {/* Recent Events Section */}
     <View className="px-4 mb-8">
      <Text className="text-2xl font-rubik-bold text-gray-800 mb-6">Recent Impact Stories</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        className="mb-3"
        decelerationRate="fast"
        snapToInterval={width * 0.65 + 16}
      >
        {stories.map((story, index) => (
          <View 
            key={story.id || index} 
            className="bg-white rounded-2xl shadow-md mr-4 overflow-hidden border border-gray-100"
            style={{ width: width * 0.65 }}
          >
            <View className="relative">
              <Image 
                source={{ uri: story.picture }} // Ensure it's a full URL
                className="w-full h-36" 
                resizeMode="cover"
              />
              <View className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
            </View>
            <View className="p-4">
              <Text className="text-lg font-rubik-bold text-gray-800 mb-1">
                {story.title}
              </Text>
              <View className="flex-row items-center mb-2">
                <MaterialIcons name="verified" size={14} color="#16a34a" />
                <Text className="text-green-600 text-xs ml-1 font-rubik-medium">
                 {story.tag}
                </Text>
              </View>
              <Text className="text-gray-600 text-sm leading-5 mb-2" numberOfLines={1}>
                {story.news}
              </Text>
              <TouchableOpacity className="flex-row items-center">
                <Text className="text-green-600 text-sm font-rubik-medium mr-1">Read More</Text>
                <MaterialIcons name="arrow-forward" size={14} color="#16a34a" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
        <TouchableOpacity 
      className="bg-green-50 rounded-2xl shadow-md mr-4 items-center justify-center border border-green-200"
      style={{ width: width * 0.65, height: 230 }}
      onPress={() => {
        // Replace with your actual navigation logic
        // For example: navigation.navigate('AllNews');
        console.log('Navigate to All News');
      }}
    >
      <MaterialIcons name="library-books" size={40} color="#16a34a" />
      <Text className="text-lg text-green-700 font-rubik-bold mt-2">View All News</Text>
      <Text className="text-sm text-green-600 font-rubik-medium mt-1 px-4 text-center">
        See more inspiring impact stories in our news archive.
      </Text>
    </TouchableOpacity>
      </ScrollView>
    </View>

      {/* Call to Action */}
      <View className="p-6 rounded-t-3xl">
        <Text className="text-2xl font-rubik-medium text-gray-800 text-center mb-2">
          Ready to Make a Difference?
        </Text>
        <Text className="text-center text-gray-600 mb-4 text-sm">
          Join our community of food donors and volunteers
        </Text>
        <View className="flex-row justify-center gap-3">
        <TouchableOpacity 
            className="bg-green-600 px-8 py-3 rounded-xl items-center shadow-sm" 
            onPress={() => router.push("../root/(tabs)/adminlogin")}
          > 
            <Text className="text-white font-rubik-bold">Admin Login</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="bg-green-600 px-8 py-3 rounded-xl items-center shadow-sm" 
            onPress={() => router.push("../root/(tabs)/login")}
          > 
            <Text className="text-white font-rubik-bold">Login</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="bg-white px-8 py-3 rounded-xl items-center border border-green-600" 
            onPress={() => router.push("../root/(tabs)/RoleSelection")}
          > 
            <Text className="text-green-600 font-rubik-bold">Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>


    </ScrollView>
  );
}

