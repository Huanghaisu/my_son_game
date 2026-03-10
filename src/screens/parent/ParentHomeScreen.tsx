import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppStore } from '../../store/useAppStore';

export default function ParentHomeScreen() {
  const { switchToChild } = useAppStore();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>👨‍👩‍👧 家长中心</Text>
      <Text style={styles.sub}>（开发中）</Text>
      <TouchableOpacity style={styles.button} onPress={switchToChild}>
        <Text style={styles.buttonText}>切换到儿童模式</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F4FF' },
  text: { fontSize: 28, fontWeight: 'bold', color: '#4A6FA5' },
  sub: { fontSize: 16, color: '#aaa', marginTop: 8, marginBottom: 40 },
  button: { backgroundColor: '#4A6FA5', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 24 },
  buttonText: { fontSize: 18, color: '#fff', fontWeight: 'bold' },
});
