// /app/root/(tabs)/admin/dashboard.tsx

import React, { useEffect, useState } from 'react';
import { View, ScrollView, Dimensions, Alert, TouchableOpacity, Image } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Card, Title, Paragraph, Button, Text } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import { supabase } from '../../../../constants/supabaseConfig';
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';

const AdminDashboard = () => {
  const router = useRouter();
  console.log("AdminDashboard rendered");

  interface Donation {
    id: number;
    donor_id: number;
    recipient_id: number;
    amount: number;
    date: string;
    status: string;
  }

  interface User {
    id: number;
    name: string;
    email: string;
    created_at: string;
  }

  const [donations, setDonations] = useState<Donation[]>([]);
  const [donors, setDonors] = useState<User[]>([]);
  const [recipients, setRecipients] = useState<User[]>([]);

  const fetchData = async () => {
    try {
      const { data: donationsData, error: donationsError } = await supabase.from('donation').select('*');
      if (donationsError) console.error('Donations Error:', donationsError.message);
      setDonations(donationsData || []);

      const { data: donorsData, error: donorsError } = await supabase.from('users').select('*');
      if (donorsError) console.error('Donors Error:', donorsError.message);
      setDonors(donorsData || []);

      const { data: recipientsData, error: recipientsError } = await supabase.from('receiver').select('*');
      if (recipientsError) console.error('Recipients Error:', recipientsError.message);
      setRecipients(recipientsData || []);
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  useEffect(() => {
    // Subscribe to realtime changes in the `donation` table
    const subscription = supabase
      .channel('donation-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'donation' },
        (payload) => {
          console.log('Realtime event:', payload);
          if (payload.eventType === 'INSERT') {
            Alert.alert('New Donation', `A new donation has been posted by ${payload.new.Name}`);
          }
        }
      )
      .subscribe();

    // Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        data: [50, 100, 150, 200, 250, 200, 180, 220, 190, 270, 230, 260],
      },
    ],
  };

  const renderHeader = () => (
    <View>
      <LinearGradient
        colors={['#1e40af', '#3b82f6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-12 pb-24"
      >
        {/* Top Bar */}
        <View className="px-6 flex-row items-center justify-between">
        
        <View>
          <View className="flex-row items-center">
            <FontAwesome5 name="crown" size={20} color="#fbbf24" />
            <Text className="text-white/90 text-sm font-medium ml-2">Admin Portal</Text>
          </View>
          <Text className="text-white text-2xl font-bold mt-1">Welcome back, Admin!</Text>
          <Text className="text-white/90 text-sm">Here’s what’s happening with your donations today.</Text>
        </View>
           
          
          <View className="flex-row items-center space-x-3">
            <TouchableOpacity 
              className="w-10 h-10 bg-white/10 rounded-full items-center justify-center"
              onPress={fetchData}
            >
              <MaterialIcons name="refresh" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity 
              className="w-10 h-10 bg-white/10 rounded-full items-center justify-center"
              onPress={() => router.replace('/')}
            >
              <MaterialIcons name="logout" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Stats Cards - Overlapping the gradient */}
      <View className="px-6 -mt-16 flex-row space-x-4">
        <View className="flex-1 bg-white p-4 rounded-2xl shadow-lg">
          <View className="flex-row items-center justify-between mb-3">
            <View className="bg-blue-50 p-2 rounded-lg">
              <MaterialIcons name="attach-money" size={20} color="#3b82f6" />
            </View>
            <View className="bg-blue-50 px-2 py-1 rounded-lg">
              <Text className="text-blue-600 text-xs font-medium">Today</Text>
            </View>
          </View>
          <Text className="text-gray-600 text-sm">Total Donations</Text>
          <Text className="text-2xl font-bold text-gray-900 mt-1">
            ${donations.reduce((sum, d) => sum + (d.amount || 0), 0).toLocaleString()}
          </Text>
          <View className="flex-row items-center mt-2">
            <MaterialIcons name="trending-up" size={16} color="#16a34a" />
            <Text className="text-green-600 text-xs ml-1">+12.5% from yesterday</Text>
          </View>
        </View>

        <View className="flex-1 bg-white p-4 rounded-2xl shadow-lg">
          <View className="flex-row items-center justify-between mb-3">
            <View className="bg-indigo-50 p-2 rounded-lg">
              <MaterialIcons name="groups" size={20} color="#4f46e5" />
            </View>
            <View className="bg-indigo-50 px-2 py-1 rounded-lg">
              <Text className="text-indigo-600 text-xs font-medium">Active</Text>
            </View>
          </View>
          <Text className="text-gray-600 text-sm">Total Users</Text>
          <Text className="text-2xl font-bold text-gray-900 mt-1">
            {(donors.length + recipients.length).toLocaleString()}
          </Text>
          <View className="flex-row items-center mt-2">
            <MaterialIcons name="people" size={16} color="#4f46e5" />
            <Text className="text-indigo-600 text-xs ml-1">{donors.length} donors</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderStats = () => (
    <View className="px-6 mt-8">
      <View className="flex-row flex-wrap justify-between">
        <TouchableOpacity className="w-[47%] bg-white rounded-2xl p-4 shadow-sm mb-4">
          <View className="bg-emerald-100 self-start p-3 rounded-xl mb-2">
            <MaterialIcons name="volunteer-activism" size={24} color="#059669" />
          </View>
          <Text className="text-3xl font-bold text-gray-800">{donations.length}</Text>
          <Text className="text-sm text-gray-500 mt-1">Total Donations</Text>
          <View className="flex-row items-center mt-2">
            <MaterialIcons name="trending-up" size={16} color="#059669" />
            <Text className="text-xs text-emerald-600 ml-1">+12.5% this week</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity className="w-[47%] bg-white rounded-2xl p-4 shadow-sm mb-4">
          <View className="bg-blue-100 self-start p-3 rounded-xl mb-2">
            <MaterialIcons name="people" size={24} color="#3b82f6" />
          </View>
          <Text className="text-3xl font-bold text-gray-800">{donors.length}</Text>
          <Text className="text-sm text-gray-500 mt-1">Active Donors</Text>
          <View className="flex-row items-center mt-2">
            <MaterialIcons name="trending-up" size={16} color="#3b82f6" />
            <Text className="text-xs text-blue-600 ml-1">+5.2% this month</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity className="w-[47%] bg-white rounded-2xl p-4 shadow-sm mb-4">
          <View className="bg-orange-100 self-start p-3 rounded-xl mb-2">
            <MaterialIcons name="favorite" size={24} color="#ea580c" />
          </View>
          <Text className="text-3xl font-bold text-gray-800">{recipients.length}</Text>
          <Text className="text-sm text-gray-500 mt-1">Recipients</Text>
          <View className="flex-row items-center mt-2">
            <MaterialIcons name="trending-up" size={16} color="#ea580c" />
            <Text className="text-xs text-orange-600 ml-1">+3.8% this week</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity className="w-[47%] bg-white rounded-2xl p-4 shadow-sm mb-4">
          <View className="bg-purple-100 self-start p-3 rounded-xl mb-2">
            <MaterialIcons name="trending-up" size={24} color="#7c3aed" />
          </View>
          <Text className="text-3xl font-bold text-gray-800">98%</Text>
          <Text className="text-sm text-gray-500 mt-1">Success Rate</Text>
          <View className="flex-row items-center mt-2">
            <MaterialIcons name="trending-up" size={16} color="#7c3aed" />
            <Text className="text-xs text-purple-600 ml-1">+1.2% this month</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderChart = () => (
    <View className="mx-6 mt-4 bg-white p-6 rounded-2xl shadow-sm">
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-lg font-bold text-gray-800">Donation Trends</Text>
        <View className="flex-row items-center space-x-2">
          <TouchableOpacity className="bg-blue-50 px-3 py-1 rounded-lg">
            <Text className="text-blue-600 text-sm">Weekly</Text>
          </TouchableOpacity>
          <TouchableOpacity className="px-3 py-1">
            <Text className="text-gray-400 text-sm">Monthly</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 20 }}
      >
        <LineChart
          data={chartData}
          width={1000} // Fixed width to show all months
          height={220}
          yAxisLabel="$"
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
            labelColor: () => '#64748b',
            style: { borderRadius: 16 },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: '#3b82f6'
            },
            propsForLabels: {
              fontSize: 12,
            }
          }}
          bezier
          style={{
            borderRadius: 16,
            paddingRight: 0
          }}
          withDots={true}
          withShadow={true}
          withInnerLines={true}
          withOuterLines={false}
          withVerticalLabels={true}
          withHorizontalLabels={true}
          fromZero={true}
        />
      </ScrollView>

      {/* Add legend or summary below chart */}
      <View className="flex-row justify-between mt-4 pt-4 border-t border-gray-100">
        <View>
          <Text className="text-xs text-gray-500">Total Donations</Text>
          <Text className="text-lg font-bold text-gray-800 mt-1">
            ${chartData.datasets[0].data.reduce((a, b) => a + b, 0).toLocaleString()}
          </Text>
        </View>
        <View>
          <Text className="text-xs text-gray-500">Highest Month</Text>
          <Text className="text-lg font-bold text-blue-600 mt-1">
            ${Math.max(...chartData.datasets[0].data).toLocaleString()}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderQuickActions = () => (
    <View className="p-6">
      <Text className="text-lg font-bold text-gray-800 mb-4">Quick Actions</Text>
      <View className="space-y-3">
        { [
          { title: 'Manage Donations', icon: 'volunteer-activism' as const, color: '#059669', route: './manage-donations' },
          { title: 'Manage Users', icon: 'people' as const, color: '#3b82f6', route: './manage-users' },
          { title: 'View Reports', icon: 'insert-chart' as const, color: '#8b5cf6', route: './reports' },
          { title: 'Settings', icon: 'settings' as const, color: '#f59e0b', route: './settings' }
        ].map((action, index) => (
          <TouchableOpacity
            key={index}
            className="bg-white p-4 rounded-xl flex-row items-center shadow-sm"
            onPress={() => router.push(action.route as any)}
          >
            <View style={{ backgroundColor: `${action.color}15` }} className="p-3 rounded-xl">
              <MaterialIcons name={action.icon} size={24} color={action.color} />
            </View>
            <View className="flex-1 ml-4">
              <Text className="font-semibold text-gray-800">{action.title}</Text>
              <Text className="text-gray-400 text-xs mt-1">Manage and view details</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#94a3b8" />
          </TouchableOpacity>
        )) }
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {renderHeader()}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {renderChart()}
        {renderStats()}
        
        {renderQuickActions()}
      </ScrollView>

      {/* Bottom Navigation */}
      <View className="flex-row justify-between items-center bg-white py-3 px-6 border-t border-gray-200">
        <Link href="/root/(tabs)/admin/dashboard" asChild>
          <TouchableOpacity className="items-center flex-1">
            <MaterialIcons name="dashboard" size={24} color="#376abd" />
            <Text className="text-[#376abd] text-xs mt-1 font-medium">Dashboard</Text>
          </TouchableOpacity>
        </Link>

        <Link href="./manage-donations" asChild>
          <TouchableOpacity className="items-center flex-1">
            <MaterialIcons name="volunteer-activism" size={24} color="#64748b" />
            <Text className="text-gray-500 text-xs mt-1 font-medium">Donations</Text>
          </TouchableOpacity>
        </Link>

        <Link href="./manage-users" asChild>
          <TouchableOpacity className="items-center flex-1">
            <MaterialIcons name="people" size={24} color="#64748b" />
            <Text className="text-gray-500 text-xs mt-1 font-medium">Users</Text>
          </TouchableOpacity>
        </Link>

        <Link href="./notification" asChild>
            <TouchableOpacity className="items-center flex-1">
              <View className="relative">
                <Ionicons name="notifications-outline" size={24} color="#6B7280" />
                <View className="absolute -top-1 -right-1 bg-orange-500 w-4 h-4 rounded-full items-center justify-center">
                  <Text className="text-white text-xs font-rubik-bold">2</Text>
                </View>
              </View>
              <Text className="text-gray-600 text-xs mt-1 font-rubik-medium">Notifications</Text>
            </TouchableOpacity>
          </Link>

        <Link href="./settings" asChild>
          <TouchableOpacity className="items-center flex-1">
            <MaterialIcons name="settings" size={24} color="#64748b" />
            <Text className="text-gray-500 text-xs mt-1 font-medium">Settings</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
};

export default AdminDashboard;
