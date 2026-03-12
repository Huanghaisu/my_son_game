// ============================================================
// 任务管理 — 增删改查任务列表
// ============================================================

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, TextInput, Switch, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/useAppStore';
import { Task, TaskType, StreakMilestone } from '../../store/types';
import { NORMAL_TASK_TEMPLATES, HARD_TASK_TEMPLATES } from '../../constants/templates';

const BLUE = '#4A6FA5';
const BG = '#F0F4FF';

const TASK_ICONS = ['🦷', '🍚', '🥢', '👕', '🧼', '🌙', '📚', '🎨', '✏️', '⚽', '🧸', '🧹',
  '🍎', '🛁', '🎵', '🏃', '🎯', '💊', '📖', '🌟', '🏠', '🤸'];
const TIME_OPTIONS = ['', '早晨', '上午', '中午', '下午', '晚上', '睡前'];

type FormState = {
  name: string;
  icon: string;
  type: TaskType;
  attackPower: string;
  points: string;
  timeRequirement: string;
  streakEnabled: boolean;
  milestone3: string;
  milestone7: string;
  milestone15: string;
};

const defaultForm = (): FormState => ({
  name: '', icon: '🦷', type: 'normal', attackPower: '10', points: '5', timeRequirement: '',
  streakEnabled: false, milestone3: '', milestone7: '', milestone15: '',
});

export default function TaskManageScreen({ navigation }: any) {
  const { tasks, addTask, updateTask, deleteTask } = useAppStore();


  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm());

  const normalTasks = tasks.filter(t => t.type === 'normal');
  const hardTasks = tasks.filter(t => t.type === 'hard');

  const openAdd = () => {
    setEditingId(null);
    setForm(defaultForm());
    setModalVisible(true);
  };

  const openEdit = (task: Task) => {
    setEditingId(task.id);
    const milestones = task.streakMilestones ?? [];
    const getMilestone = (days: 3 | 7 | 15) =>
      milestones.find(m => m.days === days)?.rewardDescription ?? '';
    setForm({
      name: task.name,
      icon: task.icon,
      type: task.type,
      attackPower: String(task.attackPower),
      points: String(task.points),
      timeRequirement: task.timeRequirement ?? '',
      streakEnabled: task.streakEnabled,
      milestone3: getMilestone(3),
      milestone7: getMilestone(7),
      milestone15: getMilestone(15),
    });
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      Alert.alert('提示', '请填写任务名称');
      return;
    }
    const ap = parseInt(form.attackPower, 10);
    const pts = parseInt(form.points, 10);
    if (isNaN(ap) || ap <= 0 || isNaN(pts) || pts <= 0) {
      Alert.alert('提示', '攻击力和积分必须是正整数');
      return;
    }
    // Build streak milestones, preserving achieved status on edit
    const existingTask = editingId ? tasks.find(t => t.id === editingId) : undefined;
    const getAchieved = (days: 3 | 7 | 15) =>
      existingTask?.streakMilestones.find(m => m.days === days)?.achieved ?? false;
    const streakMilestones: StreakMilestone[] = [];
    if (form.streakEnabled) {
      if (form.milestone3.trim())  streakMilestones.push({ days: 3,  rewardDescription: form.milestone3.trim(),  achieved: getAchieved(3) });
      if (form.milestone7.trim())  streakMilestones.push({ days: 7,  rewardDescription: form.milestone7.trim(),  achieved: getAchieved(7) });
      if (form.milestone15.trim()) streakMilestones.push({ days: 15, rewardDescription: form.milestone15.trim(), achieved: getAchieved(15) });
    }
    const base = {
      name: form.name.trim(),
      icon: form.icon,
      type: form.type,
      attackPower: ap,
      points: pts,
      timeRequirement: form.timeRequirement || undefined,
      streakEnabled: form.streakEnabled,
      streakMilestones,
    };
    if (editingId) {
      // 编辑时不覆盖 isEnabled，保留任务当前启用/禁用状态
      updateTask(editingId, base);
    } else {
      addTask({ ...base, isEnabled: true });
    }
    setModalVisible(false);
  };

  const handleDelete = (task: Task) => {
    Alert.alert('删除任务', `确定删除「${task.name}」吗？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', onPress: () => deleteTask(task.id), style: 'destructive' },
    ]);
  };

  const applyTemplate = (tmpl: typeof NORMAL_TASK_TEMPLATES[0]) => {
    setForm(f => ({
      ...f,
      name: tmpl.name,
      icon: tmpl.icon,
      type: tmpl.type,
      attackPower: String(tmpl.attackPower),
      points: String(tmpl.points),
      timeRequirement: tmpl.timeRequirement ?? '',
    }));
  };

  const setType = (type: TaskType) => {
    setForm(f => ({
      ...f,
      type,
      attackPower: type === 'normal' ? '10' : '30',
      points: type === 'normal' ? '5' : '15',
    }));
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>任务管理</Text>
        <TouchableOpacity onPress={openAdd} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ 添加</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <TaskSection
          title="📝 普通任务"
          tasks={normalTasks}
          onEdit={openEdit}
          onDelete={handleDelete}
          onToggle={(id, val) => updateTask(id, { isEnabled: val })}
          accent={BLUE}
        />
        <TaskSection
          title="⭐ 困难任务"
          tasks={hardTasks}
          onEdit={openEdit}
          onDelete={handleDelete}
          onToggle={(id, val) => updateTask(id, { isEnabled: val })}
          accent="#FF8C00"
        />
        {tasks.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>暂无任务，点击「+ 添加」创建</Text>
          </View>
        )}
      </ScrollView>

      {/* 添加/编辑 Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBg}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? '编辑任务' : '添加任务'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* 模板快选（仅添加模式） */}
              {!editingId && (
                <View style={styles.section}>
                  <Text style={styles.label}>快速选模板</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.templateRow}>
                      {[...NORMAL_TASK_TEMPLATES, ...HARD_TASK_TEMPLATES].map(t => (
                        <TouchableOpacity
                          key={t.name}
                          style={styles.templateChip}
                          onPress={() => applyTemplate(t)}
                        >
                          <Text style={styles.templateIcon}>{t.icon}</Text>
                          <Text style={styles.templateName}>{t.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                  <View style={styles.divider} />
                </View>
              )}

              {/* 图标选择 */}
              <View style={styles.section}>
                <Text style={styles.label}>任务图标</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.iconRow}>
                    {TASK_ICONS.map(ic => (
                      <TouchableOpacity
                        key={ic}
                        style={[styles.iconBtn, form.icon === ic && styles.iconBtnSelected]}
                        onPress={() => setForm(f => ({ ...f, icon: ic }))}
                      >
                        <Text style={styles.iconBtnText}>{ic}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* 任务名称 */}
              <View style={styles.section}>
                <Text style={styles.label}>任务名称 *</Text>
                <TextInput
                  style={styles.input}
                  value={form.name}
                  onChangeText={v => setForm(f => ({ ...f, name: v }))}
                  placeholder="例如：认真刷牙"
                  placeholderTextColor="#bbb"
                  maxLength={20}
                />
              </View>

              {/* 任务类型 */}
              <View style={styles.section}>
                <Text style={styles.label}>任务类型 *</Text>
                <View style={styles.typeRow}>
                  <TouchableOpacity
                    style={[styles.typeBtn, form.type === 'normal' && { backgroundColor: BLUE }]}
                    onPress={() => setType('normal')}
                  >
                    <Text style={[styles.typeBtnText, form.type === 'normal' && { color: '#fff' }]}>
                      📝 普通任务{'\n'}攻击力 10-20
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeBtn, form.type === 'hard' && { backgroundColor: '#FF8C00' }]}
                    onPress={() => setType('hard')}
                  >
                    <Text style={[styles.typeBtnText, form.type === 'hard' && { color: '#fff' }]}>
                      ⭐ 困难任务{'\n'}攻击力 30-50
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 攻击力 */}
              <View style={styles.section}>
                <Text style={styles.label}>
                  攻击力 *（{form.type === 'normal' ? '建议 10-20' : '建议 30-50'}）
                </Text>
                <TextInput
                  style={styles.input}
                  value={form.attackPower}
                  onChangeText={v => setForm(f => ({ ...f, attackPower: v.replace(/\D/g, '') }))}
                  keyboardType="number-pad"
                  placeholder={form.type === 'normal' ? '10' : '30'}
                  placeholderTextColor="#bbb"
                />
              </View>

              {/* 积分 */}
              <View style={styles.section}>
                <Text style={styles.label}>
                  积分奖励 *（{form.type === 'normal' ? '建议 5-10' : '建议 15-25'}）
                </Text>
                <TextInput
                  style={styles.input}
                  value={form.points}
                  onChangeText={v => setForm(f => ({ ...f, points: v.replace(/\D/g, '') }))}
                  keyboardType="number-pad"
                  placeholder={form.type === 'normal' ? '5' : '15'}
                  placeholderTextColor="#bbb"
                />
              </View>

              {/* 时间要求 */}
              <View style={styles.section}>
                <Text style={styles.label}>时间要求（可选）</Text>
                <View style={styles.timeRow}>
                  {TIME_OPTIONS.map(opt => (
                    <TouchableOpacity
                      key={opt || 'none'}
                      style={[styles.timeChip, form.timeRequirement === opt && styles.timeChipSelected]}
                      onPress={() => setForm(f => ({ ...f, timeRequirement: opt }))}
                    >
                      <Text style={[styles.timeChipText, form.timeRequirement === opt && { color: '#fff' }]}>
                        {opt || '不限'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 连续打卡 */}
              <View style={styles.section}>
                <View style={styles.streakHeader}>
                  <View>
                    <Text style={styles.label}>🔥 连续打卡奖励</Text>
                    <Text style={styles.streakSubtitle}>开启后追踪连续完成天数</Text>
                  </View>
                  <Switch
                    value={form.streakEnabled}
                    onValueChange={v => setForm(f => ({ ...f, streakEnabled: v }))}
                    trackColor={{ false: '#ddd', true: '#7C3AED' }}
                    thumbColor="#fff"
                  />
                </View>
                {form.streakEnabled && (
                  <View style={styles.milestoneBox}>
                    <Text style={styles.milestoneHint}>设置里程碑奖励（可只填部分）</Text>
                    {([
                      { label: '🔥 连续 3 天', field: 'milestone3' as const },
                      { label: '⭐ 连续 7 天', field: 'milestone7' as const },
                      { label: '👑 连续 15 天', field: 'milestone15' as const },
                    ] as const).map(m => (
                      <View key={m.field} style={styles.milestoneRow}>
                        <Text style={styles.milestoneLabel}>{m.label}</Text>
                        <TextInput
                          style={styles.milestoneInput}
                          value={form[m.field]}
                          onChangeText={v => setForm(f => ({ ...f, [m.field]: v }))}
                          placeholder="奖励描述（如：看一集动画片）"
                          placeholderTextColor="#bbb"
                          maxLength={30}
                        />
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>

            {/* 保存按钮 */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>💾 保存</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function TaskSection({
  title, tasks, onEdit, onDelete, onToggle, accent,
}: {
  title: string;
  tasks: Task[];
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  onToggle: (id: string, val: boolean) => void;
  accent: string;
}) {
  if (tasks.length === 0) return null;
  return (
    <View style={styles.sectionGroup}>
      <Text style={[styles.sectionTitle, { color: accent }]}>{title}</Text>
      {tasks.map(task => (
        <View key={task.id} style={styles.taskCard}>
          <View style={styles.taskMain}>
            <Text style={styles.taskEmoji}>{task.icon}</Text>
            <View style={styles.taskInfo}>
              <Text style={styles.taskName}>{task.name}</Text>
              <Text style={styles.taskStats}>
                ⚔️ {task.attackPower}  ⭐ {task.points}
                {task.timeRequirement ? `  ⏰ ${task.timeRequirement}` : ''}
              </Text>
              {task.streakEnabled && (
                <View style={styles.streakBadgeRow}>
                  <Text style={styles.streakBadge}>
                    🔥 {task.streakCount > 0 ? `${task.streakCount}天` : '连续打卡'}
                  </Text>
                  {(task.streakMilestones ?? []).map(m => (
                    <View key={m.days} style={[styles.milestonePip, m.achieved && styles.milestonePipDone]}>
                      <Text style={[styles.milestonePipText, m.achieved && { color: '#fff' }]}>
                        {m.days}天{m.achieved ? '✓' : ''}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
            <Switch
              value={task.isEnabled}
              onValueChange={v => onToggle(task.id, v)}
              trackColor={{ false: '#ddd', true: accent }}
              thumbColor="#fff"
              style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
            />
          </View>
          <View style={styles.taskActions}>
            <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(task)}>
              <Text style={styles.editBtnText}>✏️ 编辑</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.delBtn} onPress={() => onDelete(task)}>
              <Text style={styles.delBtnText}>🗑 删除</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
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
  addBtn: { backgroundColor: BLUE, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  list: { padding: 16, paddingBottom: 40 },

  sectionGroup: { marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 8, paddingLeft: 4 },

  taskCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    marginBottom: 10, shadowColor: '#000',
    shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  taskMain: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  taskEmoji: { fontSize: 32, marginRight: 12 },
  taskInfo: { flex: 1 },
  taskName: { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  taskStats: { fontSize: 12, color: '#888', marginTop: 3 },
  taskActions: { flexDirection: 'row', gap: 8 },
  editBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  editBtnText: { fontSize: 13, color: '#555' },
  delBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#FFB3B3', alignItems: 'center' },
  delBtnText: { fontSize: 13, color: '#F44336' },

  emptyBox: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#bbb' },

  // Modal
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: '90%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A2E' },
  closeBtn: { fontSize: 20, color: '#aaa', padding: 4 },

  section: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8 },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginTop: 14 },

  templateRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  templateChip: {
    alignItems: 'center', backgroundColor: '#F5F5F5',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, minWidth: 64,
  },
  templateIcon: { fontSize: 22, marginBottom: 2 },
  templateName: { fontSize: 11, color: '#555', textAlign: 'center' },

  iconRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  iconBtn: {
    width: 44, height: 44, borderRadius: 10, backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center',
  },
  iconBtnSelected: { backgroundColor: '#E8F0FE', borderWidth: 2, borderColor: BLUE },
  iconBtnText: { fontSize: 24 },

  input: {
    borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: '#1A1A2E',
    backgroundColor: '#FAFAFA',
  },

  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5,
    borderColor: '#E0E0E0', alignItems: 'center',
  },
  typeBtnText: { fontSize: 13, color: '#555', textAlign: 'center', lineHeight: 20 },

  timeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0',
  },
  timeChipSelected: { backgroundColor: BLUE, borderColor: BLUE },
  timeChipText: { fontSize: 13, color: '#555' },

  saveBtn: {
    backgroundColor: BLUE, borderRadius: 14, paddingVertical: 15,
    alignItems: 'center', marginTop: 8,
  },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },

  // Streak styles (modal)
  streakHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  streakSubtitle: { fontSize: 11, color: '#aaa', marginTop: 2 },
  milestoneBox: {
    marginTop: 12, backgroundColor: '#F9F5FF', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#E9D5FF',
  },
  milestoneHint: { fontSize: 12, color: '#7C3AED', marginBottom: 10, fontWeight: '600' },
  milestoneRow: { marginBottom: 10 },
  milestoneLabel: { fontSize: 13, color: '#555', fontWeight: '600', marginBottom: 5 },
  milestoneInput: {
    borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: '#1A1A2E',
    backgroundColor: '#fff',
  },

  // Streak badge (task list)
  streakBadgeRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  streakBadge: { fontSize: 11, color: '#7C3AED', fontWeight: '600' },
  milestonePip: {
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
    backgroundColor: '#E9D5FF', borderWidth: 1, borderColor: '#C4B5FD',
  },
  milestonePipDone: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  milestonePipText: { fontSize: 10, color: '#7C3AED', fontWeight: '700' },
});
