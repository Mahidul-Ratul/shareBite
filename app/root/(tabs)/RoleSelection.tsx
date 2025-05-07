import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from "expo-router"; // Only use useRouter from expo-router

type RoleType = 'donor' | 'receiver' | 'volunteer' | null;

export default function RoleSelectionScreen() {
  const [selectedRole, setSelectedRole] = useState<RoleType>(null);
  const router = useRouter();

  const handleContinue = () => {
    if (selectedRole) {
        router.push(`../${selectedRole}/signup`);

        // No need to use Href here
    }
  };

  return (
    <SafeAreaView style={styles.container} className='bg-white pt-5'>
      <View className='flex items-center'>
              <View className="flex-row items-center">
                        <Image source={require("@/assets/images/images.jpeg")} className="w-10 h-10 mr-2" />
                        <Text className="text-3xl font-rubik-bold text-black-300">ShareBite</Text>
                      </View>
                      </View>

      <Text style={styles.title}>Choose Your Role: </Text>

      <View style={styles.optionsContainer}>
        <TouchableOpacity 
          style={[styles.optionButton, selectedRole === 'donor' && styles.selectedOption]}
          onPress={() => setSelectedRole('donor')}
        >
          <MaterialCommunityIcons name="food-turkey" size={32} color="#27AE60" />
          <Text style={styles.optionText}>Donor</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.optionButton, selectedRole === 'receiver' && styles.selectedOption]}
          onPress={() => setSelectedRole('receiver')}
        >
          <MaterialCommunityIcons name="hand-heart" size={32} color="#27AE60" />
          <Text style={styles.optionText}>Receiver</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.optionButton, selectedRole === 'volunteer' && styles.selectedOption]}
          onPress={() => setSelectedRole('volunteer')}
        >
          <MaterialCommunityIcons name="account-group" size={32} color="#27AE60" />
          <Text style={styles.optionText}>Volunteer</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.continueButton, !selectedRole && styles.disabledButton]}
        onPress={handleContinue}
        disabled={!selectedRole}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 1,
  },
  logo: {
    width: 70,
    height: 70,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#333',
    textAlign: 'center',
    paddingTop: 20,
  },
  optionsContainer: {
    gap: 16,
  },
  optionButton: {
    backgroundColor: '#FFF',
    paddingVertical: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
    alignItems: 'center',
    flexDirection: 'column',
    gap: 8,
  },
  selectedOption: {
    borderColor: '#27AE60',
    backgroundColor: '#E8F5E9',
  },
  optionText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
  },
  continueButton: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
    backgroundColor: '#27AE60',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#CCC',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});