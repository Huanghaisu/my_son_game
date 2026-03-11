// ============================================================
// 商城管理 — 奖励配置增删改
// ============================================================

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, TextInput, Switch, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/useAppStore';
import { ShopItem, ShopItemType } from '../../store/types';

const BLUE = '#4A6FA5';
const PURPLE = '#9C27B0';
const BG = '#F0F4FF';

const SHOP_ICONS = ['🍬', '📺', '🎮', '📖', '🎪', '🐰', '🐱', '🐶', '🎁', '🍦', '🎠', '🏖️',
  '🍕', '🎭', '🐣', '🌟', '🎨', '🎤', '🎬', '🛝', '🏆', '🎈'];

const TYPE_OPTIONS: { type: ShopItemType; label: string; color: string }[] = [
  { type: 'real', label: '现实需求', color: '#FF8C00' },
  { type: 'virtual_pet', label: '虚拟伙伴', color: '#4CAF50' },
  { type: 'virtual_item', label: '虚拟道具', color: BLUE },
];

type ShopForm = { name: string; icon: string; type: ShopItemType; costPoints: string; stock: string };

const defaultForm = (): ShopForm => ({
  name: '', icon: '🍬', type: 'real', costPoints: '20', stock: '',
});

export default function ShopManageScreen({ navigation }: any) {
  const { shopItems, addShopItem, updateShopItem, deleteShopItem } = useAppStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ShopForm>(defaultForm());

  const openAdd = () => {
    setEditingId(null);
    setForm(defaultForm());
    setModalVisible(true);
  };

  const openEdit = (item: ShopItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      icon: item.icon,
      type: item.type,
      costPoints: String(item.costPoints),
      stock: item.stock !== undefined ? String(item.stock) : '',
    });
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) { Alert.alert('提示', '请填写奖励名称'); return; }
    const pts = parseInt(form.costPoints, 10);
    if (isNaN(pts) || pts <= 0) { Alert.alert('提示', '积分必须是正整数'); return; }
    const stockNum = form.stock === '' ? undefined : parseInt(form.stock, 10);
    if (form.stock !== '' && (isNaN(stockNum!) || stockNum! < 0)) {
      Alert.alert('提示', '库存请填写正整数，或留空表示无限');
      return;
    }
    const data = {
      name: form.name.trim(),
      icon: form.icon,
      type: form.type,
      costPoints: pts,
      stock: stockNum,
      isEnabled: true,
    };
    if (editingId) {
      updateShopItem(editingId, data);
    } else {
      addShopItem(data);
    }
    setModalVisible(false);
  };

  const handleDelete = (item: ShopItem) => {
    Alert.alert('删除奖励', `确定删除「${item.name}」吗？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', onPress: () => deleteShopItem(item.id), style: 'destructive' },
    ]);
  };

  const typeInfo = (type: ShopItemType) => TYPE_OPTIONS.find(t => t.type === type)!;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>商城管理</Text>
        <TouchableOpacity onPress={openAdd} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ 添加</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {shopItems.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🏪</Text>
            <Text style={styles.emptyText}>暂无商品，点击「+ 添加」创建</Text>
          </View>
        )}
        {shopItems.map(item => {
          const info = typeInfo(item.type);
          return (
            <View key={item.id} style={[styles.card, !item.isEnabled && styles.cardDisabled]}>
              <View style={styles.cardMain}>
                <Text style={styles.itemIcon}>{item.icon}</Text>
                <View style={styles.itemInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <View style={[styles.typeBadge, { backgroundColor: info.color + '22' }]}>
                      <Text style={[styles.typeBadgeText, { color: info.color }]}>{info.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.itemMeta}>
                    ⭐ {item.costPoints} 积分
                    {item.stock !== undefined ? `  库存: ${item.stock}` : '  库存: ∞'}
                  </Text>
                </View>
                <Switch
                  value={item.isEnabled}
                  onValueChange={v => updateShopItem(item.id, { isEnabled: v })}
                  trackColor={{ false: '#ddd', true: PURPLE }}
                  thumbColor="#fff"
                  style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
                />
              </View>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
                  <Text style={styles.editBtnText}>✏️ 编辑</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.delBtn} onPress={() => handleDelete(item)}>
                  <Text style={styles.delBtnText}>🗑 删除</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* 编辑/添加 Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBg}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? '编辑奖励' : '添加奖励'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* 图标 */}
              <View style={styles.section}>
                <Text style={styles.label}>奖励图标</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.iconRow}>
                    {SHOP_ICONS.map(ic => (
                      <TouchableOpacity
                        key={ic}
                        style={[styles.iconBtn, form.icon === ic && styles.iconBtnSelected]}
                        onPress={() => setForm(f => ({ ...f, icon: ic }))}
                      >
                        <Text style={styles.iconText}>{ic}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* 名称 */}
              <View style={styles.section}>
                <Text style={styles.label}>奖励名称 *</Text>
                <TextInput
                  style={styles.input}
                  value={form.name}
                  onChangeText={v => setForm(f => ({ ...f, name: v }))}
                  placeholder="例如：看电视30分钟"
                  placeholderTextColor="#bbb"
                  maxLength={20}
                />
              </View>

              {/* 类型 */}
              <View style={styles.section}>
                <Text style={styles.label}>奖励类型 *</Text>
                <View style={styles.typeRow}>
                  {TYPE_OPTIONS.map(opt => (
                    <TouchableOpacity
                      key={opt.type}
                      style={[styles.typeBtn, form.type === opt.type && { backgroundColor: opt.color, borderColor: opt.color }]}
                      onPress={() => setForm(f => ({ ...f, type: opt.type }))}
                    >
                      <Text style={[styles.typeBtnText, form.type === opt.type && { color: '#fff' }]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 积分 */}
              <View style={styles.section}>
                <Text style={styles.label}>所需积分 *</Text>
                <TextInput
                  style={styles.input}
                  value={form.costPoints}
                  onChangeText={v => setForm(f => ({ ...f, costPoints: v.replace(/\D/g, '') }))}
                  keyboardType="number-pad"
                  placeholder="20"
                  placeholderTextColor="#bbb"
                />
              </View>

              {/* 库存 */}
              <View style={styles.section}>
                <Text style={styles.label}>库存次数（留空 = 无限次）</Text>
                <TextInput
                  style={styles.input}
                  value={form.stock}
                  onChangeText={v => setForm(f => ({ ...f, stock: v.replace(/\D/g, '') }))}
                  keyboardType="number-pad"
                  placeholder="不限"
                  placeholderTextColor="#bbb"
                />
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>💾 保存</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  backBtn: { paddingVertical: 4, paddingRight: 12 },
  backBtnText: { fontSize: 16, color: BLUE, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
  addBtn: { backgroundColor: PURPLE, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  list: { padding: 16, paddingBottom: 40 },

  emptyBox: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#bbb' },

  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    marginBottom: 10, shadowColor: '#000',
    shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  cardDisabled: { opacity: 0.5 },
  cardMain: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  itemIcon: { fontSize: 36, marginRight: 12 },
  itemInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' },
  itemName: { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  typeBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  typeBadgeText: { fontSize: 11, fontWeight: '600' },
  itemMeta: { fontSize: 13, color: '#888' },

  actions: { flexDirection: 'row', gap: 8 },
  editBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  editBtnText: { fontSize: 13, color: '#555' },
  delBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#FFB3B3', alignItems: 'center' },
  delBtnText: { fontSize: 13, color: '#F44336' },

  // Modal
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A2E' },
  closeBtn: { fontSize: 20, color: '#aaa', padding: 4 },

  section: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8 },

  iconRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  iconBtn: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  iconBtnSelected: { backgroundColor: '#F3E5F5', borderWidth: 2, borderColor: PURPLE },
  iconText: { fontSize: 24 },

  input: {
    borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: '#1A1A2E', backgroundColor: '#FAFAFA',
  },

  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#E0E0E0', alignItems: 'center' },
  typeBtnText: { fontSize: 12, color: '#555', fontWeight: '600' },

  saveBtn: { backgroundColor: PURPLE, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
