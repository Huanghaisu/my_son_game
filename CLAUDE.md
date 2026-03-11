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
- **`@expo/vector-icons` 未安装**，不要 import，图标用 emoji Text 代替
- 无服务端，所有数据本地存储；`expo-av` 处理音效和 BGM；`expo-haptics` 处理触觉反馈

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

ManageStack 的子页自带 `navigation.goBack()` 返回按钮，**不**依赖系统 header。

### 全局状态（单一 Store）

所有状态集中在 `src/store/useAppStore.ts`（Zustand + AsyncStorage 持久化）。持久化 key：`little-brave-adventure-storage`

**核心字段：**
- `tasks` — 当日任务列表（每日需手动 `resetDailyTasks` 重置）
- `cards` — 孩子的卡牌背包，上限 10 张用于战斗（攻击后 store 内自动销毁）
- `monsters` — 所有怪兽含已击倒的（`isDefeated` 区分）；`currentMonsterIndex` 指向未击倒列表中当前怪兽
- `shopItems` — 初始值从 `SHOP_ITEM_TEMPLATES` 生成；更新模板**不会**覆盖已持久化数据
- `redemptions` — 兑换记录，初始为 `pending_delivery`，家长确认后变 `delivered`

### 任务完成的两条路径

```
completeTask(id)
  ├── taskConfirmMode === 'auto'
  │     → 状态 completed + addCard() + addPoints()  （立即发卡）
  └── taskConfirmMode === 'parent_confirm'
        → 状态 waiting_confirm                       （等家长审核）
              ↓ confirmTask(id) / rejectTask(id)
              → 状态 completed + addCard() + addPoints()
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
- **稀有度系统**（CardBackpackScreen 展示用）：攻击力 ≥10 = 💎 史诗（金色边框+光晕），6-9 = ✨ 稀有（浅紫边框），其余 = 普通
- **视觉架构**：攻击卡牌采用**三段式布局**（深色标题带、中置带平台图标区、浅色描述底座）。
- **动态特效**：顶部卡牌具有 `swayAnim` 产生的微小**悬浮摇摆**动画，模拟真实卡牌手感。
- **颜色规则**：卡牌类型色（工具卡蓝 `#2563EB` / 绝招卡紫 `#7C3AED`）始终优先，稀有度仅通过角标+边框叠加，**绝不覆盖 Header 背景色**

### 战斗系统关键模式（BattleScreen）

- **场景化分层**：使用 `BattleScene` 包裹，包含蓝天、动画云朵（循环位移）、远景山脉和草地。
- **怪兽 Idle 动画**：`Animated.loop` 平滑呼吸（Scale 1.0~1.03）与悬浮（TranslateY -8~0），增强生命感。
- **UI 重写**：血条移至怪兽头部上方，采用胶囊样式；顶栏和卡牌区叠加在全屏背景之上。
- **指引性**：卡牌上方始终由 `swipeUpAnim` 驱动循环脉冲箭头 `↑`，明确上划攻击指令。
- **自定义形象**：优先渲染 `Monster.imageUri`（建议 1024x1024 PNG），无图片则降级渲染巨大化 Emoji。

`PanResponder` 只创建一次，通过 **callback ref** 避免 stale closure：

```typescript
// 每次渲染刷新 ref，PanResponder 调用 ref 中的最新函数
const gestureRef = useRef({ onSwipeUp: () => {}, onSwipeSide: (_dx: number) => {} });
gestureRef.current = { onSwipeUp: () => { /* 使用最新 state */ }, ... };

// isAnimating 也用 ref 同步，供 onStartShouldSetPanResponder 使用
const isAnimatingRef = useRef(false);
isAnimatingRef.current = isAnimating;
```

HP 条动画需 `useNativeDriver: false`（修改 `width` 百分比），其余 transform/opacity 均用 `useNativeDriver: true`。

击倒怪兽后关闭弹窗时直接读取 Zustand 同步状态：
```typescript
loadNextMonster();
const next = useAppStore.getState().monsters.filter(m => !m.isDefeated)[0];
if (next) hpBarAnim.setValue(next.currentHP / next.maxHP);
```

### 家长端管理页模式

TaskManage / MonsterManage / ShopManage 均采用：列表页 + 底部抽屉 Modal（`animationType="slide"`）+ `KeyboardAvoidingView behavior="padding"`（iOS）。删除操作必须经过 `Alert.alert` 二次确认。

### 金币商城（儿童端）

- 儿童端 UI 层显示"金币"，数据层字段为 `points`
- `ChildShopScreen` 内含两个自定义 Tab（非导航 Tab）：商城（2列网格）+ 兑换记录（`pending_delivery` 时显示红点）
- 兑换弹窗用单 Modal + `modalStep` 状态机（`null → confirm → success`）

### 设计系统

`src/constants/theme.ts` 导出统一设计令牌：`Colors`、`Spacing`、`Radius`、`FontSize`、`Shadow`。新页面/组件应从此文件引用颜色和间距，避免硬编码。

**金币图标**：`src/components/GoldCoin.tsx`（双层金色圆形 View）。全项目禁止直接使用 🪙 emoji，因为 iOS 渲染为银色。所有显示金币数量的地方用 `<GoldCoin size={n} />` + 数字 Text 组合（需外层 `flexDirection: 'row', alignItems: 'center'`）。

**UI 约束（触摸交互）：**
- 所有可点击元素最小触摸区域 44×44pt；小按钮用 `hitSlop` 扩展
- 按压反馈用 `Animated.spring` scale（0.95→1），不单独依赖 `activeOpacity`
- 按钮弹窗动画：`Animated.spring` + `useNativeDriver: true`

## 关键文件

```
src/
├── constants/
│   ├── theme.ts      # 设计令牌（Colors/Spacing/Radius/FontSize/Shadow）
│   └── templates.ts  # 预设数据（任务/怪兽/商城模板、卡牌图标池）
├── store/
│   ├── types.ts      # 所有 TypeScript 接口（改类型从这里开始）
│   └── useAppStore.ts # 唯一状态源，含所有业务逻辑
├── utils/
│   ├── haptics.ts       # 触觉反馈封装（hapticLight/Medium/Heavy/Success/Warning/Error）
│   ├── soundManager.ts  # 音效预加载池（8个 SoundName，playSound(name) 调用）
│   └── bgmManager.ts    # BGM 循环播放（initBGM/unloadBGM/setBGMMuted，含 AppState 自动暂停）
├── navigation/
│   └── AppNavigator.tsx # 导航入口（三棵导航树 + ManageStack 嵌套）
├── components/
│   ├── GoldCoin.tsx             # 金色硬币图标（替代 🪙 emoji）
│   ├── BattleScene.tsx          # 战斗场景多层背景（云朵/宝箱/山脉）
│   ├── CardRewardModal.tsx      # 任务完成卡牌获得弹窗
│   ├── MonsterDefeatedModal.tsx # 怪兽击倒庆祝弹窗
│   └── PINModal.tsx             # 家长 PIN 验证弹窗
└── screens/
    ├── onboarding/  # 7步引导
    ├── child/       # TaskHall / CardBackpack / Battle / ChildShop
    └── parent/      # ParentHome / PendingTasks / ManageMenu / TaskManage
                     # MonsterManage / ShopManage / ParentSettings
```

## 开发阶段进度

- [x] 阶段 1：数据层（types + store + templates）
- [x] 阶段 2：Onboarding 全流程（7步）
- [x] 阶段 3：家长端管理（仪表盘 / 待确认 / 任务管理 / 怪兽管理 / 商城管理 / 设置）
- [x] 阶段 4：儿童端任务大厅（含卡牌获得动画）
- [x] 阶段 5：战斗系统（卡牌堆叠 + 上滑攻击 + 怪兽反击 + 击倒弹窗）
- [x] 阶段 6：金币商城儿童端（2列网格 + 兑换确认弹窗 + 兑换记录Tab）
- [x] 阶段 7：音效（8个 WAV 音效 + BGM 循环，expo-av 全部接入）
- [ ] 阶段 8：上架准备
