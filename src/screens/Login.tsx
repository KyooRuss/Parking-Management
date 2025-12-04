import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Ionicons } from '@expo/vector-icons';
import { userStorage } from '../utils/userStorage';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function Login({ navigation }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(true);

  const handleLogin = async () => {
    // For demo: save a default user name (in real app, get from login API)
    // You can get this from ProfileSettings or your auth system
    await userStorage.setUserName('Kenneth Roy Villamayor');
    await userStorage.setUserId(username || 'user');
    navigation.replace('Dashboard');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* University Building Illustration */}
      <View style={styles.illustrationContainer}>
        <Image
          source={{ uri: 'https://via.placeholder.com/400/300/FF6B35?text=NEW+ERA+UNIVERSITY' }}
          // Replace above with: require('../../assets/university-building.png')
          // Image link: Add your university building illustration here
          style={styles.illustration}
          resizeMode="contain"
        />
      </View>

      {/* Login Form Container */}
      <View style={styles.formContainer}>
        {/* Username Field */}
        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <Ionicons name="person-outline" size={16} color="#666" style={styles.labelIcon} />
            <Text style={styles.label}>Username</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Enter your username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>

        {/* Password Field */}
        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <Ionicons name="lock-closed-outline" size={16} color="#666" style={styles.labelIcon} />
            <Text style={styles.label}>Password</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        {/* Keep me signed in & Forgot password */}
        <View style={styles.optionsRow}>
          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={[styles.checkbox, keepSignedIn && styles.checkboxChecked]}
              onPress={() => setKeepSignedIn(!keepSignedIn)}
            >
              {keepSignedIn && <Ionicons name="checkmark" size={16} color="#FF6B35" />}
            </TouchableOpacity>
            <Text style={styles.checkboxLabel}>Keep me signed in</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.forgotPassword}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>LOG IN</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  contentContainer: {
    flexGrow: 1,
  },
  illustrationContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#fff',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  formContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelIcon: {
    marginRight: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#FF6B35',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#fff',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#666',
  },
  forgotPassword: {
    fontSize: 12,
    color: '#666',
  },
  loginButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
