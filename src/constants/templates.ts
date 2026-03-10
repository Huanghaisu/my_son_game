// ============================================================
// 预设模板数据（对应 PRD 2.2.1 / 3.2.3 / 3.2.4）
// ============================================================

import { Task, Monster, ShopItem } from '../store/types';

// ---- 普通任务模板 ------------------------------------------

export const NORMAL_TASK_TEMPLATES: Omit<Task, 'id' | 'status' | 'completedAt' | 'isEnabled'>[] = [
  { name: '认真刷牙', icon: '🦷', type: 'normal', attackPower: 10, points: 5, timeRequirement: '早晨' },
  { name: '按时吃饭', icon: '🍚', type: 'normal', attackPower: 10, points: 5 },
  { name: '收拾碗筷', icon: '🥢', type: 'normal', attackPower: 10, points: 5 },
  { name: '自己穿衣', icon: '👕', type: 'normal', attackPower: 15, points: 8 },
  { name: '洗手洗脸', icon: '🧼', type: 'normal', attackPower: 10, points: 5 },
  { name: '按时睡觉', icon: '🌙', type: 'normal', attackPower: 15, points: 8, timeRequirement: '晚上' },
];

// ---- 困难任务模板 ------------------------------------------

export const HARD_TASK_TEMPLATES: Omit<Task, 'id' | 'status' | 'completedAt' | 'isEnabled'>[] = [
  { name: '整理房间', icon: '🧸', type: 'hard', attackPower: 30, points: 15 },
  { name: '阅读绘本', icon: '📚', type: 'hard', attackPower: 35, points: 18 },
  { name: '帮忙做家务', icon: '🧹', type: 'hard', attackPower: 40, points: 20 },
  { name: '完成一幅画', icon: '🎨', type: 'hard', attackPower: 35, points: 18 },
  { name: '练习写字', icon: '✏️', type: 'hard', attackPower: 30, points: 15 },
  { name: '户外运动', icon: '⚽', type: 'hard', attackPower: 40, points: 20 },
];

// ---- 怪兽模板 ----------------------------------------------

export const MONSTER_TEMPLATES: Omit<Monster, 'id' | 'isDefeated' | 'currentHP'>[] = [
  { name: '小蘑菇怪', icon: '🍄', maxHP: 50,  difficulty: 'easy',   reward: '一颗糖果',   rewardIcon: '🍬' },
  { name: '云朵怪',   icon: '☁️', maxHP: 80,  difficulty: 'easy',   reward: '看一集动画片', rewardIcon: '📺' },
  { name: '树懒怪',   icon: '🦥', maxHP: 120, difficulty: 'normal', reward: '一个小贴纸',  rewardIcon: '⭐' },
  { name: '气球怪',   icon: '🎈', maxHP: 150, difficulty: 'normal', reward: '一个小玩具',  rewardIcon: '🎁' },
  { name: '星星怪',   icon: '⭐', maxHP: 200, difficulty: 'normal', reward: '去公园玩',   rewardIcon: '🎪' },
  { name: '彩虹怪',   icon: '🌈', maxHP: 300, difficulty: 'hard',   reward: '吃顿大餐',   rewardIcon: '🍜' },
  { name: '钻石怪',   icon: '💎', maxHP: 400, difficulty: 'hard',   reward: '去游乐场',   rewardIcon: '🎡' },
];

// ---- 积分商城模板 ------------------------------------------

export const SHOP_ITEM_TEMPLATES: Omit<ShopItem, 'id'>[] = [
  { name: '吃一颗糖果',    icon: '🍬', type: 'real',         costPoints: 10,  isEnabled: true },
  { name: '看电视30分钟',  icon: '📺', type: 'real',         costPoints: 20,  isEnabled: true },
  { name: '玩游戏30分钟',  icon: '🎮', type: 'real',         costPoints: 25,  isEnabled: true },
  { name: '选一本新书',    icon: '📖', type: 'real',         costPoints: 50,  isEnabled: true },
  { name: '周末去公园',    icon: '🎪', type: 'real',         costPoints: 80,  isEnabled: true },
  { name: '小白兔',        icon: '🐰', type: 'virtual_pet',  costPoints: 100, isEnabled: true },
  { name: '小猫咪',        icon: '🐱', type: 'virtual_pet',  costPoints: 100, isEnabled: true },
  { name: '小狗狗',        icon: '🐶', type: 'virtual_pet',  costPoints: 120, isEnabled: true },
];

// ---- 卡牌图标池 --------------------------------------------

export const TOOL_CARD_ICONS = ['🗡️', '🔨', '✨', '🏹'];   // 普通工具卡图标
export const SKILL_CARD_ICONS = ['🔥', '⚡', '🌈', '⭐'];   // 技能绝招卡图标

// ---- 孩子头像预设 ------------------------------------------

export const CHILD_AVATARS = ['🦁', '🐯', '🐻', '🐼', '🐨', '🦊', '🐸', '🐧'];

// ---- 难度判定辅助函数 --------------------------------------

export function getMonsterDifficulty(hp: number): Monster['difficulty'] {
  if (hp <= 100) return 'easy';
  if (hp <= 200) return 'normal';
  return 'hard';
}

// ---- Onboarding 推荐默认配置 -------------------------------

export const ONBOARDING_DEFAULT_TASKS = [
  NORMAL_TASK_TEMPLATES[0], // 认真刷牙
  NORMAL_TASK_TEMPLATES[1], // 按时吃饭
  NORMAL_TASK_TEMPLATES[5], // 按时睡觉
  HARD_TASK_TEMPLATES[0],   // 整理房间
];

export const ONBOARDING_DEFAULT_MONSTER = MONSTER_TEMPLATES[0]; // 小蘑菇怪
