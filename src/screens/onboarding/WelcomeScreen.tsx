import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function WelcomeScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>⚔️</Text>
      <Text style={styles.title}>小勇者大冒险</Text>
      <Text style={styles.subtitle}>完成任务，打败怪兽！</Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('SetupPIN')}>
        <Text style={styles.buttonText}>开始设置 →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF8E7' },
  emoji: { fontSize: 80, marginBottom: 16 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#FF8C00', marginBottom: 8 },
  subtitle: { fontSize: 18, color: '#888', marginBottom: 48 },
  button: { backgroundColor: '#FF8C00', paddingHorizontal: 40, paddingVertical: 16, borderRadius: 30 },
  buttonText: { fontSize: 20, color: '#fff', fontWeight: 'bold' },
});
