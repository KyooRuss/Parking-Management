import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export default function Splash({ navigation }: Props) {
  useEffect(() => {
    // Auto-navigate to login after 3 seconds
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Gradient Background */}
      <View style={styles.gradientTop} />
      <View style={styles.gradientBottom} />
      
      <View style={styles.content}>
        {/* QR Code Icon */}
        <View style={styles.iconContainer}>
          <Image
            source={require('../../assets/QRParkers.png')}
            style={styles.icon}
            resizeMode="contain"
          />
        </View>
        
        {/* QR PARKERS Text */}
        <Text style={styles.appName}>QR PARKERS</Text>
      </View>

      {/* Skip button (optional) */}
      <TouchableOpacity 
        style={styles.skipButton}
        onPress={() => navigation.replace('Login')}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8E8E8',
  },
  gradientTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FF6B35',
    height: '60%',
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: '#FF6B35',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#FFA366',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 20,
  },
  icon: {
    width: 100,
    height: 100,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
    letterSpacing: 2,
  },
  skipButton: {
    position: 'absolute',
    bottom: 40,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  skipText: {
    color: '#666',
    fontSize: 14,
  },
});
