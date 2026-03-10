import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { CHILD_AVATARS } from '../../constants/templates';

export default function SetupProfileScreen({ navigation }: any) {
  const { updateSettings } = useAppStore();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(CHILD_AVATARS[0]);
  const [ageGroup, setAgeGroup] = useState<'3to4' | '5to6'>('3to4');

  const handleNext = () => {
    if (!name.trim()) return;
    updateSettings({ childName: name.trim(), childAvatar: avatar, ageGroup });
    navigation.navigate('SetupTasks');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.step}>3 / 7</Text>
      <Text style={styles.title}>👶 孩子档案</Text>

      <Text style={styles.label}>孩子叫什么名字？</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="请输入昵称"
        maxLength={10}
        placeholderTextColor="#ccc"
      />

      <Text style={styles.label}>选择头像</Text>
      <View style={styles.avatarGrid}>
        {CHILD_AVATARS.map((a) => (
          <TouchableOpacity
            key={a}
            style={[styles.avatarBtn, avatar === a && styles.avatarSelected]}
            onPress={() => setAvatar(a)}
          >
            <Text style={styles.avatarText}>{a}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>年龄段</Text>
      <View style={styles.ageRow}>
        {(['3to4', '5to6'] as const).map((ag) => (
          <TouchableOpacity
            key={ag}
            style={[styles.ageBtn, ageGroup === ag && styles.ageBtnSelected]}
            onPress={() => setAgeGroup(ag)}
          >
            <Text style={[styles.ageBtnText, ageGroup === ag && styles.ageBtnTextSelected]}>
              {ag === '3to4' ? '3-4 岁' : '5-6 岁'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.nextBtn, !name.trim() && styles.nextBtnDisabled]}
        onPress={handleNext}
        disabled={!name.trim()}
      >
        <Text style={styles.nextBtnText}>下一步 →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: 'center', backgroundColor: '#FFF8E7', padding: 24, paddingTop: 60 },
  step: { fontSize: 14, color: '#ccc', marginBottom: 8 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#FF8C00', marginBottom: 32 },
  label: { fontSize: 16, color: '#555', alignSelf: 'flex-start', marginBottom: 8, marginTop: 16 },
  input: { width: '100%', backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 18, borderWidth: 1.5, borderColor: '#FFD580' },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  avatarBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#eee' },
  avatarSelected: { borderColor: '#FF8C00', backgroundColor: '#FFF0CC' },
  avatarText: { fontSize: 28 },
  ageRow: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  ageBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 2, borderColor: '#eee', backgroundColor: '#fff', alignItems: 'center' },
  ageBtnSelected: { borderColor: '#FF8C00', backgroundColor: '#FFF0CC' },
  ageBtnText: { fontSize: 16, color: '#888' },
  ageBtnTextSelected: { color: '#FF8C00', fontWeight: 'bold' },
  nextBtn: { marginTop: 40, backgroundColor: '#FF8C00', paddingHorizontal: 48, paddingVertical: 16, borderRadius: 30 },
  nextBtnDisabled: { backgroundColor: '#ddd' },
  nextBtnText: { fontSize: 20, color: '#fff', fontWeight: 'bold' },
});
