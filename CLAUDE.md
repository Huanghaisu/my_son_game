# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目简介

**小勇者大冒险** — 面向 3-6 岁幼儿的家庭激励游戏 iOS App。孩子完成现实任务（刷牙、整理房间等）获得攻击卡牌，用卡牌打怪兽，击倒怪兽兑换现实奖励。家长通过家长端配置任务和奖励。

PRD 文档：`../PRD-小勇者大冒险.md`（项目根目录上一级）

## 常用命令

```bash
# 启动开发服务（iPhone 用 Expo Go 扫码）
npx expo start

# TypeScript 类型检查（提交前必跑）
npx tsc --noEmit

# 安装依赖（用 npm，不用 yarn）
npm install

# EAS 云端构建 iOS（需先登录 Expo 账号）
npx eas build --platform ios
```

## 架构概览

### 导航结构（三棵独立导航树）

`AppNavigator` 根据两个条件选择渲染哪棵树：

```
settings.isOnboardingComplete === false  →  OnboardingNavigator（7步引导）
settings.isOnboardingComplete === true
  currentRole === 'child'               →  ChildNavigator（儿童游戏界面）
  currentRole === 'parent'              →  ParentNavigator（家长管理界面）
```

角色切换不重载 `NavigationContainer`，只改 Zustand 的 `currentRole` 字段，React 响应式更新自动切换导航树。

### 全局状态（单一 Store）

所有状态集中在 `src/store/useAppStore.ts`（Zustand + AsyncStorage 持久化）。

持久化 key：`little-brave-adventure-storage`

**Store 核心字段：**
- `tasks` — 当日任务列表（每日需手动 `resetDailyTasks` 重置状态）
- `cards` — 孩子的卡牌背包（使用后调用 `removeCard` 销毁）
- `monsters` — 所有怪兽，含已击倒的（用 `isDefeated` 区分）
- `currentMonsterIndex` — 当前挑战怪兽在未击倒列表中的索引
- `shopItems` — 初始值从 `SHOP_ITEM_TEMPLATES` 生成，带 ID `shop_0`..`shop_N`
- `redemptions` — 兑换记录，现实奖励初始为 `pending_delivery`

### 任务完成的两条路径

```
completeTask(id)
  ├── taskConfirmMode === 'auto'
  │     → 任务状态 completed + addCard() + addPoints()  （立即）
  └── taskConfirmMode === 'parent_confirm'
        → 任务状态 waiting_confirm                      （等家长）
              ↓ confirmTask(id)
              → 任务状态 completed + addCard() + addPoints()
```

### 卡牌与攻击

- 普通任务 → `CardType: 'tool'`，图标从 `TOOL_CARD_ICONS` 随机取
- 困难任务 → `CardType: 'skill'`，图标从 `SKILL_CARD_ICONS` 随机取
- `attackCurrentMonster(damage, cardId)` 内部自动调用 `removeCard`，无需外部调用
- 击倒怪兽（HP ≤ 0）时额外奖励积分：`Math.floor(monster.maxHP * 0.1)`

### 关键技术约束

- `App.tsx` 第一行必须是 `import 'react-native-gesture-handler'`
- Reanimated 插件已在 `app.json` plugins 注册，无需 babel.config.js
- 所有动画使用 `react-native-reanimated`（v4），手势使用 `react-native-gesture-handler`
- 不使用服务器，所有数据本地存储，`expo-av` 处理音效

## 目录结构关键点

```
src/
├── store/
│   ├── types.ts          # 所有 TypeScript 接口（改类型从这里开始）
│   └── useAppStore.ts    # 唯一状态源，含所有业务逻辑
├── constants/
│   └── templates.ts      # 预设数据（任务/怪兽/商城模板、卡牌图标池）
├── navigation/
│   └── AppNavigator.tsx  # 导航入口，TODO 注释标记待接入的屏幕
└── screens/
    ├── onboarding/       # 7步引导（已完成）
    ├── child/            # 儿童端（任务大厅、卡牌背包、战斗、商城）
    └── parent/           # 家长端（任务/怪兽/商城管理、统计、设置）
```

## 开发阶段进度

- [x] 阶段 1：数据层（types + store + templates）
- [x] 阶段 2：Onboarding 全流程（7步）
- [ ] 阶段 3：家长端管理（任务/怪兽/商城配置）
- [ ] 阶段 4：儿童端任务大厅（含卡牌获得动画）
- [ ] 阶段 5：战斗系统（卡牌堆叠 + 上滑攻击 + 动画）
- [ ] 阶段 6：积分商城儿童端
- [ ] 阶段 7：音效与细节打磨
- [ ] 阶段 8：上架准备
