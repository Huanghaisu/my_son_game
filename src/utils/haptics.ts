// ============================================================
// 触觉反馈工具（封装 expo-haptics，统一管理触感强度）
// ============================================================

import * as Haptics from 'expo-haptics';

/** 轻触 — 普通按钮、Tab 切换 */
export const hapticLight = () =>
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

/** 中等 — 普通攻击命中、任务完成 */
export const hapticMedium = () =>
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

/** 重击 — 技能绝招命中 */
export const hapticHeavy = () =>
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

/** 成功 — 击倒怪兽、兑换成功 */
export const hapticSuccess = () =>
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

/** 警告 — 怪兽反击、操作不可用 */
export const hapticWarning = () =>
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

/** 错误 — 金币不足 */
export const hapticError = () =>
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
