import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../../constants/supabaseConfig';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const STATUS_MAP = {
  pending: { color: '#FFD700', icon: 'hourglass-half', text: 'Pending Approval' },
  approved: { color: '#4F8EF7', icon: 'check-circle', text: 'Approved' },
  approvedF: { color: '#4F8EF7', icon: 'check-circle', text: 'Approved (Final)' },
  'volunteer is assigned': { color: '#00BFFF', icon: 'user-check', text: 'Volunteer Assigned' },
  'on the way to receive food': { color: '#FFA500', icon: 'car', text: 'Volunteer On The Way' },
  'food collected': { color: '#32CD32', icon: 'box', text: 'Food Collected' },
  'on the way to deliver food': { color: '#FFA500', icon: 'truck', text: 'Delivering Food' },
  'delivered the food': { color: '#20B2AA', icon: 'hand-holding-heart', text: 'Food Delivered' },
  completed: { color: '#228B22', icon: 'trophy', text: 'Completed' },
  cancelled: { color: '#B22222', icon: 'times-circle', text: 'Cancelled' },
  rejected: { color: '#B22222', icon: 'times-circle', text: 'Rejected' },
};

const getStatusBanner = (status: keyof typeof STATUS_MAP | string) => {
  const s = STATUS_MAP[status as keyof typeof STATUS_MAP] || STATUS_MAP['pending'];
  return (
    <View style={[styles.statusBanner, { backgroundColor: s.color + 'CC' }]}> {/* CC for opacity */}
      <FontAwesome5 name={s.icon} size={22} color="#fff" style={{ marginRight: 10 }} />
      <Text style={styles.statusText}>{s.text}</Text>
    </View>
  );
};

type InfoCardProps = {
  title: string;
  info: Record<string, string>;
  icon: React.ReactNode;
};

const InfoCard: React.FC<InfoCardProps> = ({ title, info, icon }) => (
  <View style={styles.infoCard}>
    <View style={styles.infoCardHeader}>
      {icon}
      <Text style={styles.infoCardTitle}>{title}</Text>
    </View>
    {Object.entries(info).map(([key, value]) => (
      <View key={key} style={styles.infoRow}>
        <Text style={styles.infoKey}>{key}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    ))}
  </View>
);

const ImageCarousel = ({ images }: { images?: string[] }) => {
  if (!images || images.length === 0) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
      {images.map((img, idx) => {
        let uri = img;
        if (!img.startsWith('data:image')) {
          uri = `data:image/jpeg;base64,${img}`;
        }
        return (
          <Image
            key={idx}
            source={{ uri }}
            style={styles.carouselImage}
            resizeMode="cover"
          />
        );
      })}
    </ScrollView>
  );
};

export default function DonationDetail() {
  const { id } = useLocalSearchParams();
  const [donation, setDonation] = useState<any>(null);
  const [volunteer, setVolunteer] = useState<any>(null);
  const [receiver, setReceiver] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Fetch donation
      const { data: donationData, error } = await supabase
        .from('donation')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return setLoading(false);
      setDonation(donationData);
      // Fetch volunteer if assigned
      if (donationData.volunteer_id) {
        const { data: volData } = await supabase
          .from('volunteer')
          .select('*')
          .eq('id', donationData.volunteer_id)
          .single();
        setVolunteer(volData);
      }
      // Fetch receiver (NGO) by ngo_id
      if (donationData.ngo_id) {
        const { data: recData } = await supabase
          .from('receiver')
          .select('*')
          .eq('id', donationData.ngo_id)
          .single();
        setReceiver(recData);
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F8EF7" />
      </View>
    );
  }
  if (!donation) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: '#B22222' }}>Donation not found.</Text>
      </View>
    );
  }

  // Images: donation.Image is a string (single base64 or comma-separated base64)
  let images: string[] = [];
  if (donation && donation.Image) {
    images = String(donation.Image)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  // Prepare info for cards (filter out empty fields)
  const donationInfo = donation && {
    'Details': donation.Details || '',
    'Type': donation.Types || '',
    'Quantity': donation.Quantity || '',
    'Instructions': donation.Instructions || '',
    'Location': donation.Location || '',
    'Producing Time': donation.Producing || '',
    'Lasting Time': donation.Lasting || '',
    'Donor Name': donation.Name || '',
    'Contact': donation.Contact || '',
  };
  const filteredDonationInfo = donationInfo
    ? Object.entries(donationInfo)
        .filter(([_, v]) => v && v !== 'null' && v !== 'undefined')
        .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {})
    : {};

  // Fetch volunteer if assigned
  const volunteerInfo = volunteer && {
    'Volunteer Name': volunteer.name,
    'Contact': volunteer.phone,
    Email: volunteer.email,
  };
  // Fetch receiver (NGO) if available
  const receiverInfo = receiver && {
    'NGO Name': receiver.name,
    'Contact': receiver.phone,
    Email: receiver.email,
    Address: receiver.address,
  };

  // Only show one info card: volunteer if assigned, else receiver
  let infoCard = null;
  if (volunteerInfo) {
    infoCard = (
      <InfoCard
        title="Assigned Volunteer"
        info={volunteerInfo}
        icon={<Ionicons name="person" size={22} color="#4F8EF7" style={{ marginRight: 8 }} />}
      />
    );
  } else if (receiverInfo) {
    infoCard = (
      <InfoCard
        title="Receiver (NGO)"
        info={receiverInfo}
        icon={<MaterialIcons name="groups" size={22} color="#4F8EF7" style={{ marginRight: 8 }} />}
      />
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Status Banner */}
      {getStatusBanner(donation.status)}
      {/* Image Carousel */}
      <ImageCarousel images={images} />
      {/* Donation Info Card */}
      <InfoCard
        title="Donation Details"
        info={filteredDonationInfo}
        icon={<FontAwesome5 name="utensils" size={22} color="#4F8EF7" style={{ marginRight: 8 }} />}
      />
      {/* Volunteer or Receiver Card */}
      {infoCard}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 0,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    margin: 16,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  carousel: {
    marginTop: 16,
    marginBottom: 8,
    paddingLeft: 16,
  },
  carouselImage: {
    width: 220,
    height: 140,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: '#e0e0e0',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    margin: 16,
    marginTop: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginLeft: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 2,
  },
  infoKey: {
    color: '#555',
    fontWeight: '600',
    fontSize: 15,
  },
  infoValue: {
    color: '#333',
    fontSize: 15,
    maxWidth: '60%',
    textAlign: 'right',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
});
