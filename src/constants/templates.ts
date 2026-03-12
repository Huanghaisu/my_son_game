// ============================================================
// 预设模板数据（对应 PRD 2.2.1 / 3.2.3 / 3.2.4）
// ============================================================

import { Task, Monster, ShopItem } from '../store/types';

// ---- 普通任务模板 ------------------------------------------

export const NORMAL_TASK_TEMPLATES: Omit<Task,
  'id' | 'status' | 'completedAt' | 'isEnabled' |
  'battleCardConsumed' | 'streakCount' | 'streakLastCompletedDate'
>[] = [
  { name: '认真刷牙', icon: '🦷', type: 'normal', attackPower: 10, points: 5, timeRequirement: '早晨', streakEnabled: false, streakMilestones: [] },
  { name: '按时吃饭', icon: '🍚', type: 'normal', attackPower: 10, points: 5, streakEnabled: false, streakMilestones: [] },
  { name: '收拾碗筷', icon: '🥢', type: 'normal', attackPower: 10, points: 5, streakEnabled: false, streakMilestones: [] },
  { name: '自己穿衣', icon: '👕', type: 'normal', attackPower: 15, points: 8, streakEnabled: false, streakMilestones: [] },
  { name: '洗手洗脸', icon: '🧼', type: 'normal', attackPower: 10, points: 5, streakEnabled: false, streakMilestones: [] },
  { name: '按时睡觉', icon: '🌙', type: 'normal', attackPower: 15, points: 8, timeRequirement: '晚上', streakEnabled: false, streakMilestones: [] },
];

// ---- 困难任务模板 ------------------------------------------

export const HARD_TASK_TEMPLATES: Omit<Task,
  'id' | 'status' | 'completedAt' | 'isEnabled' |
  'battleCardConsumed' | 'streakCount' | 'streakLastCompletedDate'
>[] = [
  { name: '整理房间', icon: '🧸', type: 'hard', attackPower: 30, points: 15, streakEnabled: false, streakMilestones: [] },
  { name: '阅读绘本', icon: '📚', type: 'hard', attackPower: 35, points: 18, streakEnabled: false, streakMilestones: [] },
  { name: '帮忙做家务', icon: '🧹', type: 'hard', attackPower: 40, points: 20, streakEnabled: false, streakMilestones: [] },
  { name: '完成一幅画', icon: '🎨', type: 'hard', attackPower: 35, points: 18, streakEnabled: false, streakMilestones: [] },
  { name: '练习写字', icon: '✏️', type: 'hard', attackPower: 30, points: 15, streakEnabled: false, streakMilestones: [] },
  { name: '户外运动', icon: '⚽', type: 'hard', attackPower: 40, points: 20, streakEnabled: false, streakMilestones: [] },
];

// ---- 怪兽模板（内置非主题，emoji 展示）---------------------

export const MONSTER_TEMPLATES: Omit<Monster,
  'id' | 'isDefeated' | 'currentHP' | 'defeatDate'
>[] = [
  { name: '小蘑菇怪', icon: '🍄', maxHP: 50,  attack: 5,  difficulty: 'easy',   reward: '一颗糖果',    rewardIcon: '🍬' },
  { name: '云朵怪',   icon: '☁️', maxHP: 80,  attack: 8,  difficulty: 'easy',   reward: '看一集动画片', rewardIcon: '📺' },
  { name: '树懒怪',   icon: '🦥', maxHP: 120, attack: 12, difficulty: 'normal', reward: '一个小贴纸',   rewardIcon: '⭐' },
  { name: '气球怪',   icon: '🎈', maxHP: 150, attack: 15, difficulty: 'normal', reward: '一个小玩具',   rewardIcon: '🎁' },
  { name: '星星怪',   icon: '⭐', maxHP: 200, attack: 20, difficulty: 'normal', reward: '去公园玩',    rewardIcon: '🎪' },
  { name: '彩虹怪',   icon: '🌈', maxHP: 300, attack: 30, difficulty: 'hard',   reward: '吃顿大餐',    rewardIcon: '🍜' },
  { name: '钻石怪',   icon: '💎', maxHP: 400, attack: 40, difficulty: 'hard',   reward: '去游乐场',    rewardIcon: '🎡' },
];

// ---- 金币商城模板 ------------------------------------------

export const SHOP_ITEM_TEMPLATES: Omit<ShopItem, 'id'>[] = [
  { name: '兑换零食', icon: '🍬', type: 'real', costPoints: 15,  isEnabled: true },
  { name: '兑换饮料', icon: '🧃', type: 'real', costPoints: 20,  isEnabled: true },
  { name: '兑换玩游戏', icon: '🎮', type: 'real', costPoints: 30, isEnabled: true },
  { name: '兑换玩具', icon: '🪀', type: 'real', costPoints: 50,  isEnabled: true },
];

// ---- 孩子头像预设 ------------------------------------------

export const CHILD_AVATARS = ['🦁', '🐯', '🐻', '🐼', '🐨', '🦊', '🐸', '🐧'];

// ---- 难度判定辅助函数 --------------------------------------

export function getMonsterDifficulty(hp: number): Monster['difficulty'] {
  if (hp <= 100) return 'easy';
  if (hp <= 200) return 'normal';
  return 'hard';
}

// ---- Onboarding 推荐默认配置 --------------------------------

export const ONBOARDING_DEFAULT_TASKS = [
  NORMAL_TASK_TEMPLATES[0], // 认真刷牙
  NORMAL_TASK_TEMPLATES[1], // 按时吃饭
  NORMAL_TASK_TEMPLATES[5], // 按时睡觉
  HARD_TASK_TEMPLATES[0],   // 整理房间
];

export const ONBOARDING_DEFAULT_MONSTER = MONSTER_TEMPLATES[0]; // 小蘑菇怪
