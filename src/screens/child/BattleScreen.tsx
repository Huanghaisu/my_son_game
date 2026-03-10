// ============================================================
// 儿童端 — 战斗场（阶段 5 占位）
// ============================================================

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { useAppStore } from '../../store/useAppStore';

export default function BattleScreen() {
  const { cards, monsters } = useAppStore();
  const activeMonsters = monsters.filter((m) => !m.isDefeated);
  const currentMonster = activeMonsters[0] ?? null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#DC2626" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚔️ 战斗场</Text>
      </View>

      <View style={styles.body}>
        {currentMonster ? (
          <>
            <Text style={styles.monsterIcon}>{currentMonster.icon}</Text>
            <Text style={styles.monsterName}>{currentMonster.name}</Text>
            <Text style={styles.hpText}>
              ❤️ {currentMonster.currentHP} / {currentMonster.maxHP}
            </Text>
          </>
        ) : (
          <Text style={styles.monsterName}>🏆 所有怪兽已击败！</Text>
        )}

        <View style={styles.comingSoon}>
          <Text style={styles.comingSoonIcon}>🚧</Text>
          <Text style={styles.comingSoonText}>战斗系统即将开放</Text>
          <Text style={styles.comingSoonHint}>
            你有 {cards.length} 张卡牌，积累更多后来战斗吧！
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF0F0',
  },
  header: {
    backgroundColor: '#DC2626',
    paddingVertical: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 32,
  },
  monsterIcon: {
    fontSize: 90,
  },
  monsterName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#DC2626',
    textAlign: 'center',
  },
  hpText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  comingSoon: {
    marginTop: 24,
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  comingSoonIcon: {
    fontSize: 40,
  },
  comingSoonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
  },
  comingSoonHint: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
  },
});
