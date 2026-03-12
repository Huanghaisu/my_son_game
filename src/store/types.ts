// ============================================================
// 小勇者大冒险 — 核心数据类型定义
// ============================================================

// ---- 任务 --------------------------------------------------

export type TaskType = 'normal' | 'hard';

export type TaskStatus = 'pending' | 'waiting_confirm' | 'completed';

export interface StreakMilestone {
  days: 3 | 7 | 15;
  rewardDescription: string;  // 家长自定义奖励描述
  achieved: boolean;           // 是否已达成过
}

export interface Task {
  id: string;
  name: string;
  icon: string;               // emoji 字符
  type: TaskType;
  attackPower: number;        // 普通任务 10-20，困难任务 30-50
  points: number;             // 普通任务 5-10，困难任务 15-25
  timeRequirement?: string;   // 可选，如"早餐前"
  isEnabled: boolean;         // 今日是否启用
  status: TaskStatus;
  completedAt?: string;       // ISO 日期字符串

  // 战斗卡牌状态
  battleCardConsumed: boolean;          // 今日战斗中是否已消耗

  // 连续打卡
  streakEnabled: boolean;               // 是否开启连续打卡追踪
  streakCount: number;                  // 当前连续天数
  streakLastCompletedDate?: string;     // 最后完成日期 YYYY-MM-DD
  streakMilestones: StreakMilestone[];  // 3/7/15 天里程碑配置
}

// ---- 怪兽 --------------------------------------------------

export type MonsterDifficulty = 'easy' | 'normal' | 'hard';

export interface Monster {
  id: string;
  name: string;
  icon: string;
  maxHP: number;
  currentHP: number;
  attack: number;             // 怪兽反击强度（视觉震动幅度参考）
  difficulty: MonsterDifficulty;
  reward: string;             // 击倒奖励描述
  rewardIcon?: string;
  imageUri?: string;          // 自定义图片 URI（向后兼容）
  imageKey?: string;          // 主题图片 key（对应 monsterThemes 中的 key）
  themeId?: string;           // 所属主题 ID
  isDefeated: boolean;
  defeatDate?: string;        // YYYY-MM-DD
}

// ---- 怪兽主题 ----------------------------------------------

export interface MonsterTemplate {
  key: string;                // 图片 key，对应 assets/monsters/[themeId]_[key].png
  name: string;
  defaultMaxHP: number;
  defaultAttack: number;
  description?: string;
}

export interface MonsterTheme {
  id: string;
  name: string;
  icon: string;               // 主题图标 emoji
  monsters: MonsterTemplate[];
}

// ---- 已击败怪兽历史（家长快速复用）------------------------

export interface DefeatedMonsterRecord {
  id: string;
  name: string;
  icon: string;
  imageKey?: string;
  imageUri?: string;
  themeId?: string;
  maxHP: number;
  attack: number;
  reward: string;
  defeatDate: string;         // YYYY-MM-DD
}

// ---- 积分商城奖励 ------------------------------------------

export type ShopItemType = 'real' | 'virtual_pet' | 'virtual_item';

export interface ShopItem {
  id: string;
  name: string;
  type: ShopItemType;
  icon: string;
  costPoints: number;
  stock?: number;             // undefined = 无限
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

// ---- 里程碑达成（瞬态，UI 消费后清除）---------------------

export interface MilestoneAchievement {
  taskName: string;
  taskIcon: string;
  days: 3 | 7 | 15;
  rewardDescription: string;
}

// ---- 应用设置 ----------------------------------------------

export type TaskConfirmMode = 'auto' | 'parent_confirm';

export type AgeGroup = '3to4' | '5to6';

export interface AppSettings {
  isOnboardingComplete: boolean;
  childName: string;
  childAvatar: string;        // 预设头像 ID
  ageGroup: AgeGroup;
  parentPIN: string;
  taskConfirmMode: TaskConfirmMode;
  notificationsEnabled: boolean;
  dailyReminderTime?: string; // "HH:MM" 格式
}

// ---- 全局 Store 类型 ---------------------------------------

export interface AppState {
  // 数据
  tasks: Task[];
  monsters: Monster[];                          // 所有怪兽（含已击败）
  defeatedMonstersHistory: DefeatedMonsterRecord[]; // 已击败历史，家长快速复用
  shopItems: ShopItem[];
  redemptions: Redemption[];
  points: number;
  settings: AppSettings;
  lastResetDate: string;                        // YYYY-MM-DD，每日重置基准
  pendingMilestoneReward: MilestoneAchievement | null; // 里程碑达成待展示

  // 当前角色
  currentRole: 'child' | 'parent';

  // Actions — 任务
  addTask: (task: Omit<Task, 'id' | 'status' | 'completedAt' | 'battleCardConsumed' | 'streakCount' | 'streakLastCompletedDate'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;           // 孩子点「我完成了」
  confirmTask: (id: string) => void;            // 家长确认
  rejectTask: (id: string) => void;             // 家长拒绝
  resetDailyTasks: () => void;                  // 每日重置（任务状态 + 卡牌消耗状态）
  checkAndAutoReset: () => void;                // 检查日期，自动触发每日重置

  // Actions — 连续打卡
  updateStreak: (taskId: string) => void;
  clearPendingMilestoneReward: () => void;

  // Actions — 战斗
  attackMonster: (monsterId: string, taskId: string) => boolean; // 返回是否击倒

  // Actions — 怪兽
  addMonster: (monster: Omit<Monster, 'id' | 'isDefeated' | 'currentHP' | 'difficulty' | 'defeatDate'>) => void;
  updateMonster: (id: string, updates: Partial<Monster>) => void;
  deleteMonster: (id: string) => void;
  reAddMonsterFromHistory: (recordId: string) => void; // 快速复用已击败怪兽（满血重置）

  // Actions — 积分
  addPoints: (amount: number) => void;
  spendPoints: (amount: number) => boolean;
  setPoints: (amount: number) => void;  // 家长手动设置金币总量

  // Actions — 商城
  addShopItem: (item: Omit<ShopItem, 'id'>) => void;
  updateShopItem: (id: string, updates: Partial<ShopItem>) => void;
  deleteShopItem: (id: string) => void;
  redeemItem: (itemId: string) => boolean;
  confirmDelivery: (redemptionId: string) => void;
  cancelDelivery: (redemptionId: string) => void;

  // Actions — 设置
  updateSettings: (updates: Partial<AppSettings>) => void;
  verifyPIN: (pin: string) => boolean;

  // Actions — 角色切换
  switchToParent: () => void;
  switchToChild: () => void;
}
