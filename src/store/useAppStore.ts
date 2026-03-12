// ============================================================
// 小勇者大冒险 — 全局状态管理 (Zustand + AsyncStorage 持久化)
// ============================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AppState,
  Task,
  Monster,
  ShopItem,
  Redemption,
  DefeatedMonsterRecord,
  MilestoneAchievement,
} from './types';
import { getMonsterDifficulty, SHOP_ITEM_TEMPLATES } from '../constants/templates';

// 简单 ID 生成
const genId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

// 今日日期 YYYY-MM-DD
const today = () => new Date().toISOString().split('T')[0];

// 初始商城数据（带 ID）
const initialShopItems: ShopItem[] = SHOP_ITEM_TEMPLATES.map((item, i) => ({
  ...item,
  id: `shop_${i}`,
}));

// 默认设置
const defaultSettings: AppState['settings'] = {
  isOnboardingComplete: false,
  childName: '',
  childAvatar: '🦁',
  ageGroup: '3to4',
  parentPIN: '',
  taskConfirmMode: 'auto',
  notificationsEnabled: false,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ---- 初始状态 ----------------------------------------
      tasks: [],
      monsters: [],
      defeatedMonstersHistory: [],
      shopItems: initialShopItems,
      redemptions: [],
      points: 0,
      settings: defaultSettings,
      lastResetDate: '',
      pendingMilestoneReward: null,
      currentRole: 'child',

      // ---- 任务 Actions ------------------------------------

      addTask: (taskData) => {
        const task: Task = {
          ...taskData,
          id: genId(),
          isEnabled: true,
          status: 'pending',
          completedAt: undefined,
          battleCardConsumed: false,
          streakCount: 0,
          streakLastCompletedDate: undefined,
        };
        set((state) => ({ tasks: [...state.tasks, task] }));
      },

      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        }));
      },

      deleteTask: (id) => {
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
      },

      completeTask: (id) => {
        const { settings, tasks } = get();
        const task = tasks.find((t) => t.id === id);
        if (!task || task.status !== 'pending') return;

        if (settings.taskConfirmMode === 'auto') {
          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.id === id
                ? { ...t, status: 'completed', completedAt: new Date().toISOString() }
                : t
            ),
          }));
          get().addPoints(task.points);
          get().updateStreak(id);
        } else {
          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.id === id ? { ...t, status: 'waiting_confirm' } : t
            ),
          }));
        }
      },

      confirmTask: (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task || task.status !== 'waiting_confirm') return;

        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? { ...t, status: 'completed', completedAt: new Date().toISOString() }
              : t
          ),
        }));
        get().addPoints(task.points);
        get().updateStreak(id);
      },

      rejectTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, status: 'pending' } : t
          ),
        }));
      },

      resetDailyTasks: () => {
        set((state) => ({
          tasks: state.tasks.map((t) => ({
            ...t,
            status: 'pending',
            completedAt: undefined,
            battleCardConsumed: false,
          })),
          lastResetDate: today(),
        }));
      },

      checkAndAutoReset: () => {
        const { lastResetDate } = get();
        if (lastResetDate !== today()) {
          get().resetDailyTasks();
        }
      },

      // ---- 连续打卡 Actions --------------------------------

      updateStreak: (taskId) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task || !task.streakEnabled) return;

        const todayStr = today();
        const lastDate = task.streakLastCompletedDate;

        // 今天已经计算过，跳过
        if (lastDate === todayStr) return;

        let newCount: number;
        if (!lastDate) {
          newCount = 1;
        } else {
          const diffDays = Math.round(
            (new Date(todayStr).getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)
          );
          // 1天=连续；2天=容错不断连；超过2天归零
          newCount = diffDays <= 2 ? task.streakCount + 1 : 1;
        }

        // 找出本次新达成的最高里程碑
        const milestones = task.streakMilestones ?? [];
        const newlyAchieved = milestones
          .filter(m => !m.achieved && newCount >= m.days)
          .sort((a, b) => b.days - a.days)[0] ?? null;

        const updatedMilestones = milestones.map((m) => ({
          ...m,
          achieved: m.achieved || newCount >= m.days,
        }));

        const milestone: MilestoneAchievement | null = newlyAchieved
          ? {
              taskName: task.name,
              taskIcon: task.icon,
              days: newlyAchieved.days,
              rewardDescription: newlyAchieved.rewardDescription,
            }
          : null;

        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, streakCount: newCount, streakLastCompletedDate: todayStr, streakMilestones: updatedMilestones }
              : t
          ),
          ...(milestone ? { pendingMilestoneReward: milestone } : {}),
        }));
      },

      clearPendingMilestoneReward: () => set({ pendingMilestoneReward: null }),

      // ---- 战斗 Actions ------------------------------------

      attackMonster: (monsterId, taskId) => {
        const { monsters, tasks } = get();
        const monster = monsters.find((m) => m.id === monsterId && !m.isDefeated);
        const task = tasks.find((t) => t.id === taskId);

        if (!monster || !task) return false;
        if (task.status !== 'completed' || task.battleCardConsumed) return false;

        const newHP = Math.max(0, monster.currentHP - task.attackPower);
        const isDefeated = newHP <= 0;
        const defeatDate = isDefeated ? today() : undefined;

        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, battleCardConsumed: true } : t
          ),
          monsters: state.monsters.map((m) =>
            m.id === monsterId
              ? { ...m, currentHP: newHP, isDefeated, defeatDate }
              : m
          ),
        }));

        if (isDefeated) {
          // 额外积分
          get().addPoints(Math.floor(monster.maxHP * 0.1));

          // 记录击败历史
          const record: DefeatedMonsterRecord = {
            id: genId(),
            name: monster.name,
            icon: monster.icon,
            imageKey: monster.imageKey,
            imageUri: monster.imageUri,
            themeId: monster.themeId,
            maxHP: monster.maxHP,
            attack: monster.attack,
            reward: monster.reward,
            defeatDate: today(),
          };
          set((state) => ({
            defeatedMonstersHistory: [record, ...state.defeatedMonstersHistory],
          }));
        }

        return isDefeated;
      },

      // ---- 怪兽 Actions ------------------------------------

      addMonster: (monsterData) => {
        const monster: Monster = {
          ...monsterData,
          id: genId(),
          currentHP: monsterData.maxHP,
          difficulty: getMonsterDifficulty(monsterData.maxHP),
          isDefeated: false,
        };
        set((state) => ({ monsters: [...state.monsters, monster] }));
      },

      updateMonster: (id, updates) => {
        set((state) => ({
          monsters: state.monsters.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        }));
      },

      deleteMonster: (id) => {
        set((state) => ({ monsters: state.monsters.filter((m) => m.id !== id) }));
      },

      reAddMonsterFromHistory: (recordId) => {
        const record = get().defeatedMonstersHistory.find((r) => r.id === recordId);
        if (!record) return;

        const monster: Monster = {
          id: genId(),
          name: record.name,
          icon: record.icon,
          imageKey: record.imageKey,
          imageUri: record.imageUri,
          themeId: record.themeId,
          maxHP: record.maxHP,
          currentHP: record.maxHP, // 满血重置
          attack: record.attack,
          difficulty: getMonsterDifficulty(record.maxHP),
          reward: record.reward,
          isDefeated: false,
        };
        set((state) => ({ monsters: [...state.monsters, monster] }));
      },

      // ---- 积分 Actions ------------------------------------

      addPoints: (amount) => {
        set((state) => ({ points: state.points + amount }));
      },

      spendPoints: (amount) => {
        const { points } = get();
        if (points < amount) return false;
        set((state) => ({ points: state.points - amount }));
        return true;
      },

      setPoints: (amount) => {
        set({ points: Math.max(0, Math.floor(amount)) });
      },

      // ---- 商城 Actions ------------------------------------

      addShopItem: (itemData) => {
        const item: ShopItem = { ...itemData, id: genId() };
        set((state) => ({ shopItems: [...state.shopItems, item] }));
      },

      updateShopItem: (id, updates) => {
        set((state) => ({
          shopItems: state.shopItems.map((i) => (i.id === id ? { ...i, ...updates } : i)),
        }));
      },

      deleteShopItem: (id) => {
        set((state) => ({ shopItems: state.shopItems.filter((i) => i.id !== id) }));
      },

      redeemItem: (itemId) => {
        const { shopItems, points } = get();
        const item = shopItems.find((i) => i.id === itemId);
        if (!item || !item.isEnabled) return false;
        if (item.stock !== undefined && item.stock <= 0) return false;
        if (points < item.costPoints) return false;

        const success = get().spendPoints(item.costPoints);
        if (!success) return false;

        if (item.stock !== undefined) {
          get().updateShopItem(itemId, { stock: item.stock - 1 });
        }

        const redemption: Redemption = {
          id: genId(),
          itemId,
          itemName: item.name,
          itemIcon: item.icon,
          costPoints: item.costPoints,
          type: item.type,
          status: item.type === 'real' ? 'pending_delivery' : 'delivered',
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ redemptions: [...state.redemptions, redemption] }));
        return true;
      },

      confirmDelivery: (redemptionId) => {
        set((state) => ({
          redemptions: state.redemptions.map((r) =>
            r.id === redemptionId
              ? { ...r, status: 'delivered', deliveredAt: new Date().toISOString() }
              : r
          ),
        }));
      },

      cancelDelivery: (redemptionId) => {
        const redemption = get().redemptions.find((r) => r.id === redemptionId);
        if (!redemption) return;
        get().addPoints(redemption.costPoints);
        set((state) => ({
          redemptions: state.redemptions.map((r) =>
            r.id === redemptionId ? { ...r, status: 'cancelled' } : r
          ),
        }));
      },

      // ---- 设置 Actions ------------------------------------

      updateSettings: (updates) => {
        set((state) => ({ settings: { ...state.settings, ...updates } }));
      },

      verifyPIN: (pin) => {
        return get().settings.parentPIN === pin;
      },

      // ---- 角色切换 ----------------------------------------

      switchToParent: () => set({ currentRole: 'parent' }),
      switchToChild: () => set({ currentRole: 'child' }),
    }),
    {
      name: 'little-brave-adventure-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
