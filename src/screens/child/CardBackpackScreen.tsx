// ============================================================
// 儿童端 — 卡牌背包
// 工具卡（蓝色）/ 绝招卡（紫色）颜色永远区分
// 稀有度通过角标 + 边框 + 光晕叠加展示，不覆盖类型色
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

// ── 卡牌类型颜色（始终优先）──────────────────────────────────
const TYPE_STYLE = {
  tool:  { color: '#2563EB', bg: '#DBEAFE', label: '🗡️ 工具卡' },
  skill: { color: '#7C3AED', bg: '#EDE9FE', label: '⚡ 绝招卡' },
} as const;

// ── 稀有度系统（叠加在类型色上）─────────────────────────────
function getRarity(atk: number): { label: string; borderColor: string; badgeBg: string; badgeText: string; glow: boolean } | null {
  if (atk >= 10) return { label: '💎 史诗', borderColor: '#F59E0B', badgeBg: '#FEF3C7', badgeText: '#D97706', glow: true };
  if (atk >= 6)  return { label: '✨ 稀有', borderColor: '#A78BFA', badgeBg: '#EDE9FE', badgeText: '#6D28D9', glow: false };
  return null;
}

export default function CardBackpackScreen() {
  const { cards } = useAppStore();

  const sortedCards = [...cards].sort((a, b) => b.attackPower - a.attackPower);
  const epicCount   = cards.filter(c => c.attackPower >= 10).length;
  const rareCount   = cards.filter(c => c.attackPower >= 6 && c.attackPower < 10).length;

  const renderCard = ({ item }: { item: Card }) => {
    const type   = TYPE_STYLE[item.type] ?? TYPE_STYLE.tool;
    const rarity = getRarity(item.attackPower);

    return (
      <View style={[
        styles.card,
        { backgroundColor: type.bg, borderColor: rarity?.borderColor ?? type.color, width: CARD_WIDTH },
        rarity?.glow && styles.epicGlow,
      ]}>
        {/* 稀有度角标（仅稀有/史诗） */}
        {rarity && (
          <View style={[styles.rarityBadge, { backgroundColor: rarity.badgeBg }]}>
            <Text style={[styles.rarityBadgeText, { color: rarity.badgeText }]}>{rarity.label}</Text>
          </View>
        )}

        {/* 类型色 Header（蓝=工具卡，紫=绝招卡，始终不变） */}
        <View style={[styles.cardHeader, { backgroundColor: type.color }]}>
          <Text style={styles.cardHeaderText}>{type.label}</Text>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardIcon}>{item.icon}</Text>
          <Text style={[styles.cardTask, { color: type.color }]} numberOfLines={1}>
            {item.taskName}
          </Text>
          <View style={[styles.attackRow, { backgroundColor: type.color }]}>
            <Text style={styles.attackText}>⚔️ {item.attackPower}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>🎒 卡牌背包</Text>
          {(epicCount > 0 || rareCount > 0) && (
            <Text style={styles.headerSub}>
              {epicCount > 0 ? `💎 史诗 ${epicCount}  ` : ''}
              {rareCount > 0 ? `✨ 稀有 ${rareCount}` : ''}
            </Text>
          )}
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
            <Text style={styles.emptyTipText}>💡 困难任务可获得紫色绝招卡</Text>
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
  safeArea: { flex: 1, backgroundColor: '#F0F4FF' },

  header: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title:     { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  countBadge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20,
  },
  countText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // 空状态
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingBottom: 60, paddingHorizontal: 32 },
  emptyIcon:  { fontSize: 72 },
  emptyTitle: { fontSize: 22, fontWeight: 'bold', color: '#555' },
  emptyHint:  { fontSize: 15, color: '#999', textAlign: 'center' },
  emptyTip:   { marginTop: 8, backgroundColor: '#EDE9FE', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 },
  emptyTipText: { fontSize: 13, color: '#7C3AED', fontWeight: '600' },

  // 列表
  list: { padding: 16 },
  row:  { gap: 12, marginBottom: 12 },

  // 卡牌
  card: {
    borderRadius: 18,
    borderWidth: 2.5,
    overflow: 'visible',   // 让角标能超出边界
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  epicGlow: {
    borderWidth: 3,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },

  // 稀有度角标（右上角绝对定位）
  rarityBadge: {
    position: 'absolute',
    top: -10,
    right: -4,
    zIndex: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  rarityBadgeText: { fontSize: 11, fontWeight: 'bold' },

  // 类型色 Header
  cardHeader:     { paddingVertical: 8, alignItems: 'center', borderRadius: 0 },
  cardHeaderText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },

  cardBody: { alignItems: 'center', paddingVertical: 18, paddingHorizontal: 12, gap: 8 },
  cardIcon: { fontSize: 50 },
  cardTask: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  attackRow: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 14 },
  attackText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});
