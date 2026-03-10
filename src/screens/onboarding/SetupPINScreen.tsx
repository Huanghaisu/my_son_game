import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAppStore } from '../../store/useAppStore';

export default function SetupPINScreen({ navigation }: any) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const { updateSettings } = useAppStore();

  const handlePress = (digit: string) => {
    if (step === 'enter') {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) setStep('confirm');
    } else {
      const newConfirm = confirmPin + digit;
      setConfirmPin(newConfirm);
      if (newConfirm.length === 4) {
        if (newConfirm === pin) {
          updateSettings({ parentPIN: pin });
          navigation.navigate('SetupProfile');
        } else {
          Alert.alert('密码不一致', '请重新输入');
          setPin('');
          setConfirmPin('');
          setStep('enter');
        }
      }
    }
  };

  const handleDelete = () => {
    if (step === 'enter') setPin(pin.slice(0, -1));
    else setConfirmPin(confirmPin.slice(0, -1));
  };

  const current = step === 'enter' ? pin : confirmPin;

  return (
    <View style={styles.container}>
      <Text style={styles.step}>2 / 7</Text>
      <Text style={styles.title}>🔒 设置家长密码</Text>
      <Text style={styles.subtitle}>
        {step === 'enter' ? '请设置4位数字密码' : '再次输入确认密码'}
      </Text>

      <View style={styles.dots}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.dot, i < current.length && styles.dotFilled]} />
        ))}
      </View>

      <View style={styles.keypad}>
        {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.key, key === '' && styles.keyEmpty]}
            onPress={() => key === '⌫' ? handleDelete() : key !== '' ? handlePress(key) : null}
            disabled={key === ''}
          >
            <Text style={styles.keyText}>{key}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF8E7', padding: 24 },
  step: { fontSize: 14, color: '#ccc', marginBottom: 8 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#FF8C00', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#888', marginBottom: 32 },
  dots: { flexDirection: 'row', marginBottom: 40, gap: 16 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#FF8C00', backgroundColor: 'transparent' },
  dotFilled: { backgroundColor: '#FF8C00' },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', width: 270, justifyContent: 'center', gap: 12 },
  key: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  keyEmpty: { backgroundColor: 'transparent', elevation: 0, shadowOpacity: 0 },
  keyText: { fontSize: 24, fontWeight: 'bold', color: '#333' },
});
