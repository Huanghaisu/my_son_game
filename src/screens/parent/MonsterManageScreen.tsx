// ============================================================
// 怪兽管理 — 怪兽队列增删查
// 支持：自定义创建 | 主题选择（可扩展多主题）
// ============================================================

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, TextInput, Alert, KeyboardAvoidingView, Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAppStore } from '../../store/useAppStore';
import { Monster } from '../../store/types';
import { MONSTER_TEMPLATES, getMonsterDifficulty } from '../../constants/templates';
import { MONSTER_THEMES, getMonsterImage } from '../../constants/monsterThemes';
import type { MonsterTheme, MonsterTemplate } from '../../store/types';

const BLUE = '#4A6FA5';
const BG = '#F0F4FF';

const MONSTER_ICONS = ['🍄', '☁️', '🦥', '🎈', '⭐', '🌈', '💎', '🐉', '👾', '🦕', '🌊', '🔥', '🦎', '🐙', '🌵', '🦠'];
const REWARD_ICONS = ['🍬', '📺', '🎮', '📖', '🎪', '🎁', '🍦', '🎡', '🍜', '🏖️', '🎠', '🏆'];

type AddMode = 'custom' | 'theme';

type MonsterForm = {
  name: string;
  icon: string;
  maxHP: string;
  reward: string;
  rewardIcon: string;
  imageUri?: string;
  imageKey?: string;
  themeId?: string;
};

const defaultMonsterForm = (): MonsterForm => ({
  name: '', icon: '🍄', maxHP: '100', reward: '', rewardIcon: '🎁',
  imageUri: undefined, imageKey: undefined, themeId: undefined,
});

const DIFF_COLORS: Record<string, string> = { easy: '#4CAF50', normal: '#FF8C00', hard: '#F44336' };
const DIFF_LABELS: Record<string, string> = { easy: '简单', normal: '普通', hard: '困难' };

export default function MonsterManageScreen({ navigation }: any) {
  const { monsters, addMonster, deleteMonster } = useAppStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [addMode, setAddMode] = useState<AddMode>('theme');
  const [selectedTheme, setSelectedTheme] = useState<MonsterTheme | null>(null);
  const [form, setForm] = useState<MonsterForm>(defaultMonsterForm());

  const openAdd = () => {
    setForm(defaultMonsterForm());
    setSelectedTheme(null);
    setAddMode('theme');
    setModalVisible(true);
  };

  // ---- 主题怪兽选中 → 填入表单 --------------------------------
  const applyThemeMonster = (theme: MonsterTheme, tmpl: MonsterTemplate) => {
    setForm({
      name: tmpl.name,
      icon: '👾',
      maxHP: String(tmpl.defaultMaxHP),
      reward: '',
      rewardIcon: '🎁',
      imageKey: tmpl.key,
      themeId: theme.id,
      imageUri: undefined,
    });
    setSelectedTheme(theme);
  };

  // ---- 内置模板快选 -------------------------------------------
  const applyTemplate = (tmpl: typeof MONSTER_TEMPLATES[0]) => {
    setForm(f => ({
      ...f,
      name: tmpl.name,
      icon: tmpl.icon,
      maxHP: String(tmpl.maxHP),
      reward: tmpl.reward,
      rewardIcon: tmpl.rewardIcon ?? '🎁',
      imageKey: undefined,
      themeId: undefined,
      imageUri: undefined,
    }));
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('提示', '我们需要访问相册才能上传怪兽图片哦');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setForm(f => ({ ...f, imageUri: result.assets[0].uri, imageKey: undefined, themeId: undefined }));
    }
  };

  const handleSave = () => {
    if (!form.name.trim()) { Alert.alert('提示', '请填写怪兽名称'); return; }
    if (!form.reward.trim()) { Alert.alert('提示', '请填写击倒奖励'); return; }
    const hp = parseInt(form.maxHP, 10);
    if (isNaN(hp) || hp < 10) { Alert.alert('提示', 'HP 最少为 10'); return; }

    addMonster({
      name: form.name.trim(),
      icon: form.icon,
      maxHP: hp,
      attack: Math.max(5, Math.floor(hp * 0.1)),
      reward: form.reward.trim(),
      rewardIcon: form.rewardIcon,
      imageUri: form.imageUri,
      imageKey: form.imageKey,
      themeId: form.themeId,
    });
    setModalVisible(false);
  };

  const handleDelete = (m: Monster) => {
    Alert.alert('删除怪兽', `确定删除「${m.name}」吗？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', onPress: () => deleteMonster(m.id), style: 'destructive' },
    ]);
  };

  const diffFromHP = (hp: string) => {
    const n = parseInt(hp, 10);
    return isNaN(n) ? 'easy' : getMonsterDifficulty(n);
  };

  // 当前选中主题怪兽的预览图
  const previewImage = form.themeId && form.imageKey
    ? getMonsterImage(form.themeId, form.imageKey)
    : null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>怪兽管理</Text>
        <TouchableOpacity onPress={openAdd} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ 添加</Text>
        </TouchableOpacity>
      </View>

      {/* ---- 怪兽列表 ----------------------------------------- */}
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {monsters.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>👾</Text>
            <Text style={styles.emptyText}>暂无怪兽，点击「+ 添加」创建</Text>
          </View>
        )}
        {monsters.map((m) => {
          const hpPct = m.currentHP / m.maxHP;
          const monImg = getMonsterImage(m.themeId, m.imageKey);
          return (
            <View key={m.id} style={[styles.card, m.isDefeated && styles.cardDefeated]}>
              <View style={styles.cardTop}>
                {monImg ? (
                  <Image source={monImg} style={styles.monsterImage} />
                ) : m.imageUri ? (
                  <Image source={{ uri: m.imageUri }} style={styles.monsterImage} />
                ) : (
                  <Text style={styles.monsterEmoji}>{m.icon}</Text>
                )}
                <View style={styles.monsterInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.monsterName}>{m.name}</Text>
                    <View style={[styles.diffBadge, { backgroundColor: DIFF_COLORS[m.difficulty] }]}>
                      <Text style={styles.diffText}>{DIFF_LABELS[m.difficulty]}</Text>
                    </View>
                    {m.themeId && (
                      <View style={styles.themeBadge}>
                        <Text style={styles.themeText}>
                          {MONSTER_THEMES.find(t => t.id === m.themeId)?.icon ?? '🎭'}
                        </Text>
                      </View>
                    )}
                  </View>
                  {m.isDefeated ? (
                    <Text style={styles.defeatedText}>✅ 已击倒 {m.defeatDate ?? ''}</Text>
                  ) : (
                    <>
                      <Text style={styles.hpLabel}>HP {m.currentHP} / {m.maxHP}</Text>
                      <View style={styles.hpBg}>
                        <View style={[styles.hpFill, { width: `${Math.round(hpPct * 100)}%` as any }]} />
                      </View>
                    </>
                  )}
                  <Text style={styles.rewardText}>{m.rewardIcon ?? '🎁'} {m.reward}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.delBtn} onPress={() => handleDelete(m)}>
                <Text style={styles.delBtnText}>🗑 删除</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        <View style={styles.diffGuide}>
          <Text style={styles.diffGuideTitle}>💡 难度参考</Text>
          <Text style={styles.diffGuideText}>
            🟢 简单（HP ≤ 100）  约 1-2 天击倒{'\n'}
            🟡 普通（HP 101-200）约 3-5 天击倒{'\n'}
            🔴 困难（HP ＞ 200）  约 1 周以上
          </Text>
        </View>
      </ScrollView>

      {/* ---- 添加怪兽 Modal ------------------------------------ */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBg}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>添加怪兽</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* 模式切换 Tab */}
            <View style={styles.modeTab}>
              <TouchableOpacity
                style={[styles.modeBtn, addMode === 'theme' && styles.modeBtnActive]}
                onPress={() => setAddMode('theme')}
              >
                <Text style={[styles.modeBtnText, addMode === 'theme' && styles.modeBtnTextActive]}>
                  🎭 主题选择
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, addMode === 'custom' && styles.modeBtnActive]}
                onPress={() => setAddMode('custom')}
              >
                <Text style={[styles.modeBtnText, addMode === 'custom' && styles.modeBtnTextActive]}>
                  ✏️ 自定义
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>

              {/* ======== 主题选择模式 ======== */}
              {addMode === 'theme' && (
                <View>
                  {/* 主题卡片列表 */}
                  {!selectedTheme ? (
                    <View style={styles.section}>
                      <Text style={styles.label}>选择主题</Text>
                      <View style={styles.themeGrid}>
                        {MONSTER_THEMES.map((theme) => (
                          <TouchableOpacity
                            key={theme.id}
                            style={styles.themeCard}
                            onPress={() => setSelectedTheme(theme)}
                          >
                            <Text style={styles.themeCardIcon}>{theme.icon}</Text>
                            <Text style={styles.themeCardName}>{theme.name}</Text>
                            <Text style={styles.themeCardCount}>{theme.monsters.length} 只怪兽</Text>
                          </TouchableOpacity>
                        ))}
                        {/* 未来主题占位 */}
                        <View style={[styles.themeCard, styles.themeCardLocked]}>
                          <Text style={styles.themeCardIcon}>🔒</Text>
                          <Text style={styles.themeCardName}>更多主题</Text>
                          <Text style={styles.themeCardCount}>敬请期待</Text>
                        </View>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.section}>
                      {/* 返回主题列表 */}
                      <TouchableOpacity
                        style={styles.backToTheme}
                        onPress={() => { setSelectedTheme(null); setForm(defaultMonsterForm()); }}
                      >
                        <Text style={styles.backToThemeText}>‹ {selectedTheme.name}主题</Text>
                      </TouchableOpacity>

                      <Text style={styles.label}>选择怪兽</Text>
                      <View style={styles.monsterThemeGrid}>
                        {selectedTheme.monsters.map((tmpl) => {
                          const img = getMonsterImage(selectedTheme.id, tmpl.key);
                          const isSelected = form.imageKey === tmpl.key && form.themeId === selectedTheme.id;
                          return (
                            <TouchableOpacity
                              key={tmpl.key}
                              style={[styles.themeMonsterCard, isSelected && styles.themeMonsterCardSelected]}
                              onPress={() => applyThemeMonster(selectedTheme, tmpl)}
                            >
                              {img ? (
                                <Image source={img} style={styles.themeMonsterImg} resizeMode="contain" />
                              ) : (
                                <Text style={styles.themeMonsterEmoji}>👾</Text>
                              )}
                              <Text style={styles.themeMonsterName} numberOfLines={2}>{tmpl.name}</Text>
                              <Text style={styles.themeMonsterHP}>HP {tmpl.defaultMaxHP}</Text>
                              {isSelected && (
                                <View style={styles.selectedBadge}>
                                  <Text style={styles.selectedBadgeText}>✓</Text>
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {/* 选中怪兽后的配置区 */}
                  {form.name !== '' && (
                    <View>
                      {/* 预览 */}
                      <View style={styles.themePreview}>
                        {previewImage && (
                          <Image source={previewImage} style={styles.themePreviewImg} resizeMode="contain" />
                        )}
                        <View style={styles.themePreviewInfo}>
                          <Text style={styles.themePreviewName}>{form.name}</Text>
                          <Text style={styles.themePreviewHP}>
                            默认 HP {form.maxHP} · {DIFF_LABELS[diffFromHP(form.maxHP)]}
                          </Text>
                        </View>
                      </View>

                      {/* HP 调整 */}
                      <View style={styles.section}>
                        <Text style={styles.label}>
                          生命值（HP）— 难度：{DIFF_LABELS[diffFromHP(form.maxHP)]}
                        </Text>
                        <TextInput
                          style={styles.input}
                          value={form.maxHP}
                          onChangeText={v => setForm(f => ({ ...f, maxHP: v.replace(/\D/g, '') }))}
                          keyboardType="number-pad"
                          placeholderTextColor="#bbb"
                        />
                      </View>

                      {/* 奖励图标 */}
                      <View style={styles.section}>
                        <Text style={styles.label}>奖励图标</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          <View style={styles.iconRow}>
                            {REWARD_ICONS.map(ic => (
                              <TouchableOpacity
                                key={ic}
                                style={[styles.iconBtn, form.rewardIcon === ic && styles.iconBtnSelected]}
                                onPress={() => setForm(f => ({ ...f, rewardIcon: ic }))}
                              >
                                <Text style={styles.iconText}>{ic}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </ScrollView>
                      </View>

                      {/* 击倒奖励 */}
                      <View style={styles.section}>
                        <Text style={styles.label}>击倒奖励 *</Text>
                        <TextInput
                          style={styles.input}
                          value={form.reward}
                          onChangeText={v => setForm(f => ({ ...f, reward: v }))}
                          placeholder="例如：去游乐场玩一次"
                          placeholderTextColor="#bbb"
                          maxLength={30}
                        />
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* ======== 自定义模式 ======== */}
              {addMode === 'custom' && (
                <View>
                  {/* 内置模板快选 */}
                  <View style={styles.section}>
                    <Text style={styles.label}>快速选模板</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.templateRow}>
                        {MONSTER_TEMPLATES.map(t => (
                          <TouchableOpacity key={t.name} style={styles.templateChip} onPress={() => applyTemplate(t)}>
                            <Text style={styles.templateIcon}>{t.icon}</Text>
                            <Text style={styles.templateName}>{t.name}</Text>
                            <Text style={styles.templateHP}>HP {t.maxHP}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                    <View style={styles.divider} />
                  </View>

                  {/* 怪兽图标 / 自定义图片 */}
                  <View style={styles.section}>
                    <Text style={styles.label}>怪兽形象</Text>
                    <View style={styles.iconContainer}>
                      <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                        {form.imageUri ? (
                          <Image source={{ uri: form.imageUri }} style={styles.previewImg} />
                        ) : (
                          <View style={styles.uploadPlaceholder}>
                            <Text style={styles.uploadIcon}>📷</Text>
                            <Text style={styles.uploadText}>上传图片</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingRight: 20 }}>
                        <View style={styles.iconRow}>
                          {MONSTER_ICONS.map(ic => (
                            <TouchableOpacity
                              key={ic}
                              style={[styles.iconBtn, form.icon === ic && !form.imageUri && styles.iconBtnSelected]}
                              onPress={() => setForm(f => ({ ...f, icon: ic, imageUri: undefined }))}
                            >
                              <Text style={styles.iconText}>{ic}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </ScrollView>
                    </View>
                  </View>

                  {/* 怪兽名称 */}
                  <View style={styles.section}>
                    <Text style={styles.label}>怪兽名称 *</Text>
                    <TextInput
                      style={styles.input}
                      value={form.name}
                      onChangeText={v => setForm(f => ({ ...f, name: v }))}
                      placeholder="例如：小蘑菇怪"
                      placeholderTextColor="#bbb"
                      maxLength={16}
                    />
                  </View>

                  {/* HP */}
                  <View style={styles.section}>
                    <Text style={styles.label}>
                      生命值（HP）* — 难度：{DIFF_LABELS[diffFromHP(form.maxHP)]}
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={form.maxHP}
                      onChangeText={v => setForm(f => ({ ...f, maxHP: v.replace(/\D/g, '') }))}
                      keyboardType="number-pad"
                      placeholder="100"
                      placeholderTextColor="#bbb"
                    />
                  </View>

                  {/* 奖励图标 */}
                  <View style={styles.section}>
                    <Text style={styles.label}>奖励图标</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.iconRow}>
                        {REWARD_ICONS.map(ic => (
                          <TouchableOpacity
                            key={ic}
                            style={[styles.iconBtn, form.rewardIcon === ic && styles.iconBtnSelected]}
                            onPress={() => setForm(f => ({ ...f, rewardIcon: ic }))}
                          >
                            <Text style={styles.iconText}>{ic}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </View>

                  {/* 击倒奖励 */}
                  <View style={styles.section}>
                    <Text style={styles.label}>击倒奖励 *</Text>
                    <TextInput
                      style={styles.input}
                      value={form.reward}
                      onChangeText={v => setForm(f => ({ ...f, reward: v }))}
                      placeholder="例如：去游乐场玩一次"
                      placeholderTextColor="#bbb"
                      maxLength={30}
                    />
                  </View>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveBtn, !form.name && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!form.name}
            >
              <Text style={styles.saveBtnText}>👾 添加怪兽</Text>
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
  addBtn: { backgroundColor: '#FF8C00', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  list: { padding: 16, paddingBottom: 40 },

  emptyBox: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#bbb' },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    marginBottom: 12, shadowColor: '#000',
    shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  cardDefeated: { opacity: 0.55 },
  cardTop: { flexDirection: 'row', marginBottom: 10 },
  monsterEmoji: { fontSize: 44, marginRight: 12, alignSelf: 'flex-start', marginTop: 4 },
  monsterImage: { width: 56, height: 56, borderRadius: 12, marginRight: 12, marginTop: 4, resizeMode: 'contain' },
  monsterInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' },
  monsterName: { fontSize: 17, fontWeight: '700', color: '#1A1A2E' },
  diffBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 7 },
  diffText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  themeBadge: { backgroundColor: '#F3E8FF', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 7 },
  themeText: { fontSize: 12 },
  defeatedText: { fontSize: 13, color: '#4CAF50', fontWeight: '600', marginVertical: 4 },
  hpLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
  hpBg: { height: 6, backgroundColor: '#FFEBEE', borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  hpFill: { height: '100%', backgroundColor: '#F44336', borderRadius: 3 },
  rewardText: { fontSize: 12, color: '#888' },
  delBtn: { paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#FFB3B3', alignItems: 'center' },
  delBtnText: { fontSize: 13, color: '#F44336' },

  diffGuide: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    marginTop: 4, borderLeftWidth: 4, borderLeftColor: '#9C27B0',
  },
  diffGuideTitle: { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 8 },
  diffGuideText: { fontSize: 12, color: '#777', lineHeight: 22 },

  // Modal
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: '92%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A2E' },
  closeBtnText: { fontSize: 20, color: '#aaa', padding: 4 },

  // 模式 Tab
  modeTab: { flexDirection: 'row', backgroundColor: '#F5F5F5', borderRadius: 12, padding: 4, marginBottom: 16 },
  modeBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  modeBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  modeBtnText: { fontSize: 14, color: '#888', fontWeight: '600' },
  modeBtnTextActive: { color: '#1A1A2E', fontWeight: '700' },

  // 主题选择
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
  themeCard: {
    width: '45%', backgroundColor: '#F8F0FF', borderRadius: 16,
    padding: 16, alignItems: 'center', borderWidth: 2, borderColor: '#E9D5FF',
  },
  themeCardLocked: { backgroundColor: '#F5F5F5', borderColor: '#E0E0E0', opacity: 0.6 },
  themeCardIcon: { fontSize: 36, marginBottom: 8 },
  themeCardName: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginBottom: 4 },
  themeCardCount: { fontSize: 12, color: '#888' },

  backToTheme: { marginBottom: 12 },
  backToThemeText: { fontSize: 15, color: BLUE, fontWeight: '600' },

  monsterThemeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  themeMonsterCard: {
    width: '30%', backgroundColor: '#F8F8F8', borderRadius: 14,
    padding: 10, alignItems: 'center', borderWidth: 2, borderColor: '#eee',
  },
  themeMonsterCardSelected: { borderColor: '#FF8C00', backgroundColor: '#FFF5E0' },
  themeMonsterImg: { width: 60, height: 60, marginBottom: 6 },
  themeMonsterEmoji: { fontSize: 40, marginBottom: 6 },
  themeMonsterName: { fontSize: 11, color: '#333', textAlign: 'center', fontWeight: '600', marginBottom: 2 },
  themeMonsterHP: { fontSize: 10, color: '#999' },
  selectedBadge: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: '#FF8C00', width: 18, height: 18,
    borderRadius: 9, alignItems: 'center', justifyContent: 'center',
  },
  selectedBadgeText: { color: '#fff', fontSize: 11, fontWeight: '900' },

  themePreview: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF5E0',
    borderRadius: 14, padding: 12, marginBottom: 16, gap: 12,
  },
  themePreviewImg: { width: 64, height: 64 },
  themePreviewInfo: { flex: 1 },
  themePreviewName: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 4 },
  themePreviewHP: { fontSize: 12, color: '#888' },

  section: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8 },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginTop: 14 },

  templateRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  templateChip: {
    alignItems: 'center', backgroundColor: '#F5F5F5',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, minWidth: 72,
  },
  templateIcon: { fontSize: 22, marginBottom: 2 },
  templateName: { fontSize: 11, color: '#555', textAlign: 'center' },
  templateHP: { fontSize: 10, color: '#999', marginTop: 1 },

  iconRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  iconBtn: {
    width: 44, height: 44, borderRadius: 10, backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center',
  },
  iconBtnSelected: { backgroundColor: '#FFF3E0', borderWidth: 2, borderColor: '#FF8C00' },
  iconText: { fontSize: 24 },

  iconContainer: { flexDirection: 'row', alignItems: 'center' },
  uploadBtn: {
    width: 60, height: 60, borderRadius: 12, borderWidth: 1, borderColor: '#ccc',
    borderStyle: 'dashed', marginRight: 12, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#FAFAFA', overflow: 'hidden',
  },
  previewImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  uploadPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  uploadIcon: { fontSize: 18, marginBottom: 2 },
  uploadText: { fontSize: 9, color: '#888' },

  input: {
    borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: '#1A1A2E',
    backgroundColor: '#FAFAFA',
  },

  saveBtn: {
    backgroundColor: '#FF8C00', borderRadius: 14, paddingVertical: 15,
    alignItems: 'center', marginTop: 8,
  },
  saveBtnDisabled: { backgroundColor: '#ccc' },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
