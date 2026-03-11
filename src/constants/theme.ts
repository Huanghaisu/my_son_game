// ============================================================
// 设计令牌 — 小勇者大冒险统一设计系统
// ============================================================

export const Colors = {
  // 任务大厅（橙色）
  task:         '#FF8C00',
  taskBg:       '#FFF8E7',
  taskSurface:  '#fff',

  // 战斗场（红色）
  battle:       '#DC2626',
  battleBg:     '#FFF0F0',
  battleLight:  '#FEE2E2',

  // 卡牌背包（蓝色）
  backpack:     '#2563EB',
  backpackBg:   '#F0F4FF',

  // 金币商城（橙色/金色）
  shop:         '#FF8C00',
  shopBg:       '#FFFBF0',
  gold:         '#F59E0B',
  goldBg:       '#FFF3E0',

  // 卡牌类型
  cardTool:     '#2563EB',
  cardToolBg:   '#DBEAFE',
  cardSkill:    '#7C3AED',
  cardSkillBg:  '#EDE9FE',

  // 稀有度
  rarityEpic:   '#F59E0B',    // 攻击力 ≥ 10
  rarityRare:   '#7C3AED',    // 攻击力 6-9

  // 语义色
  success:      '#16a34a',
  successBg:    '#F0FDF4',
  danger:       '#DC2626',
  dangerBg:     '#FEF2F2',
  warning:      '#F97316',
  warningBg:    '#FEF3C7',

  // 文字
  textPrimary:   '#1a1a1a',
  textSecondary: '#374151',
  textMuted:     '#6B7280',
  textDisabled:  '#9CA3AF',

  // 界面
  surface:      '#FFFFFF',
  surfaceAlt:   '#F9FAFB',
  border:       '#E5E7EB',
  borderLight:  '#F3F4F6',
  scrim:        'rgba(0,0,0,0.55)',
} as const;

export const Spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  base: 16,
  lg:   20,
  xl:   24,
  xxl:  32,
  xxxl: 48,
} as const;

export const Radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  28,
  full: 999,
} as const;

export const FontSize = {
  xs:   11,
  sm:   13,
  base: 16,
  md:   18,
  lg:   20,
  xl:   22,
  xxl:  26,
  hero: 32,
} as const;

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 10,
  },
} as const;
