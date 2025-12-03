import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'NotFound'>;

export default function NotFound({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Page Not Found</Text>
      <Button title="Go Home" onPress={() => navigation.replace('Splash')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, marginBottom: 12 },
});
