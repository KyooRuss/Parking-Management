import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { userStorage } from '../utils/userStorage';
import { uploadProfileImage } from '../services/firebase';

type Props = NativeStackScreenProps<RootStackParamList, 'ProfileSettings'>;

const AVATAR_STORAGE_KEY = '@user_avatar';

export default function ProfileSettings({ navigation }: Props) {
  // Mock user data - replace with actual user data from your state/context
  const [userProfile] = useState({
    name: 'Kenneth Roy Villamayor',
    email: 'kennethroy@gmail.com',
    contact: '0907-543-4634',
    plateNumber: 'KNT-2821',
    role: 'STUDENT',
  });

  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  // Load saved avatar and save user name on mount
  useEffect(() => {
    loadAvatar();
    loadUserImageUrl();
    // Save user name to storage so it's available throughout the app
    userStorage.setUserName(userProfile.name);
  }, []);

  const loadUserImageUrl = async () => {
    try {
      const imageUrl = await userStorage.getUserImageUrl();
      if (imageUrl) {
        setAvatarUri(imageUrl);
      }
    } catch (error) {
      console.error('Error loading user image URL:', error);
    }
  };

  const loadAvatar = async () => {
    try {
      const savedAvatar = await AsyncStorage.getItem(AVATAR_STORAGE_KEY);
      if (savedAvatar) {
        setAvatarUri(savedAvatar);
      }
    } catch (error) {
      console.error('Error loading avatar:', error);
    }
  };

  const saveAvatar = async (uri: string) => {
    try {
      // Save locally only (Firebase upload disabled to prevent errors)
      await AsyncStorage.setItem(AVATAR_STORAGE_KEY, uri);
      setAvatarUri(uri);
      
      // Don't upload to Firebase - just save locally
      await userStorage.setUserImageUrl('');
      
      Toast.show({
        type: 'success',
        text1: 'Profile picture updated!',
      });
    } catch (error) {
      console.error('Error saving avatar:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to save profile picture',
      });
    }
  };

  const requestImagePickerPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera roll permissions to change your profile picture.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const handleEditProfile = async () => {
    const hasPermission = await requestImagePickerPermission();
    if (!hasPermission) return;

    Alert.alert(
      'Change Profile Picture',
      'Choose an option',
      [
        {
          text: 'Camera',
          onPress: () => pickImageFromCamera(),
        },
        {
          text: 'Photo Library',
          onPress: () => pickImageFromLibrary(),
        },
        {
          text: 'Remove Photo',
          onPress: () => removeAvatar(),
          style: 'destructive',
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const pickImageFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'] as any,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        saveAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to pick image',
      });
    }
  };

  const pickImageFromCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant camera permissions to take a photo.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        saveAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to take photo',
      });
    }
  };

  const removeAvatar = async () => {
    try {
      await AsyncStorage.removeItem(AVATAR_STORAGE_KEY);
      setAvatarUri(null);
      Toast.show({
        type: 'success',
        text1: 'Profile picture removed',
      });
    } catch (error) {
      console.error('Error removing avatar:', error);
    }
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => navigation.replace('Login'),
        },
      ]
    );
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
          <Text style={styles.headerSubtitle}>Profile Settings</Text>
        </View>
      </View>

      {/* Profile Header Card - Hidden */}
      {/* <View style={styles.profileHeaderCard}>
        <Text style={styles.profileHeaderTitle}>PROFILE</Text>
      </View> */}

      {/* Profile Card */}
      <View style={styles.profileCard}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {userProfile.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()}
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.editAvatarButton} onPress={handleEditProfile}>
              <Ionicons name="camera" size={16} color="#FF6B35" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Information */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>FULL NAME</Text>
            <Text style={styles.infoValue}>{userProfile.name}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>EMAIL ADDRESS</Text>
            <Text style={styles.infoValue}>{userProfile.email}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>CONTACT NUMBER</Text>
            <Text style={styles.infoValue}>{userProfile.contact}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>PLATE NUMBER</Text>
            <Text style={styles.infoValue}>{userProfile.plateNumber}</Text>
          </View>
        </View>

        {/* Role Badge */}
        <View style={styles.roleSection}>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{userProfile.role}</Text>
          </View>
        </View>

        {/* Change Password Button */}
        <TouchableOpacity style={styles.changePasswordButton} onPress={handleChangePassword}>
          <Text style={styles.changePasswordText}>CHANGE PASSWORD</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#FF6B35" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
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
  profileHeaderCard: {
    backgroundColor: '#FF6B35',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  profileHeaderTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileCard: {
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: '#FF6B35',
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FF6B35',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  infoSection: {
    marginBottom: 20,
  },
  infoRow: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '600',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  roleSection: {
    marginBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  roleText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: 'bold',
  },
  changePasswordButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePasswordText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  logoutText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

