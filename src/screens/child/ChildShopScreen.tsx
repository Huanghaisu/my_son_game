// ============================================================
// 儿童端 — 金币商城（阶段 6）
// ============================================================

import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, Animated, StatusBar, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/useAppStore';
import { ShopItem, Redemption } from '../../store/types';
import { hapticSuccess, hapticError, hapticLight } from '../../utils/haptics';
import GoldCoin from '../../components/GoldCoin';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = (SCREEN_W - 16 * 2 - 12) / 2; // 两列间距 12

const ORANGE = '#FF8C00';
const GOLD   = '#F59E0B';
const BG     = '#FFFBF0';

// ── 兑换状态文案 ──────────────────────────────────────────
const STATUS_MAP: Record<Redemption['status'], { label: string; color: string; icon: string }> = {
  pending_delivery: { label: '等待中', color: '#FF8C00', icon: '⏳' },
  delivered:        { label: '已获得', color: '#16a34a', icon: '✅' },
  cancelled:        { label: '已取消', color: '#9CA3AF', icon: '❌' },
};

export default function ChildShopScreen() {
  const { shopItems, redemptions, points, redeemItem } = useAppStore();

  const [activeTab, setActiveTab] = useState<'shop' | 'records'>('shop');
  // modal 状态：null | 'confirm' | 'success'
  const [modalStep, setModalStep] = useState<null | 'confirm' | 'success'>(null);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);

  // 成功动画
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const enabledItems = shopItems.filter(i => i.isEnabled);

  // 按兑换时间倒序
  const sortedRedemptions = [...redemptions].sort(
    (a, b) => b.createdAt.localeCompare(a.createdAt)
  );

  const handlePressRedeem = (item: ShopItem) => {
    setSelectedItem(item);
    setModalStep('confirm');
  };

  const handleConfirm = () => {
    if (!selectedItem) return;
    const success = redeemItem(selectedItem.id);
    if (success) {
      hapticSuccess();
      setModalStep('success');
      // spring 弹出动画
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1, friction: 5, tension: 80, useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1, duration: 200, useNativeDriver: true,
        }),
      ]).start();
    } else {
      // 积分不足（理论上按钮已禁用，保底处理）
      hapticError();
      setModalStep(null);
    }
  };

  const handleCloseModal = () => {
    setModalStep(null);
    setSelectedItem(null);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={ORANGE} />

      {/* ── Header ───────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏪 金币商城</Text>
        <View style={styles.coinBadge}>
          <GoldCoin size={18} />
          <Text style={styles.coinText}> {points}</Text>
        </View>
      </View>

      {/* ── Tab 切换 ─────────────────────────────────────── */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'shop' && styles.tabBtnActive]}
          onPress={() => { hapticLight(); setActiveTab('shop'); }}
        >
          <Text style={[styles.tabBtnText, activeTab === 'shop' && styles.tabBtnTextActive]}>
            🛍️ 商城
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'records' && styles.tabBtnActive]}
          onPress={() => { hapticLight(); setActiveTab('records'); }}
        >
          <Text style={[styles.tabBtnText, activeTab === 'records' && styles.tabBtnTextActive]}>
            📦 我的兑换
          </Text>
          {sortedRedemptions.filter(r => r.status === 'pending_delivery').length > 0 && (
            <View style={styles.dot} />
          )}
        </TouchableOpacity>
      </View>

      {/* ── 商城 Tab ─────────────────────────────────────── */}
      {activeTab === 'shop' && (
        <ScrollView
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
        >
          {enabledItems.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>🏪</Text>
              <Text style={styles.emptyText}>商城还没有奖励</Text>
              <Text style={styles.emptyHint}>让爸爸妈妈去设置里添加吧！</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {enabledItems.map(item => (
                <ShopCard
                  key={item.id}
                  item={item}
                  points={points}
                  onPress={() => handlePressRedeem(item)}
                />
              ))}
            </View>
          )}
          <View style={{ height: 24 }} />
        </ScrollView>
      )}

      {/* ── 我的兑换 Tab ─────────────────────────────────── */}
      {activeTab === 'records' && (
        <ScrollView
          contentContainerStyle={styles.recordsContent}
          showsVerticalScrollIndicator={false}
        >
          {sortedRedemptions.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyText}>还没有兑换记录</Text>
              <Text style={styles.emptyHint}>去商城兑换心仪的奖励吧！</Text>
            </View>
          ) : (
            sortedRedemptions.map(r => (
              <RedemptionCard key={r.id} redemption={r} />
            ))
          )}
          <View style={{ height: 24 }} />
        </ScrollView>
      )}

      {/* ── 兑换确认 / 成功 Modal ────────────────────────── */}
      <Modal
        visible={modalStep !== null}
        animationType="fade"
        transparent
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          {modalStep === 'confirm' && selectedItem && (
            <View style={styles.modalBox}>
              <Text style={styles.modalItemIcon}>{selectedItem.icon}</Text>
              <Text style={styles.modalItemName}>{selectedItem.name}</Text>
              <View style={styles.modalCostRow}>
                <Text style={styles.modalCostLabel}>消耗</Text>
                <GoldCoin size={22} />
                <Text style={styles.modalCostNum}> {selectedItem.costPoints}</Text>
              </View>
              <View style={styles.modalBalanceRow}>
                <Text style={styles.modalBalance}>兑换后剩余：</Text>
                <GoldCoin size={14} />
                <Text style={styles.modalBalance}> {points - selectedItem.costPoints}</Text>
              </View>
              <Text style={styles.modalHint}>爸爸妈妈收到后会给你哦！</Text>
              <View style={styles.modalBtnRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleCloseModal}>
                  <Text style={styles.cancelBtnText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                  <Text style={styles.confirmBtnText}>确认兑换</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {modalStep === 'success' && selectedItem && (
            <Animated.View style={[styles.modalBox, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
              <Text style={styles.successEmoji}>🎉</Text>
              <Text style={styles.successTitle}>兑换成功！</Text>
              <Text style={styles.successItem}>{selectedItem.icon} {selectedItem.name}</Text>
              <Text style={styles.successHint}>
                已通知爸爸妈妈，{'\n'}等他们给你兑现哦！
              </Text>
              <View style={styles.successCoinRow}>
                <GoldCoin size={18} />
                <Text style={styles.successCoinText}> 剩余金币 {points}</Text>
              </View>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleCloseModal}>
                <Text style={styles.confirmBtnText}>好的！</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── 商品卡片（网格单元）─────────────────────────────────────

function ShopCard({
  item, points, onPress,
}: {
  item: ShopItem; points: number; onPress: () => void;
}) {
  const pressScale = useRef(new Animated.Value(1)).current;
  const canAfford  = points >= item.costPoints;
  const diff       = item.costPoints - points;

  const handlePressIn  = () => {
    if (!canAfford) return;
    Animated.spring(pressScale, { toValue: 0.95, useNativeDriver: true, speed: 50 }).start();
  };
  const handlePressOut = () =>
    Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

  return (
    <Animated.View style={[
      styles.shopCard,
      !canAfford && styles.shopCardDim,
      { transform: [{ scale: pressScale }] },
    ]}>
      <Text style={styles.shopItemIcon}>{item.icon}</Text>
      <Text style={styles.shopItemName} numberOfLines={2}>{item.name}</Text>
      <View style={styles.shopCoinRow}>
        <GoldCoin size={16} />
        <Text style={styles.shopCoinText}> {item.costPoints}</Text>
      </View>
      {canAfford ? (
        <TouchableOpacity
          style={styles.redeemBtn}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.8}
          accessibilityLabel={`兑换 ${item.name}，需要 ${item.costPoints} 金币`}
          accessibilityRole="button"
        >
          <Text style={styles.redeemBtnText}>兑换</Text>
        </TouchableOpacity>
      ) : (
        <View style={[styles.lackBtn, styles.lackBtnRow]} accessibilityLabel={`金币不足，还差 ${diff} 金币`}>
          <Text style={styles.lackBtnText}>差 </Text>
          <GoldCoin size={13} />
          <Text style={styles.lackBtnText}>{diff}</Text>
        </View>
      )}
    </Animated.View>
  );
}

// ── 兑换记录卡片 ────────────────────────────────────────────

function RedemptionCard({ redemption }: { redemption: Redemption }) {
  const info = STATUS_MAP[redemption.status];
  const date = new Date(redemption.createdAt);
  const dateStr = `${date.getMonth() + 1}月${date.getDate()}日`;

  return (
    <View style={styles.recordCard}>
      <Text style={styles.recordIcon}>{redemption.itemIcon}</Text>
      <View style={styles.recordInfo}>
        <Text style={styles.recordName}>{redemption.itemName}</Text>
        <View style={styles.recordMetaRow}>
          <GoldCoin size={13} />
          <Text style={styles.recordMeta}> {redemption.costPoints} 金币  ·  {dateStr}</Text>
        </View>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: info.color + '22' }]}>
        <Text style={styles.statusIcon}>{info.icon}</Text>
        <Text style={[styles.statusLabel, { color: info.color }]}>{info.label}</Text>
      </View>
    </View>
  );
}

// ── 样式 ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  // Header
  header: {
    backgroundColor: ORANGE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  coinBadge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 22,
    flexDirection: 'row', alignItems: 'center',
  },
  coinText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0E8D0',
  },
  tabBtn: {
    flex: 1, paddingVertical: 13, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  tabBtnActive: { borderBottomWidth: 3, borderBottomColor: ORANGE },
  tabBtnText: { fontSize: 15, fontWeight: '600', color: '#aaa' },
  tabBtnTextActive: { color: ORANGE },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#EF4444', marginLeft: 2, marginTop: -4,
  },

  // Grid (商城)
  gridContent: { padding: 16, paddingTop: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },

  shopCard: {
    width: CARD_W,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 4,
  },
  shopCardDim: { opacity: 0.65 },
  shopItemIcon: { fontSize: 52, marginBottom: 8 },
  shopItemName: {
    fontSize: 15, fontWeight: '700', color: '#1A1A2E',
    textAlign: 'center', marginBottom: 8, minHeight: 40,
  },
  shopCoinRow: {
    backgroundColor: '#FFF3E0', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 4, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center',
  },
  shopCoinText: { fontSize: 15, fontWeight: '700', color: GOLD },
  redeemBtn: {
    backgroundColor: ORANGE, borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 10, width: '100%', alignItems: 'center',
  },
  redeemBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  lackBtn: {
    backgroundColor: '#F5F5F5', borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 10, width: '100%', alignItems: 'center',
  },
  lackBtnRow: { flexDirection: 'row', justifyContent: 'center' },
  lackBtnText: { color: '#aaa', fontSize: 14, fontWeight: '600' },

  // Records (兑换记录)
  recordsContent: { padding: 16, paddingTop: 18 },
  recordCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center', marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
  },
  recordIcon: { fontSize: 40, marginRight: 14 },
  recordInfo: { flex: 1 },
  recordName: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 4 },
  recordMetaRow: { flexDirection: 'row', alignItems: 'center' },
  recordMeta: { fontSize: 13, color: '#888' },
  statusBadge: {
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
    alignItems: 'center', minWidth: 60,
  },
  statusIcon: { fontSize: 16, marginBottom: 2 },
  statusLabel: { fontSize: 11, fontWeight: '700' },

  // Empty
  emptyBox: {
    flex: 1, alignItems: 'center', paddingTop: 80, gap: 10,
  },
  emptyIcon: { fontSize: 72, marginBottom: 8 },
  emptyText: { fontSize: 20, fontWeight: 'bold', color: '#555' },
  emptyHint: { fontSize: 15, color: '#aaa', textAlign: 'center' },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center', padding: 32,
  },
  modalBox: {
    backgroundColor: '#fff', borderRadius: 28, padding: 28,
    width: '100%', alignItems: 'center',
  },
  modalItemIcon: { fontSize: 72, marginBottom: 8 },
  modalItemName: {
    fontSize: 22, fontWeight: 'bold', color: '#1A1A2E', marginBottom: 18,
  },
  modalCostRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8,
  },
  modalCostLabel: { fontSize: 16, color: '#888' },
  modalCostNum: { fontSize: 24, fontWeight: 'bold', color: GOLD },
  modalBalanceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  modalBalance: { fontSize: 13, color: '#aaa' },
  modalHint: {
    fontSize: 14, color: '#FF8C00', fontWeight: '600',
    marginBottom: 24, textAlign: 'center',
  },
  modalBtnRow: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#E0E0E0', alignItems: 'center',
  },
  cancelBtnText: { fontSize: 16, color: '#888', fontWeight: '600' },
  confirmBtn: {
    flex: 2, paddingVertical: 14, borderRadius: 14,
    backgroundColor: ORANGE, alignItems: 'center',
  },
  confirmBtnText: { fontSize: 17, color: '#fff', fontWeight: '800' },

  // Success modal
  successEmoji: { fontSize: 72, marginBottom: 4 },
  successTitle: { fontSize: 26, fontWeight: 'bold', color: ORANGE, marginBottom: 10 },
  successItem: { fontSize: 20, fontWeight: '700', color: '#1A1A2E', marginBottom: 12 },
  successHint: {
    fontSize: 15, color: '#888', textAlign: 'center', lineHeight: 24, marginBottom: 16,
  },
  successCoinRow: {
    backgroundColor: '#FFF3E0', borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 8, marginBottom: 20,
    flexDirection: 'row', alignItems: 'center',
  },
  successCoinText: { fontSize: 16, fontWeight: '700', color: GOLD },
});
