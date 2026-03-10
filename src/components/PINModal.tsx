// ============================================================
// PIN 验证弹窗 — 切换家长端时使用
// ============================================================

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';

interface PINModalProps {
  visible: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  verifyPIN: (pin: string) => boolean;
}

export default function PINModal({ visible, onSuccess, onCancel, verifyPIN }: PINModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!pin) {
      setError('请输入 PIN 码');
      return;
    }
    if (verifyPIN(pin)) {
      setPin('');
      setError('');
      onSuccess();
    } else {
      setError('PIN 码不对，再试试！');
      setPin('');
    }
  };

  const handleCancel = () => {
    setPin('');
    setError('');
    onCancel();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>🔐 家长验证</Text>
          <Text style={styles.subtitle}>请输入家长 PIN 码</Text>

          <TextInput
            style={styles.input}
            value={pin}
            onChangeText={(v) => { setPin(v); setError(''); }}
            secureTextEntry
            keyboardType="number-pad"
            maxLength={6}
            placeholder="输入 PIN 码"
            placeholderTextColor="#ccc"
            autoFocus
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.cancelText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleSubmit}>
              <Text style={styles.confirmText}>确认</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 28,
    width: '82%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 22,
  },
  input: {
    borderWidth: 2,
    borderColor: '#FF8C00',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 26,
    textAlign: 'center',
    width: '100%',
    letterSpacing: 10,
    marginBottom: 6,
    color: '#222',
  },
  error: {
    color: '#DC2626',
    fontSize: 14,
    marginBottom: 10,
    marginTop: 4,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 18,
    color: '#555',
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#FF8C00',
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
});
