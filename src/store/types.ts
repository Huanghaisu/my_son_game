// ============================================================
// 小勇者大冒险 — 核心数据类型定义
// 对应 PRD 7.2 数据模型
// ============================================================

// ---- 任务 --------------------------------------------------

export type TaskType = 'normal' | 'hard';

export type TaskStatus = 'pending' | 'waiting_confirm' | 'completed';

export interface Task {
  id: string;
  name: string;
  icon: string;           // emoji 字符
  type: TaskType;
  attackPower: number;    // 普通任务 10-20，困难任务 30-50
  points: number;         // 普通任务 5-10，困难任务 15-25
  timeRequirement?: string; // 可选，如"早餐前"
  isEnabled: boolean;     // 今日是否启用
  status: TaskStatus;
  completedAt?: string;   // ISO 日期字符串
}

// ---- 卡牌 --------------------------------------------------

export type CardType = 'tool' | 'skill';

export interface Card {
  id: string;
  taskId: string;         // 来源任务 ID
  taskName: string;       // 冗余存储，展示用
  type: CardType;         // tool = 普通工具卡，skill = 技能绝招卡
  attackPower: number;
  icon: string;           // 卡牌图标 emoji
  createdAt: string;
}

// ---- 怪兽 --------------------------------------------------

export type MonsterDifficulty = 'easy' | 'normal' | 'hard';

export interface Monster {
  id: string;
  name: string;
  icon: string;
  maxHP: number;
  currentHP: number;
  difficulty: MonsterDifficulty; // 根据 HP 自动判定
  reward: string;         // 击倒奖励描述
  rewardIcon?: string;
  imageUri?: string;      // 自定义怪兽图片 URI (选用 PNG)
  isDefeated: boolean;
}

// ---- 积分商城奖励 ------------------------------------------

export type ShopItemType = 'real' | 'virtual_pet' | 'virtual_item';

export interface ShopItem {
  id: string;
  name: string;
  type: ShopItemType;
  icon: string;
  costPoints: number;
  stock?: number;         // undefined = 无限
  isEnabled: boolean;
}

// ---- 兑换记录 ----------------------------------------------

export type RedemptionStatus = 'pending_delivery' | 'delivered' | 'cancelled';

export interface Redemption {
  id: string;
  itemId: string;
  itemName: string;
  itemIcon: string;
  costPoints: number;
  type: ShopItemType;
  status: RedemptionStatus;
  createdAt: string;
  deliveredAt?: string;
}

// ---- 应用设置 ----------------------------------------------

export type TaskConfirmMode = 'auto' | 'parent_confirm';

export type AgeGroup = '3to4' | '5to6';

export interface AppSettings {
  isOnboardingComplete: boolean;
  childName: string;
  childAvatar: string;    // 预设头像 ID
  ageGroup: AgeGroup;
  parentPIN: string;      // 简单存储，MVP 阶段
  taskConfirmMode: TaskConfirmMode;
  notificationsEnabled: boolean;
  dailyReminderTime?: string; // "HH:MM" 格式
}

// ---- 全局 Store 类型 ---------------------------------------

export interface AppState {
  // 数据
  tasks: Task[];
  cards: Card[];
  monsters: Monster[];
  monsterQueue: Monster[]; // 待挑战的怪兽队列
  currentMonsterIndex: number;
  shopItems: ShopItem[];
  redemptions: Redemption[];
  points: number;
  settings: AppSettings;

  // 当前角色
  currentRole: 'child' | 'parent';

  // Actions — 任务
  addTask: (task: Omit<Task, 'id' | 'status' | 'completedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;       // 孩子点「我完成了」
  confirmTask: (id: string) => void;        // 家长确认
  rejectTask: (id: string) => void;         // 家长拒绝
  resetDailyTasks: () => void;              // 每日重置

  // Actions — 卡牌
  addCard: (card: Omit<Card, 'id' | 'createdAt'>) => void;
  removeCard: (id: string) => void;

  // Actions — 怪兽
  addMonsterToQueue: (monster: Omit<Monster, 'id' | 'isDefeated' | 'currentHP'>) => void;
  updateMonster: (id: string, updates: Partial<Monster>) => void;
  deleteMonster: (id: string) => void;
  attackCurrentMonster: (damage: number, cardId: string) => void;
  loadNextMonster: () => void;

  // Actions — 积分
  addPoints: (amount: number) => void;
  spendPoints: (amount: number) => boolean; // 返回是否成功

  // Actions — 商城
  addShopItem: (item: Omit<ShopItem, 'id'>) => void;
  updateShopItem: (id: string, updates: Partial<ShopItem>) => void;
  deleteShopItem: (id: string) => void;
  redeemItem: (itemId: string) => boolean;  // 返回是否成功
  confirmDelivery: (redemptionId: string) => void;
  cancelDelivery: (redemptionId: string) => void;

  // Actions — 设置
  updateSettings: (updates: Partial<AppSettings>) => void;
  verifyPIN: (pin: string) => boolean;

  // Actions — 角色切换
  switchToParent: () => void;
  switchToChild: () => void;
}
