// ============================================================
// 家长端设置页
// ============================================================

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, Switch, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/useAppStore';
import GoldCoin from '../../components/GoldCoin';

const BLUE = '#4A6FA5';
const BG = '#F0F4FF';

const AVATARS = ['🦁', '🐯', '🐻', '🐼', '🐨', '🦊', '🐸', '🐧', '🦄', '🐬', '🦋', '🐝'];

export default function ParentSettingsScreen() {
  const { settings, points, updateSettings, verifyPIN, switchToChild, setPoints } = useAppStore();

  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinStep, setPinStep] = useState<'verify' | 'new' | 'confirm'>('verify');
  const [pinInput, setPinInput] = useState('');
  const [newPin, setNewPin] = useState('');
  const [nameEditing, setNameEditing] = useState(false);
  const [nameInput, setNameInput] = useState(settings.childName);

  // 金币管理 Modal
  const [coinsModalVisible, setCoinsModalVisible] = useState(false);
  const [coinsInput, setCoinsInput] = useState('');

  const openPinChange = () => {
    setPinStep('verify');
    setPinInput('');
    setNewPin('');
    setPinModalVisible(true);
  };

  const handlePinNext = () => {
    if (pinStep === 'verify') {
      if (!verifyPIN(pinInput)) {
        Alert.alert('错误', '当前 PIN 不正确');
        setPinInput('');
        return;
      }
      setPinStep('new');
      setPinInput('');
    } else if (pinStep === 'new') {
      if (pinInput.length !== 4 || !/^\d{4}$/.test(pinInput)) {
        Alert.alert('提示', '请输入 4 位数字 PIN');
        return;
      }
      setNewPin(pinInput);
      setPinStep('confirm');
      setPinInput('');
    } else {
      if (pinInput !== newPin) {
        Alert.alert('不一致', '两次输入的 PIN 不一样，请重新输入');
        setPinInput('');
        setPinStep('new');
        setNewPin('');
        return;
      }
      updateSettings({ parentPIN: newPin });
      setPinModalVisible(false);
      Alert.alert('成功', 'PIN 已更新');
    }
  };

  const handleSaveName = () => {
    if (!nameInput.trim()) { Alert.alert('提示', '昵称不能为空'); return; }
    updateSettings({ childName: nameInput.trim() });
    setNameEditing(false);
  };

  const handleSwitchToChild = () => {
    Alert.alert('切换到儿童模式', '确定切换吗？', [
      { text: '取消', style: 'cancel' },
      { text: '切换', onPress: switchToChild },
    ]);
  };

  const openCoinsModal = () => {
    setCoinsInput(String(points));
    setCoinsModalVisible(true);
  };

  const handleCoinsReset = () => {
    Alert.alert('清零确认', `确定将金币清零吗？\n当前余额：${points} 枚`, [
      { text: '取消', style: 'cancel' },
      {
        text: '确认清零', style: 'destructive',
        onPress: () => { setPoints(0); setCoinsModalVisible(false); },
      },
    ]);
  };

  const handleCoinsSave = () => {
    const val = parseInt(coinsInput, 10);
    if (isNaN(val) || val < 0) {
      Alert.alert('提示', '请输入有效的金币数量（≥ 0）');
      return;
    }
    Alert.alert('确认修改', `将金币余额设置为 ${val} 枚？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '确认',
        onPress: () => { setPoints(val); setCoinsModalVisible(false); },
      },
    ]);
  };

  const PIN_STEP_TITLE: Record<string, string> = {
    verify: '请输入当前 PIN',
    new: '请输入新 PIN（4位数字）',
    confirm: '再次确认新 PIN',
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>设置</Text>

        {/* 孩子档案 */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>👧 孩子档案</Text>

          {/* 头像选择 */}
          <Text style={styles.fieldLabel}>头像</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarScroll}>
            <View style={styles.avatarRow}>
              {AVATARS.map(av => (
                <TouchableOpacity
                  key={av}
                  style={[styles.avatarBtn, settings.childAvatar === av && styles.avatarBtnSelected]}
                  onPress={() => updateSettings({ childAvatar: av })}
                >
                  <Text style={styles.avatarText}>{av}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* 昵称 */}
          <Text style={styles.fieldLabel}>昵称</Text>
          {nameEditing ? (
            <View style={styles.nameEditRow}>
              <TextInput
                style={styles.nameInput}
                value={nameInput}
                onChangeText={setNameInput}
                maxLength={10}
                autoFocus
              />
              <TouchableOpacity style={styles.saveMiniBtn} onPress={handleSaveName}>
                <Text style={styles.saveMiniText}>保存</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelMiniBtn} onPress={() => { setNameEditing(false); setNameInput(settings.childName); }}>
                <Text style={styles.cancelMiniText}>取消</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.nameDisplay} onPress={() => { setNameInput(settings.childName); setNameEditing(true); }}>
              <Text style={styles.nameText}>{settings.childName || '（未设置）'}</Text>
              <Text style={styles.editHint}>✏️ 修改</Text>
            </TouchableOpacity>
          )}

          {/* 年龄段 */}
          <Text style={styles.fieldLabel}>年龄段</Text>
          <View style={styles.ageRow}>
            {[
              { value: '3to4', label: '3-4 岁' },
              { value: '5to6', label: '5-6 岁' },
            ].map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.ageBtn, settings.ageGroup === opt.value && styles.ageBtnSelected]}
                onPress={() => updateSettings({ ageGroup: opt.value as any })}
              >
                <Text style={[styles.ageBtnText, settings.ageGroup === opt.value && { color: '#fff' }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 任务确认模式 */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>✅ 任务确认模式</Text>
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeBtn, settings.taskConfirmMode === 'auto' && styles.modeBtnSelected]}
              onPress={() => updateSettings({ taskConfirmMode: 'auto' })}
            >
              <Text style={styles.modeBtnIcon}>🤖</Text>
              <Text style={[styles.modeBtnTitle, settings.taskConfirmMode === 'auto' && { color: BLUE }]}>
                自动确认
              </Text>
              <Text style={styles.modeBtnDesc}>孩子完成后{'\n'}立即发卡牌</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, settings.taskConfirmMode === 'parent_confirm' && styles.modeBtnSelected]}
              onPress={() => updateSettings({ taskConfirmMode: 'parent_confirm' })}
            >
              <Text style={styles.modeBtnIcon}>👨‍👩‍👧</Text>
              <Text style={[styles.modeBtnTitle, settings.taskConfirmMode === 'parent_confirm' && { color: BLUE }]}>
                家长确认
              </Text>
              <Text style={styles.modeBtnDesc}>家长审核后{'\n'}才发卡牌</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 金币管理 */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>💰 金币管理</Text>
          <View style={styles.coinsRow}>
            <View style={styles.coinsBalanceWrap}>
              <GoldCoin size={28} />
              <View style={styles.coinsTextWrap}>
                <Text style={styles.coinsLabel}>当前余额</Text>
                <Text style={styles.coinsValue}>{points} 枚</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.coinsEditBtn} onPress={openCoinsModal}>
              <Text style={styles.coinsEditText}>✏️ 调整</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.coinsHint}>可手动修改余额或清零，适合兑换奖励后核对账目</Text>
        </View>

        {/* 安全设置 */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🔐 安全设置</Text>
          <TouchableOpacity style={styles.listRow} onPress={openPinChange}>
            <Text style={styles.listRowText}>修改家长 PIN 密码</Text>
            <Text style={styles.listRowArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* 切换到儿童模式 */}
        <TouchableOpacity style={styles.switchBtn} onPress={handleSwitchToChild}>
          <Text style={styles.switchBtnText}>👧 切换到儿童模式</Text>
        </TouchableOpacity>

        <Text style={styles.version}>小勇者大冒险 v1.0.0</Text>
      </ScrollView>

      {/* 金币调整 Modal */}
      <Modal visible={coinsModalVisible} animationType="fade" transparent>
        <View style={styles.pinModalBg}>
          <View style={styles.pinModalBox}>
            <Text style={styles.pinModalTitle}>调整金币余额</Text>

            {/* 当前余额 */}
            <View style={styles.coinsCurrent}>
              <GoldCoin size={22} />
              <Text style={styles.coinsCurrentText}>当前：{points} 枚</Text>
            </View>

            {/* 输入新数值 */}
            <Text style={styles.coinsInputLabel}>设置新的金币数量</Text>
            <TextInput
              style={styles.pinInput}
              value={coinsInput}
              onChangeText={v => setCoinsInput(v.replace(/\D/g, ''))}
              keyboardType="number-pad"
              placeholder="输入金币数量"
              placeholderTextColor="#ccc"
              autoFocus
              maxLength={6}
            />

            {/* 操作按钮 */}
            <View style={styles.pinBtnRow}>
              <TouchableOpacity style={styles.pinCancelBtn} onPress={() => setCoinsModalVisible(false)}>
                <Text style={styles.pinCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.coinsZeroBtn} onPress={handleCoinsReset}>
                <Text style={styles.coinsZeroText}>清零</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pinNextBtn} onPress={handleCoinsSave}>
                <Text style={styles.pinNextText}>确认</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* PIN 修改 Modal */}
      <Modal visible={pinModalVisible} animationType="fade" transparent>
        <View style={styles.pinModalBg}>
          <View style={styles.pinModalBox}>
            <Text style={styles.pinModalTitle}>{PIN_STEP_TITLE[pinStep]}</Text>
            <TextInput
              style={styles.pinInput}
              value={pinInput}
              onChangeText={v => setPinInput(v.replace(/\D/g, '').slice(0, 4))}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              placeholder="····"
              placeholderTextColor="#ccc"
              autoFocus
            />
            <View style={styles.pinBtnRow}>
              <TouchableOpacity style={styles.pinCancelBtn} onPress={() => setPinModalVisible(false)}>
                <Text style={styles.pinCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pinNextBtn} onPress={handlePinNext}>
                <Text style={styles.pinNextText}>
                  {pinStep === 'confirm' ? '确认' : '下一步'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  content: { padding: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#1A1A2E', marginBottom: 20 },

  sectionCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18,
    marginBottom: 14, shadowColor: '#000',
    shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 16 },

  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#888', marginBottom: 8, marginTop: 4 },

  avatarScroll: { marginBottom: 14 },
  avatarRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  avatarBtn: {
    width: 48, height: 48, borderRadius: 12, backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarBtnSelected: { backgroundColor: '#E8F0FE', borderWidth: 2.5, borderColor: BLUE },
  avatarText: { fontSize: 28 },

  nameDisplay: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  nameText: { fontSize: 18, fontWeight: '600', color: '#1A1A2E' },
  editHint: { fontSize: 13, color: BLUE },

  nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  nameInput: {
    flex: 1, borderWidth: 1.5, borderColor: BLUE, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, fontSize: 16, color: '#1A1A2E',
  },
  saveMiniBtn: { backgroundColor: BLUE, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  saveMiniText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  cancelMiniBtn: { paddingHorizontal: 8 },
  cancelMiniText: { color: '#888', fontSize: 13 },

  ageRow: { flexDirection: 'row', gap: 10 },
  ageBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5,
    borderColor: '#E0E0E0', alignItems: 'center',
  },
  ageBtnSelected: { backgroundColor: BLUE, borderColor: BLUE },
  ageBtnText: { fontSize: 15, fontWeight: '600', color: '#555' },

  modeRow: { flexDirection: 'row', gap: 12 },
  modeBtn: {
    flex: 1, padding: 14, borderRadius: 14, borderWidth: 1.5,
    borderColor: '#E0E0E0', alignItems: 'center',
  },
  modeBtnSelected: { borderColor: BLUE, backgroundColor: '#E8F0FE' },
  modeBtnIcon: { fontSize: 28, marginBottom: 6 },
  modeBtnTitle: { fontSize: 14, fontWeight: '700', color: '#555', marginBottom: 4 },
  modeBtnDesc: { fontSize: 11, color: '#888', textAlign: 'center', lineHeight: 16 },

  listRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#f5f5f5',
  },
  listRowText: { fontSize: 15, color: '#1A1A2E' },
  listRowArrow: { fontSize: 22, color: '#ccc' },

  // 金币管理
  coinsRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 10,
  },
  coinsBalanceWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  coinsTextWrap: { gap: 2 },
  coinsLabel: { fontSize: 12, color: '#888', fontWeight: '500' },
  coinsValue: { fontSize: 22, fontWeight: '800', color: '#1A1A2E' },
  coinsEditBtn: {
    backgroundColor: '#FFF7E6', borderWidth: 1.5, borderColor: '#FFC107',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
  },
  coinsEditText: { fontSize: 14, color: '#B8860B', fontWeight: '700' },
  coinsHint: { fontSize: 12, color: '#aaa', lineHeight: 18 },

  // 金币 Modal 专用
  coinsCurrent: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFF7E6', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 10, marginBottom: 20, width: '100%',
  },
  coinsCurrentText: { fontSize: 16, fontWeight: '700', color: '#B8860B' },
  coinsInputLabel: { fontSize: 13, color: '#888', fontWeight: '600', alignSelf: 'flex-start', marginBottom: 8 },
  coinsZeroBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    backgroundColor: '#FFF0F0', borderWidth: 1.5, borderColor: '#FFB3B3', alignItems: 'center',
  },
  coinsZeroText: { fontSize: 15, color: '#F44336', fontWeight: '700' },

  switchBtn: {
    backgroundColor: BLUE, borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', marginBottom: 14,
  },
  switchBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },

  version: { textAlign: 'center', fontSize: 12, color: '#ccc', marginTop: 8 },

  // PIN Modal
  pinModalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  pinModalBox: { backgroundColor: '#fff', borderRadius: 20, padding: 28, width: '80%', alignItems: 'center' },
  pinModalTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A2E', marginBottom: 20, textAlign: 'center' },
  pinInput: {
    borderWidth: 2, borderColor: BLUE, borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 12, fontSize: 24,
    letterSpacing: 8, textAlign: 'center', width: '100%', marginBottom: 20,
  },
  pinBtnRow: { flexDirection: 'row', gap: 12, width: '100%' },
  pinCancelBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5,
    borderColor: '#ddd', alignItems: 'center',
  },
  pinCancelText: { fontSize: 15, color: '#888', fontWeight: '600' },
  pinNextBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: BLUE, alignItems: 'center' },
  pinNextText: { fontSize: 15, color: '#fff', fontWeight: '700' },
});
