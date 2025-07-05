import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, ActivityIndicator, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../../constants/supabaseConfig';
import { MaterialIcons } from '@expo/vector-icons';

const DonationDetails = () => {
  const { donation_id } = useLocalSearchParams();
  const [donation, setDonation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [volunteerData, setVolunteerData] = useState<any>(null);
  const [receiverData, setReceiverData] = useState<any>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const fetchDonation = async () => {
      setLoading(true);
      if (!donation_id) return;
      
      try {
        const { data, error } = await supabase
          .from('donation')
          .select('*')
          .eq('id', donation_id)
          .single();
        
        if (!error && data) {
          setDonation(data);
          
          // Fetch volunteer information if volunteer is assigned
          if (data?.volunteer_id) {
            const { data: volunteerData, error: volunteerError } = await supabase
              .from('volunteer')
              .select('*')
              .eq('id', data.volunteer_id)
              .single();
            if (!volunteerError) setVolunteerData(volunteerData);
          }
          
          // Fetch receiver information
          if (data?.ngo_id) {
            const { data: receiverData, error: receiverError } = await supabase
              .from('receiver')
              .select('*')
              .eq('id', data.ngo_id)
              .single();
            if (!receiverError) setReceiverData(receiverData);
          }
        }
      } catch (error) {
        console.error('Error fetching donation:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDonation();
  }, [donation_id]);

  const handleRateVolunteer = async () => {
    if (!volunteerData?.id) {
      Alert.alert('Error', 'Volunteer information not available.');
      return;
    }

    if (selectedRating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting.');
      return;
    }

    setLoading(true);
    try {
      const { data: currentVolunteer, error: fetchError } = await supabase
        .from('volunteer')
        .select('point')
        .eq('id', volunteerData.id)
        .single();

      if (fetchError) throw fetchError;

      const currentPoints = currentVolunteer?.point || 0;
      const newPoints = currentPoints + selectedRating;

      const { error: updateError } = await supabase
        .from('volunteer')
        .update({ point: newPoints })
        .eq('id', volunteerData.id);

      if (updateError) throw updateError;

      setHasRated(true);
      setShowRatingModal(false);
      setSelectedRating(0);

      Alert.alert('Rating Submitted', `Thank you for rating ${volunteerData.name} with ${selectedRating}/5 stars!`);

    } catch (error) {
      console.error('Error updating volunteer rating:', error);
      Alert.alert('Error', 'Failed to submit rating. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (status: string | null) => {
    if (!status) return { label: 'Pending', color: '#facc15' };
    if (status === 'delivered the food') return { label: 'Completed', color: '#22c55e' };
    if (status === 'receiver confirmed') return { label: 'Completed', color: '#22c55e' };
    return { label: 'In Progress', color: '#3b82f6' };
  };

  let images: string[] = [];
  if (donation?.Image) {
    try {
      images = typeof donation.Image === 'string' ? JSON.parse(donation.Image) : donation.Image;
      if (!Array.isArray(images)) images = [images];
    } catch {
      images = [donation.Image];
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 18, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f1f5f9' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <MaterialIcons name="arrow-back" size={26} color="#22223b" />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#22223b' }}>Donation Details</Text>
      </View>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      ) : donation ? (
        <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <View style={{ backgroundColor: getStatus(donation.status).color, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, marginRight: 10 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>{getStatus(donation.status).label}</Text>
              </View>
              <Text style={{ color: '#6b7280', fontSize: 13 }}>{donation.Producing ? new Date(donation.Producing).toLocaleString() : ''}</Text>
            </View>
            <Text style={styles.title}>{donation.Details}</Text>
            <Text style={styles.subtitle}>Type: <Text style={{ color: '#16a34a' }}>{donation.Types}</Text></Text>
            <Text style={styles.subtitle}>Quantity: <Text style={{ color: '#16a34a' }}>{donation.Quantity}</Text></Text>
            <Text style={styles.subtitle}>Instructions: <Text style={{ color: '#374151' }}>{donation.Instructions || 'N/A'}</Text></Text>
            <Text style={styles.subtitle}>Location: <Text style={{ color: '#374151' }}>{donation.Location}</Text></Text>
            <Text style={styles.subtitle}>Lasting Time: <Text style={{ color: '#374151' }}>{donation.Lasting ? new Date(donation.Lasting).toLocaleTimeString() : 'N/A'}</Text></Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 }}>
              {images.map((img, idx) => (
                <Image
                  key={idx}
                  source={{ uri: img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}` }}
                  style={{ width: 90, height: 90, borderRadius: 12, marginRight: 10, marginBottom: 10, backgroundColor: '#f1f5f9' }}
                  resizeMode="cover"
                />
              ))}
            </View>
          </View>

          {/* Volunteer Information */}
          {volunteerData && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Volunteer Information</Text>
              <View style={styles.infoRow}>
                <MaterialIcons name="person" size={20} color="#16a34a" />
                <Text style={styles.infoText}>{volunteerData.name || 'No name available'}</Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialIcons name="phone" size={20} color="#16a34a" />
                <Text style={styles.infoText}>{volunteerData.phone || 'No phone available'}</Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialIcons name="email" size={20} color="#16a34a" />
                <Text style={styles.infoText}>{volunteerData.email || 'No email available'}</Text>
              </View>
              {volunteerData.address && (
                <View style={styles.infoRow}>
                  <MaterialIcons name="location-on" size={20} color="#16a34a" />
                  <Text style={styles.infoText}>{volunteerData.address}</Text>
                </View>
              )}
              
                             {/* Rating Section - Show only if donation is completed and not rated yet */}
               {(donation?.status === 'receiver confirmed' || donation?.status === 'delivered the food') && !hasRated && (
                 <View style={styles.ratingSection}>
                   <Text style={styles.ratingText}>Rate this volunteer's service:</Text>
                   <TouchableOpacity
                     onPress={() => setShowRatingModal(true)}
                     style={styles.rateButton}
                   >
                     <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                       <MaterialIcons name="star" size={20} color="#fff" />
                       <Text style={styles.rateButtonText}>Rate Volunteer</Text>
                     </View>
                   </TouchableOpacity>
                 </View>
               )}
              
              {/* Show rating confirmation if already rated */}
              {hasRated && (
                <View style={styles.ratingSection}>
                  <View style={styles.ratingConfirmation}>
                    <MaterialIcons name="check-circle" size={20} color="#16a34a" />
                    <Text style={styles.ratingConfirmationText}>Thank you for rating!</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Receiver Information */}
          {receiverData && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Receiver Information</Text>
              <View style={styles.infoRow}>
                <MaterialIcons name="business" size={20} color="#6366f1" />
                <Text style={styles.infoText}>{receiverData.name || 'No name available'}</Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialIcons name="phone" size={20} color="#6366f1" />
                <Text style={styles.infoText}>{receiverData.phone || 'No phone available'}</Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialIcons name="email" size={20} color="#6366f1" />
                <Text style={styles.infoText}>{receiverData.email || 'No email available'}</Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialIcons name="location-on" size={20} color="#6366f1" />
                <Text style={styles.infoText}>{receiverData.location || 'No location available'}</Text>
              </View>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#dc2626', fontSize: 16 }}>Donation not found.</Text>
        </View>
      )}

      {/* Rating Modal */}
      <Modal
        visible={showRatingModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRatingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rate Volunteer</Text>
            <Text style={styles.modalSubtitle}>How would you rate {volunteerData?.name || 'Volunteer'}?</Text>
            
            {/* Star Rating */}
            <View style={styles.starContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setSelectedRating(star)}
                  style={styles.starButton}
                >
                  <MaterialIcons
                    name={star <= selectedRating ? "star" : "star-border"}
                    size={40}
                    color={star <= selectedRating ? "#fbbf24" : "#d1d5db"}
                  />
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Rating Text */}
            <Text style={styles.ratingDisplayText}>
              {selectedRating === 0 ? 'Select a rating' : `${selectedRating}/5 stars`}
            </Text>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={() => {
                  setShowRatingModal(false);
                  setSelectedRating(0);
                }}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRateVolunteer}
                style={[
                  styles.submitButton,
                  { backgroundColor: selectedRating > 0 ? '#fbbf24' : '#d1d5db' }
                ]}
                disabled={selectedRating === 0}
              >
                <Text style={[
                  styles.submitButtonText,
                  { color: selectedRating > 0 ? '#fff' : '#6b7280' }
                ]}>
                  Submit Rating
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 18, 
    padding: 18, 
    shadowColor: '#000', 
    shadowOpacity: 0.08, 
    shadowOffset: { width: 0, height: 4 }, 
    shadowRadius: 12, 
    elevation: 4, 
    marginBottom: 18 
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#22223b', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#374151', marginBottom: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#22223b', marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoText: { fontSize: 15, color: '#374151', marginLeft: 8, flex: 1 },
  ratingSection: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  ratingText: { fontSize: 14, color: '#6b7280', marginBottom: 8 },
  rateButton: { backgroundColor: '#fbbf24', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, alignSelf: 'flex-start' },
  rateButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  ratingConfirmation: { flexDirection: 'row', alignItems: 'center' },
  ratingConfirmationText: { color: '#16a34a', fontWeight: '600', marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 24, margin: 20, width: 320 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 8, color: '#22223b' },
  modalSubtitle: { fontSize: 16, textAlign: 'center', marginBottom: 24, color: '#6b7280' },
  starContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 24 },
  starButton: { alignItems: 'center', marginHorizontal: 4 },
  starText: { fontSize: 12, marginTop: 4, color: '#374151' },
  cancelButton: { backgroundColor: '#d1d5db', paddingVertical: 12, borderRadius: 8, flex: 1, marginRight: 8 },
  cancelButtonText: { textAlign: 'center', fontWeight: '600', color: '#374151' },
  ratingDisplayText: { textAlign: 'center', fontSize: 18, fontWeight: '600', marginBottom: 24, color: '#374151' },
  buttonContainer: { flexDirection: 'row', gap: 8 },
  submitButton: { paddingVertical: 12, borderRadius: 8, flex: 1, marginLeft: 8 },
  submitButtonText: { textAlign: 'center', fontWeight: '600' },
});

export default DonationDetails;
