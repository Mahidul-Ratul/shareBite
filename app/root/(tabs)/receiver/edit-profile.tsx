import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  ActivityIndicator,
  StyleSheet,
  Image
} from 'react-native';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../../constants/supabaseConfig';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

export default function EditProfile() {
  const [receiver, setReceiver] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [image, setImage] = useState<string | null>(null);

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    registration: '',
    contact_person: '',
    email: '',
    phone: '',
    location: '',
    areas: '',
    capacity: '',
    password: '',
    cpassword: ''
  });

  useEffect(() => {
    fetchReceiverData();
  }, []);

  const fetchReceiverData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/root/(tabs)/login');
        return;
      }

      const { data, error } = await supabase
        .from('receiver')
        .select('*')
        .eq('email', user.email)
        .single();

      if (error) throw error;

      if (data) {
        setReceiver(data);
        setFormData({
          name: data.name || '',
          type: data.type || '',
          registration: data.registration || '',
          contact_person: data.contact_person || '',
          email: data.email || '',
          phone: data.phone || '',
          location: data.location || '',
          areas: data.areas || '',
          capacity: data.capacity || '',
          password: '',
          cpassword: ''
        });
        setImage(data.image_url);
      }
    } catch (error) {
      console.error('Error fetching receiver data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].base64);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Institution name is required');
      return;
    }

    if (formData.password && formData.password !== formData.cpassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setSaving(true);
    try {
      const updateData: any = {
        name: formData.name,
        type: formData.type,
        registration: formData.registration,
        contact_person: formData.contact_person,
        phone: formData.phone,
        location: formData.location,
        areas: formData.areas,
        capacity: formData.capacity,
      };

      if (image) {
        updateData.image_url = image;
      }

      if (formData.password) {
        updateData.password = formData.password;
        updateData.cpassword = formData.cpassword;
      }

      const { error } = await supabase
        .from('receiver')
        .update(updateData)
        .eq('email', formData.email);

      if (error) throw error;

      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Profile Image */}
        <View style={styles.imageSection}>
          <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
            {image ? (
              <Image 
                source={{ uri: `data:image/jpeg;base64,${image}` }} 
                style={styles.profileImage} 
              />
            ) : (
              <View style={styles.defaultImage}>
                <FontAwesome5 name="building" size={40} color="#f97316" />
              </View>
            )}
            <View style={styles.editIcon}>
              <MaterialIcons name="edit" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.imageText}>Tap to change photo</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Institution Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({...formData, name: text})}
              placeholder="Enter institution name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Institution Type</Text>
            <TextInput
              style={styles.input}
              value={formData.type}
              onChangeText={(text) => setFormData({...formData, type: text})}
              placeholder="NGO, Charity, Madrasa, etc."
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Registration Number</Text>
            <TextInput
              style={styles.input}
              value={formData.registration}
              onChangeText={(text) => setFormData({...formData, registration: text})}
              placeholder="Enter registration number"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contact Person</Text>
            <TextInput
              style={styles.input}
              value={formData.contact_person}
              onChangeText={(text) => setFormData({...formData, contact_person: text})}
              placeholder="Enter contact person name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={formData.email}
              editable={false}
              placeholder="Email (cannot be changed)"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => setFormData({...formData, phone: text})}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={formData.location}
              onChangeText={(text) => setFormData({...formData, location: text})}
              placeholder="Enter location/address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Service Areas</Text>
            <TextInput
              style={styles.input}
              value={formData.areas}
              onChangeText={(text) => setFormData({...formData, areas: text})}
              placeholder="Enter service areas"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Capacity</Text>
            <TextInput
              style={styles.input}
              value={formData.capacity}
              onChangeText={(text) => setFormData({...formData, capacity: text})}
              placeholder="Enter capacity"
              keyboardType="numeric"
            />
          </View>

          <Text style={styles.sectionTitle}>Change Password (Optional)</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              value={formData.password}
              onChangeText={(text) => setFormData({...formData, password: text})}
              placeholder="Enter new password"
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              value={formData.cpassword}
              onChangeText={(text) => setFormData({...formData, cpassword: text})}
              placeholder="Confirm new password"
              secureTextEntry
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff7ed',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#f97316',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  saveButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  imageSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  defaultImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f97316',
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#f97316',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageText: {
    fontSize: 14,
    color: '#64748b',
  },
  formSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    marginTop: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  disabledInput: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
  },
}); 