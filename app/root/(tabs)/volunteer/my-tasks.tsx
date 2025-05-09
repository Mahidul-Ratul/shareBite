import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

interface Task {
  id: string;
  title: string;
  status: 'completed' | 'ongoing' | 'cancelled';
  date: string;
  meals: number;
  location: string;
  time: string;
}

export default function MyTasksScreen() {
  const tasks: Task[] = [
    {
      id: '1',
      title: 'Food Delivery to Community Center',
      status: 'completed',
      date: '2024-05-07',
      meals: 15,
      location: 'Community Center A',
      time: '3:30 PM'
    },
    // Add more tasks
  ];

  return (
    <View className="flex-1 bg-white">
      <LinearGradient
        colors={['#f97316', '#ea580c']}
        className="pt-12 pb-6 px-6"
      >
        <Text className="text-2xl font-rubik-bold text-white">My Tasks</Text>
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
              <View className={`bg-${task.status === 'completed' ? 'green' : task.status === 'ongoing' ? 'blue' : 'red'}-50 px-3 py-1 rounded-full`}>
                <Text className={`text-${task.status === 'completed' ? 'green' : task.status === 'ongoing' ? 'blue' : 'red'}-600 text-xs font-rubik-medium capitalize`}>
                  {task.status}
                </Text>
              </View>
            </View>
            <View className="h-px bg-gray-100 my-3" />
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-500">{task.date}</Text>
              <Text className="text-gray-500">{task.time}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}