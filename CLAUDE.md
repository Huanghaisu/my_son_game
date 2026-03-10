# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目简介

**小勇者大冒险** — 面向 3-6 岁幼儿的家庭激励游戏 iOS App。孩子完成现实任务（刷牙、整理房间等）获得攻击卡牌，用卡牌打怪兽，击倒怪兽兑换现实奖励。家长通过家长端配置任务和奖励。

PRD 文档：`../PRD-小勇者大冒险.md`

## 常用命令

```bash
# 启动开发服务（必须加 --host lan，否则 iPhone Expo Go 连不上）
npx expo start --host lan

# 清缓存启动（遇到奇怪问题时用）
npx expo start --host lan --clear

# TypeScript 类型检查（提交前必跑）
npx tsc --noEmit

# 安装依赖（用 npm，不用 yarn）
npm install

# EAS 云端构建 iOS
npx eas build --platform ios
```

## 环境说明

- **Expo Go 版本**：54.0.2（iOS），项目锁定 SDK ~54.0.0
- **Expo Go 始终开启 New Architecture**，无法通过 `newArchEnabled: false` 关闭
- **Reanimated**：使用 React Native 内置 `Animated` API（`CardRewardModal.tsx`），**不使用** `react-native-reanimated`，避免 Expo Go 内 worklets 版本冲突
- `app.json` 里**不要**注册 `react-native-reanimated` plugin（v4 已无此需求，v3 在 Expo Go 中有 worklets 版本冲突）
- `App.tsx` 第一行必须是 `import 'react-native-gesture-handler'`
- 不使用服务器，所有数据本地存储，`expo-av` 处理音效

## 架构概览

### 导航结构

`AppNavigator` 根据两个条件选择渲染哪棵树：

```
settings.isOnboardingComplete === false  →  OnboardingNavigator（Stack，7步引导）
settings.isOnboardingComplete === true
  currentRole === 'child'               →  ChildNavigator（BottomTabs，4个Tab）
  currentRole === 'parent'              →  ParentNavigator（Stack）
```

**ChildNavigator 底部 4 Tab：**
- `TaskHall` — 任务大厅（主界面）
- `CardBackpack` — 卡牌背包
- `Battle` — 战斗场（阶段5实现）
- `ChildShop` — 积分商城（阶段6实现）

角色切换不重载 `NavigationContainer`，只改 Zustand 的 `currentRole` 字段。切换到家长端需通过 `PINModal` 验证。

### 全局状态（单一 Store）

所有状态集中在 `src/store/useAppStore.ts`（Zustand + AsyncStorage 持久化）。

持久化 key：`little-brave-adventure-storage`

**Store 核心字段：**
- `tasks` — 当日任务列表（每日需手动 `resetDailyTasks` 重置）
- `cards` — 孩子的卡牌背包（攻击后自动销毁，无需外部调用 `removeCard`）
- `monsters` — 所有怪兽，含已击倒的（`isDefeated` 区分）
- `currentMonsterIndex` — 当前挑战怪兽在未击倒列表中的索引
- `shopItems` — 初始值从 `SHOP_ITEM_TEMPLATES` 生成，带 ID `shop_0`..`shop_N`
- `redemptions` — 兑换记录，现实奖励初始为 `pending_delivery`

### 任务完成的两条路径

```
completeTask(id)
  ├── taskConfirmMode === 'auto'
  │     → 任务状态 completed + addCard() + addPoints()  （立即发卡）
  └── taskConfirmMode === 'parent_confirm'
        → 任务状态 waiting_confirm                      （等家长）
              ↓ confirmTask(id)
              → 任务状态 completed + addCard() + addPoints()
```

获取新卡牌的正确方式（Zustand 同步更新）：
```typescript
completeTask(taskId);
const newCard = useAppStore.getState().cards
  .filter(c => c.taskId === taskId)
  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
```

### 卡牌规则

- 普通任务 → `CardType: 'tool'`，图标从 `TOOL_CARD_ICONS` 随机取
- 困难任务 → `CardType: 'skill'`，图标从 `SKILL_CARD_ICONS` 随机取
- `attackCurrentMonster(damage, cardId)` 内部自动调用 `removeCard`
- 击倒怪兽（HP ≤ 0）时额外奖励积分：`Math.floor(monster.maxHP * 0.1)`

## 目录结构关键点

```
src/
├── components/
│   ├── CardRewardModal.tsx   # 卡牌获得动画弹窗（RN 内置 Animated，非 Reanimated）
│   └── PINModal.tsx          # 家长PIN验证弹窗
├── store/
│   ├── types.ts              # 所有 TypeScript 接口（改类型从这里开始）
│   └── useAppStore.ts        # 唯一状态源，含所有业务逻辑
├── constants/
│   └── templates.ts          # 预设数据（任务/怪兽/商城模板、卡牌图标池）
├── navigation/
│   └── AppNavigator.tsx      # 导航入口
└── screens/
    ├── onboarding/           # 7步引导（已完成）
    ├── child/                # 儿童端
    └── parent/               # 家长端
```

## 开发阶段进度

- [x] 阶段 1：数据层（types + store + templates）
- [x] 阶段 2：Onboarding 全流程（7步）
- [ ] 阶段 3：家长端管理（任务/怪兽/商城配置）
- [x] 阶段 4：儿童端任务大厅（含卡牌获得动画）
- [ ] 阶段 5：战斗系统（卡牌堆叠 + 上滑攻击 + 动画）
- [ ] 阶段 6：积分商城儿童端
- [ ] 阶段 7：音效与细节打磨
- [ ] 阶段 8：上架准备
