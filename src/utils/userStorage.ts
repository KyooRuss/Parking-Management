import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_NAME_KEY = '@user_name';
const USER_ID_KEY = '@user_id';

export const userStorage = {
  async getUserName(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(USER_NAME_KEY);
    } catch (error) {
      console.error('Error getting user name:', error);
      return null;
    }
  },

  async setUserName(name: string): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_NAME_KEY, name);
    } catch (error) {
      console.error('Error setting user name:', error);
    }
  },

  async getUserId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(USER_ID_KEY);
    } catch (error) {
      console.error('Error getting user id:', error);
      return null;
    }
  },

  async setUserId(id: string): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_ID_KEY, id);
    } catch (error) {
      console.error('Error setting user id:', error);
    }
  },
};

