import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, TextInput, Text, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, Button } from 'react-native-paper';
import { supabase } from '../../../../constants/supabaseConfig';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const ManageUsers = () => {
  const [users, setUsers] = useState<{ id: string; fullName?: string; email?: string; phoneNumber?: string; address?: string }[]>([]);
  const [receivers, setReceivers] = useState<{ id: string; name?: string; email?: string; contact_person?: string; location?: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'receivers'>('users'); // Tab state

  // Fetch users from the "users" table
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      setUsers((data as { id: string; fullName?: string; email?: string; phoneNumber?: string; address?: string }[]) || []);
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  // Fetch receivers from the "receiver" table
  const fetchReceivers = async () => {
    try {
      const { data, error } = await supabase.from('receiver').select('*');
      if (error) throw error;
      setReceivers(data || []);
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  // Delete a user or receiver by ID
  const deleteItem = async (id: string, table: 'users' | 'receiver'): Promise<void> => {
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;

      if (table === 'users') {
        setUsers((prevUsers) => prevUsers.filter((user) => user.id !== id));
      } else {
        setReceivers((prevReceivers) => prevReceivers.filter((receiver) => receiver.id !== id));
      }

      Alert.alert('Success', `${table === 'users' ? 'User' : 'Receiver'} deleted successfully!`);
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchReceivers();
  }, []);

  // Filter data based on the active tab and search query
  const filteredData =
    activeTab === 'users'
      ? users.filter(
          (user) =>
            user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : receivers.filter(
          (receiver) =>
            receiver.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            receiver.email?.toLowerCase().includes(searchQuery.toLowerCase())
        );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1e293b', '#334155']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Title style={styles.headerTitle}>Manage Users</Title>
          <Text style={styles.headerSubtitle}>Track and manage your users and receivers</Text>
        </View>

        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={24} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${activeTab === 'users' ? 'Donors' : 'Receivers'}...`}
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </LinearGradient>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.activeTab]}
          onPress={() => setActiveTab('users')}
        >
          <MaterialIcons 
            name="person" 
            size={24} 
            color={activeTab === 'users' ? '#fff' : '#64748b'} 
          />
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
            Donors
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'receivers' && styles.activeTab]}
          onPress={() => setActiveTab('receivers')}
        >
          <MaterialIcons 
            name="store" 
            size={24} 
            color={activeTab === 'receivers' ? '#fff' : '#64748b'} 
          />
          <Text style={[styles.tabText, activeTab === 'receivers' && styles.activeTabText]}>
            Receivers
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {filteredData.length > 0 ? (
          filteredData.map((item) => (
            <Card key={item.id} style={styles.card}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <View style={styles.userIcon}>
                    <MaterialIcons 
                      name={activeTab === 'users' ? 'person' : 'store'} 
                      size={24} 
                      color="#6a11cb" 
                    />
                  </View>
                  <View style={styles.userInfo}>
                    <Title style={styles.userName}>
                      {'fullName' in item ? item.fullName || 'N/A' : ('name' in item ? item.name || 'N/A' : 'N/A')}
                    </Title>
                    <Text style={styles.userEmail}>{item.email || 'N/A'}</Text>
                  </View>
                </View>

                <View style={styles.detailsContainer}>
                  <View style={styles.detailRow}>
                    <MaterialIcons name="phone" size={20} color="#6a11cb" />
                    <Text style={styles.detailText}>
                      {activeTab === 'users'
                        ? 'phoneNumber' in item ? item.phoneNumber || 'N/A' : 'N/A'
                        : 'contact_person' in item ? item.contact_person || 'N/A' : 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <MaterialIcons name="location-on" size={20} color="#6a11cb" />
                    <Text style={styles.detailText}>
                      {activeTab === 'users'
                        ? 'address' in item ? item.address || 'N/A' : 'N/A'
                        : 'location' in item ? item.location || 'N/A' : 'N/A'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => deleteItem(item.id, activeTab === 'users' ? 'users' : 'receiver')}
                >
                  <MaterialIcons name="delete" size={20} color="#fff" />
                  <Text style={styles.deleteButtonText}>Delete Account</Text>
                </TouchableOpacity>
              </Card.Content>
            </Card>
          ))
        ) : (
          <View style={styles.noResultsContainer}>
            <MaterialIcons name="search-off" size={48} color="#94a3b8" />
            <Text style={styles.noResults}>
              No {activeTab === 'users' ? 'donors' : 'receivers'} found
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: -25,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 15,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#6a11cb',
  },
  tabText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    padding: 20,
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 2,
    backgroundColor: '#fff',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  userEmail: {
    fontSize: 14,
    color: '#64748b',
  },
  detailsContainer: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailText: {
    fontSize: 16,
    color: '#334155',
    flex: 1,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noResults: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
});

export default ManageUsers;