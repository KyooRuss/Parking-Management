import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'ParkingConfirmation'>;

export default function ParkingConfirmation({ navigation, route }: Props) {
  const { parkingCode, vehicleId, type, plate, contact, action } = route.params;

  const handlePark = () => {
    navigation.navigate('QRScanner', {
      action: 'park',
      vehicleId,
      type,
      plate,
      contact,
    });
  };

  const handleLeave = () => {
    navigation.navigate('QRScanner', {
      action: 'leave',
      vehicleId,
      type,
      plate,
      contact,
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Dashboard')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>QR Parkers</Text>
          <Text style={styles.headerSubtitle}>Parking Space</Text>
        </View>
      </View>

      {/* Vehicle Info Card */}
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>CATEGORY</Text>
            <View style={styles.categoryRow}>
              <Text style={styles.value}>{type}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{parkingCode}</Text>
              </View>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Contact Number</Text>
            <Text style={styles.value}>{contact}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Plate Number</Text>
            <Text style={styles.value}>{plate}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.parkButton} onPress={handlePark}>
            <Text style={styles.buttonText}>PARK</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.leaveButton} onPress={handleLeave}>
            <Text style={styles.buttonText}>LEAVE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#FF6B35',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#fff',
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  value: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  badge: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  buttonContainer: {
    gap: 12,
  },
  parkButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  leaveButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});


