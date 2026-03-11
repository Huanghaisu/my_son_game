// ============================================================
// 管理菜单 — 任务 / 怪兽 / 商城 三合一入口
// ============================================================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/useAppStore';

const BLUE = '#4A6FA5';
const BG = '#F0F4FF';

export default function ManageMenuScreen({ navigation }: any) {
  const { tasks, monsters, shopItems } = useAppStore();

  const enabledTasks = tasks.filter(t => t.isEnabled).length;
  const defeatedMonsters = monsters.filter(m => m.isDefeated).length;
  const enabledShopItems = shopItems.filter(s => s.isEnabled).length;

  const menuItems = [
    {
      icon: '📋',
      title: '任务管理',
      desc: `共 ${tasks.length} 个任务，今日 ${enabledTasks} 个启用`,
      color: '#E8F0FE',
      accent: BLUE,
      onPress: () => navigation.navigate('TaskManage'),
    },
    {
      icon: '👾',
      title: '怪兽管理',
      desc: `共 ${monsters.length} 只怪兽，已击倒 ${defeatedMonsters} 只`,
      color: '#FFF3E0',
      accent: '#FF8C00',
      onPress: () => navigation.navigate('MonsterManage'),
    },
    {
      icon: '🏪',
      title: '商城管理',
      desc: `共 ${shopItems.length} 个奖励，${enabledShopItems} 个上架中`,
      color: '#F3E5F5',
      accent: '#9C27B0',
      onPress: () => navigation.navigate('ShopManage'),
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>管理中心</Text>
        <Text style={styles.headerSub}>配置任务、怪兽和商城奖励</Text>

        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.title}
            style={[styles.card, { borderLeftColor: item.accent }]}
            onPress={item.onPress}
            activeOpacity={0.75}
          >
            <View style={[styles.iconBox, { backgroundColor: item.color }]}>
              <Text style={styles.cardIcon}>{item.icon}</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={[styles.cardTitle, { color: item.accent }]}>{item.title}</Text>
              <Text style={styles.cardDesc}>{item.desc}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}

        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>💡 小提示</Text>
          <Text style={styles.tipsText}>
            • 建议每天 3-4 个普通任务 + 1-2 个困难任务{'\n'}
            • 怪兽 HP 设置为 50-200，让孩子 1-5 天击倒{'\n'}
            • 商城奖励积分要和任务积分匹配
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  content: { padding: 20, paddingBottom: 40 },

  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1A1A2E', marginBottom: 4 },
  headerSub: { fontSize: 14, color: '#888', marginBottom: 28 },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18,
    marginBottom: 14, flexDirection: 'row', alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000', shadowOpacity: 0.07,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  iconBox: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  cardIcon: { fontSize: 28 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 3 },
  cardDesc: { fontSize: 13, color: '#888' },
  arrow: { fontSize: 26, color: '#ccc', fontWeight: '300' },

  tips: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    marginTop: 8, borderLeftWidth: 4, borderLeftColor: '#4CAF50',
  },
  tipsTitle: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 8 },
  tipsText: { fontSize: 13, color: '#777', lineHeight: 22 },
});
