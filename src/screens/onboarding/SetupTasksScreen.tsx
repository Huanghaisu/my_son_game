// Step 4/7 — 选择初始任务模板

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import {
  NORMAL_TASK_TEMPLATES, HARD_TASK_TEMPLATES, ONBOARDING_DEFAULT_TASKS,
} from '../../constants/templates';
import { Task } from '../../store/types';

type TemplateItem = Omit<Task, 'id' | 'status' | 'completedAt' | 'isEnabled'>;

export default function SetupTasksScreen({ navigation }: any) {
  // 默认选中推荐的4个任务
  const defaultSelected = new Set(ONBOARDING_DEFAULT_TASKS.map((t) => t.name));
  const [selected, setSelected] = useState<Set<string>>(defaultSelected);
  const { addTask } = useAppStore();

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const handleNext = () => {
    if (selected.size === 0) {
      Alert.alert('至少选一个任务', '孩子需要任务才能获得卡牌哦！');
      return;
    }
    const allTemplates = [...NORMAL_TASK_TEMPLATES, ...HARD_TASK_TEMPLATES];
    allTemplates
      .filter((t) => selected.has(t.name))
      .forEach((t) => addTask({ ...t, isEnabled: true }));
    navigation.navigate('SetupMonster');
  };

  const renderCard = (template: TemplateItem) => {
    const isSelected = selected.has(template.name);
    const isHard = template.type === 'hard';
    return (
      <TouchableOpacity
        key={template.name}
        style={[styles.card, isSelected && styles.cardSelected, isHard && styles.cardHard, isSelected && isHard && styles.cardHardSelected]}
        onPress={() => toggle(template.name)}
        activeOpacity={0.75}
      >
        <Text style={styles.cardIcon}>{template.icon}</Text>
        <View style={styles.cardBody}>
          <Text style={[styles.cardName, isHard && styles.cardNameHard]}>{template.name}</Text>
          <Text style={styles.cardStats}>⚔️ {template.attackPower}  ⭐ {template.points}</Text>
        </View>
        <Text style={styles.cardCheck}>{isSelected ? '✓' : '+'}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.step}>4 / 7</Text>
      <Text style={styles.title}>📋 选择今日任务</Text>
      <Text style={styles.subtitle}>选好了之后还可以随时修改</Text>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>📝</Text>
          <Text style={styles.sectionTitle}>普通任务</Text>
          <Text style={styles.sectionDesc}>攻击力 10-20</Text>
        </View>
        {NORMAL_TASK_TEMPLATES.map(renderCard)}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>⭐</Text>
          <Text style={styles.sectionTitle}>困难任务</Text>
          <Text style={styles.sectionDesc}>攻击力 30-50</Text>
        </View>
        {HARD_TASK_TEMPLATES.map(renderCard)}
      </View>

      <Text style={styles.hint}>已选 {selected.size} 个任务</Text>

      <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
        <Text style={styles.nextBtnText}>下一步 →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#FFF8E7', padding: 20, paddingTop: 52 },
  step: { fontSize: 14, color: '#ccc', textAlign: 'center', marginBottom: 6 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#FF8C00', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#aaa', textAlign: 'center', marginBottom: 24 },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 6 },
  sectionIcon: { fontSize: 18 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  sectionDesc: { fontSize: 12, color: '#aaa', marginLeft: 4 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 2, borderColor: '#eee',
  },
  cardSelected: { borderColor: '#FF8C00', backgroundColor: '#FFF5E0' },
  cardHard: { borderColor: '#E8D5FF' },
  cardHardSelected: { borderColor: '#9B59B6', backgroundColor: '#F5EEFF' },
  cardIcon: { fontSize: 30, marginRight: 12 },
  cardBody: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 2 },
  cardNameHard: { color: '#9B59B6' },
  cardStats: { fontSize: 13, color: '#aaa' },
  cardCheck: { fontSize: 20, color: '#FF8C00', fontWeight: 'bold', width: 28, textAlign: 'center' },
  hint: { textAlign: 'center', color: '#FF8C00', fontSize: 14, marginBottom: 8, fontWeight: '600' },
  nextBtn: { backgroundColor: '#FF8C00', borderRadius: 30, paddingVertical: 16, alignItems: 'center', marginTop: 8, marginBottom: 32 },
  nextBtnText: { fontSize: 20, color: '#fff', fontWeight: 'bold' },
});
