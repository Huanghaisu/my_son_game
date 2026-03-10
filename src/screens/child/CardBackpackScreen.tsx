// ============================================================
// 儿童端 — 卡牌背包
// ============================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { Card } from '../../store/types';

const CARD_WIDTH = (Dimensions.get('window').width - 16 * 2 - 12) / 2;

export default function CardBackpackScreen() {
  const { cards } = useAppStore();

  const renderCard = ({ item }: { item: Card }) => {
    const isSkill = item.type === 'skill';
    const color = isSkill ? '#7C3AED' : '#2563EB';
    const bgColor = isSkill ? '#EDE9FE' : '#DBEAFE';
    const typeLabel = isSkill ? '⚡ 绝招卡' : '🗡️ 工具卡';

    return (
      <View style={[styles.card, { backgroundColor: bgColor, borderColor: color, width: CARD_WIDTH }]}>
        <View style={[styles.cardHeader, { backgroundColor: color }]}>
          <Text style={styles.cardHeaderText}>{typeLabel}</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardIcon}>{item.icon}</Text>
          <Text style={[styles.cardTask, { color }]} numberOfLines={1}>
            {item.taskName}
          </Text>
          <View style={[styles.attackRow, { backgroundColor: color }]}>
            <Text style={styles.attackText}>⚔️ {item.attackPower}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🎒 卡牌背包</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{cards.length} 张</Text>
        </View>
      </View>

      {cards.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyTitle}>背包空空的</Text>
          <Text style={styles.emptyHint}>完成今日任务，就能获得卡牌哦！</Text>
        </View>
      ) : (
        <FlatList
          data={cards}
          renderItem={renderCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0F4FF',
  },
  header: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  countBadge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  countText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingBottom: 60,
  },
  emptyIcon: {
    fontSize: 72,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#555',
  },
  emptyHint: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  list: {
    padding: 16,
  },
  row: {
    gap: 12,
    marginBottom: 12,
  },
  card: {
    borderRadius: 18,
    borderWidth: 2.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  cardHeader: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  cardHeaderText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  cardBody: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
    gap: 8,
  },
  cardIcon: {
    fontSize: 50,
  },
  cardTask: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  attackRow: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
  },
  attackText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
