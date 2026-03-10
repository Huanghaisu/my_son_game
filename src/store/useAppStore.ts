// ============================================================
// 小勇者大冒险 — 全局状态管理 (Zustand + AsyncStorage 持久化)
// ============================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Task, Card, Monster, ShopItem, Redemption } from './types';
import { TOOL_CARD_ICONS, SKILL_CARD_ICONS, getMonsterDifficulty, SHOP_ITEM_TEMPLATES } from '../constants/templates';

// 简单 ID 生成
const genId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

// 根据任务类型随机取卡牌图标
const getCardIcon = (type: 'tool' | 'skill') => {
  const pool = type === 'tool' ? TOOL_CARD_ICONS : SKILL_CARD_ICONS;
  return pool[Math.floor(Math.random() * pool.length)];
};

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
      cards: [],
      monsters: [],
      monsterQueue: [],
      currentMonsterIndex: 0,
      shopItems: initialShopItems,
      redemptions: [],
      points: 0,
      settings: defaultSettings,
      currentRole: 'child',

      // ---- 任务 Actions ------------------------------------

      addTask: (taskData) => {
        const task: Task = {
          ...taskData,
          id: genId(),
          isEnabled: true,
          status: 'pending',
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
          // 自动确认：直接发卡牌
          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.id === id ? { ...t, status: 'completed', completedAt: new Date().toISOString() } : t
            ),
          }));
          get().addCard({
            taskId: task.id,
            taskName: task.name,
            type: task.type === 'normal' ? 'tool' : 'skill',
            attackPower: task.attackPower,
            icon: getCardIcon(task.type === 'normal' ? 'tool' : 'skill'),
          });
          get().addPoints(task.points);
        } else {
          // 家长确认模式：进入待确认状态
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
            t.id === id ? { ...t, status: 'completed', completedAt: new Date().toISOString() } : t
          ),
        }));
        get().addCard({
          taskId: task.id,
          taskName: task.name,
          type: task.type === 'normal' ? 'tool' : 'skill',
          attackPower: task.attackPower,
          icon: getCardIcon(task.type === 'normal' ? 'tool' : 'skill'),
        });
        get().addPoints(task.points);
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
          })),
        }));
      },

      // ---- 卡牌 Actions ------------------------------------

      addCard: (cardData) => {
        const card: Card = {
          ...cardData,
          id: genId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ cards: [...state.cards, card] }));
      },

      removeCard: (id) => {
        set((state) => ({ cards: state.cards.filter((c) => c.id !== id) }));
      },

      // ---- 怪兽 Actions ------------------------------------

      addMonsterToQueue: (monsterData) => {
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

      attackCurrentMonster: (damage, cardId) => {
        const { monsters, currentMonsterIndex } = get();
        const activeMonsters = monsters.filter((m) => !m.isDefeated);
        if (activeMonsters.length === 0) return;

        const current = activeMonsters[currentMonsterIndex] ?? activeMonsters[0];
        if (!current) return;

        const newHP = Math.max(0, current.currentHP - damage);
        const isDefeated = newHP <= 0;

        set((state) => ({
          monsters: state.monsters.map((m) =>
            m.id === current.id
              ? { ...m, currentHP: newHP, isDefeated }
              : m
          ),
        }));

        // 消耗卡牌
        get().removeCard(cardId);

        // 击倒后加额外积分
        if (isDefeated) {
          get().addPoints(Math.floor(current.maxHP * 0.1));
        }
      },

      loadNextMonster: () => {
        const { monsters, currentMonsterIndex } = get();
        const activeMonsters = monsters.filter((m) => !m.isDefeated);
        if (activeMonsters.length > 0) {
          const nextIndex = (currentMonsterIndex + 1) % monsters.filter((m) => !m.isDefeated).length;
          set({ currentMonsterIndex: nextIndex });
        }
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

        // 扣库存
        if (item.stock !== undefined) {
          get().updateShopItem(itemId, { stock: item.stock - 1 });
        }

        // 写兑换记录
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
        // 退还积分
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
