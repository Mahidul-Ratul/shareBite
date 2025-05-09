import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

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
    </View>
  );
}