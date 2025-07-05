import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../../constants/supabaseConfig';

const STATUS_STEPS = [
  { key: 'receiver_collecting', label: 'On the way to collect' },
  { key: 'receiver_collected', label: 'Collected from donor' },
  { key: 'receiver_delivered', label: 'Delivered to receiver location' },
  { key: 'completed', label: 'Self-collection completed' },
];

export default function SelfCollectStatus() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [donation, setDonation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDonation = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('donation')
          .select('*')
          .eq('id', id)
          .single();
        if (error || !data) throw error || new Error('Donation not found');
        setDonation(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch donation');
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchDonation();
  }, [id]);

  const handleStatusUpdate = async (statusKey: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('donation')
        .update({ status: statusKey })
        .eq('id', id);
      if (error) throw error;
      setDonation((prev: any) => ({ ...prev, status: statusKey }));
      Alert.alert('Status Updated', `Donation status updated to: ${STATUS_STEPS.find(s => s.key === statusKey)?.label}`);
      if (statusKey === 'completed') {
        router.back();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text style={{ color: 'red' }}>{error}</Text>
      </View>
    );
  }

  if (!donation) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text>Donation not found.</Text>
      </View>
    );
  }

  // Find current step index
  const currentStepIdx = STATUS_STEPS.findIndex(s => s.key === donation.status);

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb', padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>Self-Collect Progress</Text>
      <Text style={{ fontSize: 16, marginBottom: 24 }}>Update the status as you collect and deliver the donation yourself.</Text>
      {STATUS_STEPS.map((step, idx) => (
        <View key={step.key} style={{ marginBottom: 16, opacity: idx <= currentStepIdx ? 0.5 : 1 }}>
          <TouchableOpacity
            disabled={idx <= currentStepIdx}
            style={{
              backgroundColor: idx === currentStepIdx + 1 ? '#f97316' : '#e5e7eb',
              padding: 16,
              borderRadius: 12,
              alignItems: 'center',
            }}
            onPress={() => handleStatusUpdate(step.key)}
          >
            <Text style={{ color: idx === currentStepIdx + 1 ? '#fff' : '#6b7280', fontWeight: 'bold' }}>{step.label}</Text>
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity
        style={{ marginTop: 32, alignItems: 'center' }}
        onPress={() => router.back()}
      >
        <Text style={{ color: '#2563eb', fontWeight: 'bold' }}>Back</Text>
      </TouchableOpacity>
    </View>
  );
} 