import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

type Props = NativeStackScreenProps<RootStackParamList, 'QRScanner'>;

export default function QRScanner({ navigation, route }: Props) {
  const { action, vehicleId, type: vehicleType, plate, contact } = route.params;
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarCodeScanned = ({ type: barcodeType, data }: { type: string; data: string }) => {
    if (scanned) return;

    setScanned(true);

    // Simulate extracting parking code from QR data
    // In a real app, you would parse the QR code data
    const parkingCode = data.includes('A') ? data : `A${Math.floor(Math.random() * 20) + 1}`;

    // Navigate to confirmation screen — pass the vehicle category from route params
    navigation.replace('ParkingConfirmation', {
      parkingCode,
      vehicleId,
      type: vehicleType,
      plate,
      contact,
      action,
    });

    Toast.show({
      type: 'success',
      text1: action === 'park' ? 'Parked successfully!' : 'Left successfully!',
    });
  };

  const handleClose = () => {
    navigation.goBack();
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Camera permission is required</Text>
        <TouchableOpacity 
          style={styles.button} 
          onPress={requestPermission}
        >
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>QR Parkers</Text>
          <Text style={styles.headerSubtitle}>Parking Space</Text>
        </View>
      </View>

      {/* Scanner Area */}
      <View style={styles.scannerContainer}>
        <Text style={styles.actionTitle}>{action === 'park' ? 'Park' : 'Leave'}</Text>
        
        <View style={styles.cameraWrapper}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          />
          {/* Scanner Frame Overlay */}
          <View style={styles.overlay}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
          </View>
        </View>

        <Text style={styles.instruction}>
          Position the QR code within the frame
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    backgroundColor: '#FF6B35',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
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
  scannerContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  actionTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 40,
  },
  cameraWrapper: {
    width: '100%',
    maxWidth: 350,
    aspectRatio: 1,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#fff',
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  instruction: {
    marginTop: 30,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  message: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#FF6B35',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

