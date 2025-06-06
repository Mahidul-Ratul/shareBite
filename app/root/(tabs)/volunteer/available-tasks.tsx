import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';

interface Task {
  id: string;
  title: string;
  location: string;
  time: string;
  date: string;
  meals: number;
  distance: string;
  urgency: 'High' | 'Medium' | 'Low';
}

export default function AvailableTasksScreen() {
  const tasks: Task[] = [
    {
      id: '1',
      title: 'Food Pickup from Restaurant A',
      location: '123 Main St',
      time: '2:00 PM',
      date: '2024-05-08',
      meals: 25,
      distance: '2.5 km',
      urgency: 'High'
    },
    // Add more tasks
  ];

  return (
    <View className="flex-1 bg-white">
      <LinearGradient
        colors={['#f97316', '#ea580c']}
        className="pt-12 pb-6 px-6"
      >
        <Text className="text-2xl font-rubik-bold text-white">Available Tasks</Text>
      </LinearGradient>

      <ScrollView className="flex-1 px-4">
        {tasks.map(task => (
          <TouchableOpacity 
            key={task.id}
            className="bg-white rounded-xl shadow-sm mb-4 p-4 border border-gray-100"
          >
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="text-lg font-rubik-bold text-gray-800 mb-2">
                  {task.title}
                </Text>
                <View className="flex-row items-center mb-2">
                  <MaterialIcons name="location-on" size={16} color="#6B7280" />
                  <Text className="text-gray-600 ml-1">{task.location}</Text>
                </View>
                <View className="flex-row items-center">
                  <MaterialIcons name="restaurant" size={16} color="#16A34A" />
                  <Text className="text-green-600 ml-1">{task.meals} meals</Text>
                </View>
              </View>
              <View className={`bg-${task.urgency === 'High' ? 'red' : task.urgency === 'Medium' ? 'orange' : 'green'}-50 px-3 py-1 rounded-full`}>
                <Text className={`text-${task.urgency === 'High' ? 'red' : task.urgency === 'Medium' ? 'orange' : 'green'}-600 text-xs font-rubik-medium`}>
                  {task.urgency}
                </Text>
              </View>
            </View>
            <View className="h-px bg-gray-100 my-3" />
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-500">{task.date} • {task.time}</Text>
              <Text className="text-gray-500">{task.distance}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {/* Bottom Navigation */}
      <View className="flex-row justify-between items-center bg-white py-3 px-6 border-t border-gray-200 shadow-lg">
                    <Link href="./voldesh" asChild>
                      <TouchableOpacity className="items-center flex-1">
                        <View className="relative">
                          <FontAwesome5 name="home" size={24} color="#6B7280" />
                          <View className="absolute -top-1 -right-1 w-2 h-2  rounded-full" />
                        </View>
                        <Text className=" text-gray-600 text-xs mt-1 font-rubik-medium">Home</Text>
                      </TouchableOpacity>
                    </Link>
            
                    <Link href="./news" asChild>
                              <TouchableOpacity
                                className="items-center flex-1"
                                style={{ transform: [{ scale: 1 }] }}
                              >
                                <FontAwesome5 name="newspaper" size={24} color="#6B7280" />
                                <Text className="text-gray-600 text-xs mt-1 font-rubik-medium">News</Text>
                              </TouchableOpacity>
                            </Link>
            
                    <Link href="./available-tasks" asChild>
                      <TouchableOpacity className="items-center flex-1">
                        <View className="bg-orange-500 p-3 rounded-full -mt-8 border-4 border-white shadow-xl">
                          <FontAwesome5 name="plus" size={24} color="white" />
                        </View>
                        <Text className="text-gray-600 text-xs mt-1 font-rubik-medium">Tasks</Text>
                      </TouchableOpacity>
                    </Link>
            
                    <Link href="./my-tasks" asChild>
                      <TouchableOpacity
                        className="items-center flex-1"
                        style={{ transform: [{ scale: 1 }] }}
                      >
                        <View className="relative">
                          <FontAwesome5 name="history" size={24} color="#6B7280" />
                          <View className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full items-center justify-center">
                            <Text className="text-white text-xs font-bold">3</Text>
                          </View>
                        </View>
                        <Text className="text-gray-600 text-xs mt-1 font-rubik-medium">History</Text>
                      </TouchableOpacity>
                    </Link>
            
                    <Link href="./vol_pro" asChild>
                      <TouchableOpacity
                        className="items-center flex-1"
                        activeOpacity={0.7}
                      >
                        <FontAwesome5 name="user-circle" size={24} color="#6B7280" />
                        <Text className="text-gray-600 text-xs mt-1 font-rubik-medium">Profile</Text>
                      </TouchableOpacity>
                    </Link>
                  </View>
    </View>
    
  );
}