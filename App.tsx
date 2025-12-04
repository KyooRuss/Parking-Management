import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';

import Splash from './src/screens/Splash';
import Login from './src/screens/Login';
import Dashboard from './src/screens/Dashboard';
import VehicleDetail from './src/screens/VehicleDetail';
import QRScanner from './src/screens/QRScanner';
import ParkingConfirmation from './src/screens/ParkingConfirmation';
import ProfileSettings from './src/screens/ProfileSettings';
import ChangePassword from './src/screens/ChangePassword';
import NotFound from './src/screens/NotFound';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Dashboard: undefined;
  VehicleDetail: { id: string; type?: string; plate?: string; contact?: string };
  QRScanner: { action: 'park' | 'leave'; vehicleId: string; type: string; plate: string; contact: string; userName?: string };
  ParkingConfirmation: { parkingCode: string; vehicleId: string; type: string; plate: string; contact: string; action: 'park' | 'leave' };
  ProfileSettings: undefined;
  ChangePassword: undefined;
  NotFound: undefined;
};

const queryClient = new QueryClient();
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Splash">
          <Stack.Screen name="Splash" component={Splash} options={{ headerShown: false }} />
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Dashboard" component={Dashboard} options={{ headerShown: false }} />
          <Stack.Screen name="VehicleDetail" component={VehicleDetail} options={{ headerShown: false }} />
          <Stack.Screen name="QRScanner" component={QRScanner} options={{ headerShown: false }} />
          <Stack.Screen name="ParkingConfirmation" component={ParkingConfirmation} options={{ headerShown: false }} />
          <Stack.Screen name="ProfileSettings" component={ProfileSettings} options={{ headerShown: false }} />
          <Stack.Screen name="ChangePassword" component={ChangePassword} options={{ headerShown: false }} />
          <Stack.Screen name="NotFound" component={NotFound} />
        </Stack.Navigator>
        <Toast />
      </NavigationContainer>
      <StatusBar style="auto" />
    </QueryClientProvider>
  );
}
