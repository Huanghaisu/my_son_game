import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TaskHallScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🏰 任务大厅</Text>
      <Text style={styles.sub}>（开发中）</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF8E7' },
  text: { fontSize: 28, fontWeight: 'bold', color: '#FF8C00' },
  sub: { fontSize: 16, color: '#aaa', marginTop: 8 },
});
