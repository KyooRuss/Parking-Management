import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

// Mock vehicle data - in a real app, this would come from an API
const vehicles = [
  { id: '1', type: 'Motorcycle', plate: 'ABC-1234', contact: '0907-543-4634' },
  { id: '2', type: 'Car', plate: 'XYZ-5678', contact: '0912-345-6789' },
];

export default function Dashboard({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>QR Parkers</Text>
            <Text style={styles.headerSubtitle}>Parking Space</Text>
          </View>
          <TouchableOpacity 
            onPress={() => navigation.navigate('ProfileSettings')}
            style={styles.profileButton}
          >
            <Ionicons name="person-circle-outline" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>My Vehicles</Text>
        {vehicles.map((vehicle) => (
          <TouchableOpacity
            key={vehicle.id}
            style={styles.vehicleCard}
            onPress={() => navigation.navigate('VehicleDetail', { 
              id: vehicle.id,
              type: vehicle.type,
              plate: vehicle.plate,
              contact: vehicle.contact,
            })}
          >
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleType}>{vehicle.type}</Text>
              <Text style={styles.vehiclePlate}>{vehicle.plate}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#FF6B35',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#fff',
    fontSize: 14,
    marginTop: 4,
  },
  profileButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  vehicleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  vehiclePlate: {
    fontSize: 14,
    color: '#666',
  },
  arrow: {
    fontSize: 24,
    color: '#FF6B35',
    fontWeight: 'bold',
  },
});
