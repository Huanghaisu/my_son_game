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

## 环境约束

- **Expo Go 版本**：54.0.2（iOS），项目锁定 SDK ~54.0.0
- **Expo Go 始终开启 New Architecture**，无法通过 `newArchEnabled: false` 关闭
- **动画库**：全项目统一使用 RN 内置 `Animated` API，**禁止使用 `react-native-reanimated`**（Expo Go 内 worklets 版本冲突）
- `app.json` 里**不要**注册 `react-native-reanimated` plugin
- `App.tsx` 第一行必须是 `import 'react-native-gesture-handler'`
- 无服务端，所有数据本地存储；`expo-av` 处理音效（尚未实现）；`expo-haptics` 处理触觉反馈（已实现）

## 架构概览

### 导航结构

`AppNavigator` 根据两个条件选择渲染哪棵树：

```
settings.isOnboardingComplete === false  →  OnboardingNavigator（Stack，7步引导）
settings.isOnboardingComplete === true
  currentRole === 'child'               →  ChildNavigator（BottomTabs，4个Tab）
  currentRole === 'parent'              →  ParentNavigator（BottomTabs，4个Tab）
```

角色切换不重载 `NavigationContainer`，只改 Zustand 的 `currentRole` 字段。切换到家长端需通过 `PINModal` 验证。

**家长端导航树（ParentNavigator）：**

```
ParentTab（底部 4 Tab）
  🏠 ParentHome      — 仪表盘（今日进度/怪兽状态/积分/重置任务）
  ⏳ Pending         — 待确认任务列表（badge 显示数量）
  📊 Manage          — 嵌套 ManageStack
       ManageMenu    — 三合一入口（点击跳转子页）
       TaskManage    — 任务增删改（Modal 内编辑）
       MonsterManage — 怪兽队列增删（Modal 内添加）
       ShopManage    — 商城奖励增删改（Modal 内编辑）
  ⚙️  ParentSettings — 孩子档案 / 确认模式 / PIN 修改
```

ManageStack 的子页（TaskManage / MonsterManage / ShopManage）自带 `navigation.goBack()` 返回按钮，**不**依赖系统 header。

### 全局状态（单一 Store）

所有状态集中在 `src/store/useAppStore.ts`（Zustand + AsyncStorage 持久化）。持久化 key：`little-brave-adventure-storage`

**核心字段：**
- `tasks` — 当日任务列表（每日需手动 `resetDailyTasks` 重置，家长端首页有按钮）
- `cards` — 孩子的卡牌背包，上限 10 张用于战斗（攻击后 store 内自动销毁，无需外部调用 `removeCard`）
- `monsters` — 所有怪兽含已击倒的（`isDefeated` 区分）；`currentMonsterIndex` 指向未击倒列表中当前怪兽
- `shopItems` — 初始值从 `SHOP_ITEM_TEMPLATES` 生成，带 ID `shop_0`..`shop_N`
- `redemptions` — 兑换记录，现实奖励初始为 `pending_delivery`，家长确认后变 `delivered`

### 任务完成的两条路径

```
completeTask(id)
  ├── taskConfirmMode === 'auto'
  │     → 状态 completed + addCard() + addPoints()  （立即发卡）
  └── taskConfirmMode === 'parent_confirm'
        → 状态 waiting_confirm                       （等家长审核）
              ↓ confirmTask(id) / rejectTask(id)
              → 状态 completed + addCard() + addPoints()
              → 或状态回退为 pending
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

### 战斗系统关键模式（BattleScreen）

`PanResponder` 只创建一次，通过 **callback ref** 避免 stale closure：

```typescript
// 每次渲染刷新 ref，PanResponder 调用 ref 中的最新函数
const gestureRef = useRef({ onSwipeUp: () => {}, onSwipeSide: (_dx: number) => {} });
gestureRef.current = { onSwipeUp: () => { /* 使用最新 state */ }, ... };

// isAnimating 也用 ref 同步，供 onStartShouldSetPanResponder 使用
const isAnimatingRef = useRef(false);
isAnimatingRef.current = isAnimating;
```

HP 条动画需 `useNativeDriver: false`（修改 `width` 百分比属性），其余 transform/opacity 动画均用 `useNativeDriver: true`。

击倒怪兽后关闭弹窗时，Zustand 同步更新，可直接读取最新状态同步 HP 条：
```typescript
loadNextMonster();
const state = useAppStore.getState();
const next = state.monsters.filter(m => !m.isDefeated)[0];
if (next) hpBarAnim.setValue(next.currentHP / next.maxHP);
```

### 家长端管理页模式

TaskManage / MonsterManage / ShopManage 三个管理页均采用相同模式：
- 列表页 + **底部抽屉 Modal**（animationType="slide"）做增/编辑，不跳新页面
- 表单字段：TextInput + 横向 ScrollView 图标选择器 + TouchableOpacity 按钮组
- 删除操作必须经过 `Alert.alert` 二次确认
- 所有 Modal 包裹 `KeyboardAvoidingView behavior="padding"`（iOS）

### 金币商城（儿童端）

- 儿童端货币统一显示为 🪙 **金币**（数据层字段仍为 `points`，仅 UI 层改名）
- 家长端管理页保留"积分"称呼
- `ChildShopScreen` 内含两个自定义 Tab（非导航 Tab）：
  - **商城 Tab**：2 列网格，金币不足时按钮灰显 + "差 🪙X"
  - **兑换记录 Tab**：按 `createdAt` 倒序，有 `pending_delivery` 时显示红点
- 兑换弹窗用单 Modal + `modalStep` 状态机（`null → confirm → success`），成功时播放 `Animated.spring` 弹出动画
- 商城商品数据持久化在 AsyncStorage；更新 `SHOP_ITEM_TEMPLATES` **不会**自动覆盖已持久化数据，需家长端手动管理或清除 App 数据

## 关键文件

```
src/
├── components/
│   ├── CardRewardModal.tsx       # 任务完成卡牌获得弹窗（Spring 动画）
│   ├── MonsterDefeatedModal.tsx  # 怪兽击倒庆祝弹窗（Spring 动画 + 旋转星星）
│   └── PINModal.tsx              # 家长 PIN 验证弹窗
├── store/
│   ├── types.ts                  # 所有 TypeScript 接口（改类型从这里开始）
│   └── useAppStore.ts            # 唯一状态源，含所有业务逻辑
├── utils/
│   └── haptics.ts                # 触觉反馈封装（hapticLight/Medium/Heavy/Success/Warning/Error）
├── constants/
│   └── templates.ts              # 预设数据（任务/怪兽/商城模板、卡牌图标池）
├── navigation/
│   └── AppNavigator.tsx          # 导航入口（三棵导航树 + ManageStack 嵌套）
└── screens/
    ├── onboarding/               # 7步引导（已完成）
    ├── child/                    # 儿童端（TaskHall / CardBackpack / Battle / ChildShopScreen）
    └── parent/                   # 家长端（7个屏幕，已完成）
        ├── ParentHomeScreen.tsx  # 仪表盘
        ├── PendingTasksScreen.tsx
        ├── ManageMenuScreen.tsx
        ├── TaskManageScreen.tsx
        ├── MonsterManageScreen.tsx
        ├── ShopManageScreen.tsx
        └── ParentSettingsScreen.tsx
```

## 开发阶段进度

- [x] 阶段 1：数据层（types + store + templates）
- [x] 阶段 2：Onboarding 全流程（7步）
- [x] 阶段 3：家长端管理（仪表盘 / 待确认 / 任务管理 / 怪兽管理 / 商城管理 / 设置）
- [x] 阶段 4：儿童端任务大厅（含卡牌获得动画）
- [x] 阶段 5：战斗系统（卡牌堆叠 + 上滑攻击 + 怪兽反击 + 击倒弹窗）
- [x] 阶段 6：金币商城儿童端（2列网格 + 兑换确认弹窗 + 兑换记录Tab）
- [ ] 阶段 7：音效与细节打磨（触觉反馈已完成；待做：伤害飘字增强、expo-av 音效接入、空状态 UI）
- [ ] 阶段 8：上架准备
