import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

type Props = NativeStackScreenProps<RootStackParamList, 'ChangePassword'>;

export default function ChangePassword({ navigation }: Props) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validatePassword = (password: string): boolean => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'All fields are required',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'New passwords do not match',
      });
      return;
    }

    if (currentPassword === newPassword) {
      Toast.show({
        type: 'error',
        text1: 'New password must be different from current password',
      });
      return;
    }

    if (!validatePassword(newPassword)) {
      Alert.alert(
        'Invalid Password',
        'Password must be at least 8 characters long and contain:\n• One uppercase letter\n• One lowercase letter\n• One number',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call - replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // In a real app, you would call your API here:
      // const response = await changePasswordAPI({
      //   currentPassword,
      //   newPassword,
      // });

      Toast.show({
        type: 'success',
        text1: 'Password changed successfully!',
        text2: 'Please login again with your new password',
      });

      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Navigate back after a short delay
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to change password',
        text2: error.message || 'Please try again',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>QR Parkers</Text>
          <Text style={styles.headerSubtitle}>Change Password</Text>
        </View>
      </View>

      {/* Form Container */}
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Change Your Password</Text>
        <Text style={styles.formSubtitle}>
          Enter your current password and choose a new one
        </Text>

        {/* Current Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Current Password</Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter current password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showCurrentPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* New Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>New Password</Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter new password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNewPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowNewPassword(!showNewPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.helperText}>
            Must be at least 8 characters with uppercase, lowercase, and number
          </Text>
        </View>

        {/* Confirm Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm New Password</Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>
          {confirmPassword && newPassword !== confirmPassword && (
            <Text style={styles.errorText}>Passwords do not match</Text>
          )}
        </View>

        {/* Change Password Button */}
        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleChangePassword}
          disabled={isLoading}
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? 'Changing Password...' : 'CHANGE PASSWORD'}
          </Text>
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
    paddingBottom: 40,
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
  formContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 12,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});


