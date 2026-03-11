// ============================================================
// 儿童端 — 卡牌背包
// UI 优化：稀有度系统（史诗/稀有/普通）+ 金色光晕 + 空状态优化
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

// ── 稀有度系统 ──────────────────────────────────────────────
type Rarity = 'epic' | 'rare' | 'common';

function getRarity(attackPower: number): {
  rarity:  Rarity;
  border:  string;
  header:  string;
  label:   string;
  glow:    boolean;
} {
  if (attackPower >= 10) return {
    rarity: 'epic',
    border: '#F59E0B',
    header: '#D97706',
    label:  '💎 史诗',
    glow:   true,
  };
  if (attackPower >= 6) return {
    rarity: 'rare',
    border: '#7C3AED',
    header: '#7C3AED',
    label:  '✨ 稀有',
    glow:   false,
  };
  return {
    rarity: 'common',
    border: '',
    header: '',
    label:  '',
    glow:   false,
  };
}

export default function CardBackpackScreen() {
  const { cards } = useAppStore();

  // 按攻击力降序排列，史诗/稀有卡排前面
  const sortedCards = [...cards].sort((a, b) => b.attackPower - a.attackPower);

  const epicCount  = cards.filter(c => c.attackPower >= 10).length;
  const rareCount  = cards.filter(c => c.attackPower >= 6 && c.attackPower < 10).length;

  const renderCard = ({ item }: { item: Card }) => {
    const isSkill    = item.type === 'skill';
    const baseColor  = isSkill ? '#7C3AED' : '#2563EB';
    const bgColor    = isSkill ? '#EDE9FE' : '#DBEAFE';
    const baseLabel  = isSkill ? '⚡ 绝招卡' : '🗡️ 工具卡';
    const rarityInfo = getRarity(item.attackPower);

    // 史诗卡用金色覆盖基础颜色
    const headerColor = rarityInfo.glow ? rarityInfo.header : (rarityInfo.rarity === 'rare' ? rarityInfo.border : baseColor);
    const borderColor = rarityInfo.border || baseColor;
    const headerLabel = rarityInfo.label || baseLabel;

    return (
      <View style={[
        styles.card,
        { backgroundColor: bgColor, borderColor, width: CARD_WIDTH },
        rarityInfo.glow && styles.epicCard,
      ]}>
        <View style={[styles.cardHeader, { backgroundColor: headerColor }]}>
          <Text style={styles.cardHeaderText}>{headerLabel}</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardIcon}>{item.icon}</Text>
          <Text style={[styles.cardTask, { color: headerColor }]} numberOfLines={1}>
            {item.taskName}
          </Text>
          <View style={[styles.attackRow, { backgroundColor: headerColor }]}>
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
        <View>
          <Text style={styles.title}>🎒 卡牌背包</Text>
          {epicCount > 0 || rareCount > 0 ? (
            <Text style={styles.headerSub}>
              {epicCount > 0 ? `💎 史诗 ${epicCount}  ` : ''}
              {rareCount > 0 ? `✨ 稀有 ${rareCount}` : ''}
            </Text>
          ) : null}
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{cards.length} 张</Text>
        </View>
      </View>

      {cards.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyTitle}>背包空空的</Text>
          <Text style={styles.emptyHint}>完成今日任务，就能获得卡牌哦！</Text>
          <View style={styles.emptyTip}>
            <Text style={styles.emptyTipText}>💡 困难任务可获得稀有绝招卡</Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={sortedCards}
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
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
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

  // 空状态
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingBottom: 60,
    paddingHorizontal: 32,
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
  },
  emptyTip: {
    marginTop: 8,
    backgroundColor: '#EDE9FE',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyTipText: {
    fontSize: 13,
    color: '#7C3AED',
    fontWeight: '600',
  },

  // 列表
  list: {
    padding: 16,
  },
  row: {
    gap: 12,
    marginBottom: 12,
  },

  // 普通卡牌
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
  // 史诗卡额外光晕
  epicCard: {
    borderWidth: 3,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
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
