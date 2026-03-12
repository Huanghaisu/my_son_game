# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目简介

**小勇者大冒险** — 面向 3-6 岁幼儿的家庭激励 iOS App。孩子完成现实任务（刷牙、整理房间等），任务对应的战斗卡牌点亮，用卡牌打怪兽，击倒怪兽兑换现实奖励。家长通过家长端配置任务、怪兽和商城奖励。

PRD 文档：`../PRD-小勇者大冒险.md`

## 常用命令

```bash
# 启动开发服务（必须加 --host lan，否则 iPhone Expo Go 连不上）
npx expo start --host lan

# 清缓存启动（遇到奇怪问题时用）
npx expo start --host lan --clear

# TypeScript 类型检查（提交前必跑，必须零错误）
npx tsc --noEmit

# 安装依赖（用 npm，不用 yarn）
npm install

# EAS 云端构建 iOS
npx eas build --platform ios
```

## 环境约束

- **Expo SDK**：~55.0.5，Expo Go 54.0.2（iOS）
- **动画库**：全项目统一使用 RN 内置 `Animated` API，**禁止使用 `react-native-reanimated`**（Expo Go 内 worklets 版本冲突，`app.json` 里不要注册其 plugin）
- `App.tsx` 第一行必须是 `import 'react-native-gesture-handler'`
- **`@expo/vector-icons` 未安装**，图标全部用 emoji Text 代替
- 无服务端，所有数据本地 AsyncStorage 持久化
- `expo-av` 处理音效和 BGM；`expo-haptics` 处理触觉反馈

## 架构概览

### 导航结构

`AppNavigator` 根据状态渲染三棵导航树，切换不重载 `NavigationContainer`：

```
isOnboardingComplete === false  →  OnboardingNavigator（Stack，7步）

isOnboardingComplete === true
  currentRole === 'child'       →  SplashScreen（3s后）→ ChildNavigator
  currentRole === 'parent'      →  ParentNavigator
```

**儿童端（ChildNavigator，3个 Tab）：**
```
📋 TaskHall       — 任务大厅
⚔️ BattleTab      — BattleStack（嵌套 Stack）
    MonsterSelect — 怪兽选择界面（选完传 monsterId 参数进入战斗）
    Battle        — 战斗场（接收 route.params.monsterId）
💰 ChildShop      — 金币商城
```

**家长端（ParentNavigator，4个 Tab）：**
```
🏠 ParentHome   — 仪表盘
⏳ Pending      — 待确认任务（badge 显示数量）
📊 Manage       — ManageStack（ManageMenu / TaskManage / MonsterManage / ShopManage）
⚙️  Settings    — 孩子档案 / 确认模式 / PIN 修改
```

SplashScreen 在每次切换到儿童模式时显示，接收 `childName / childAvatar / monster` props 展示个性化欢迎画面和当前怪兽。`AppNavigator` 用 `showSplash` state 控制，`checkAndAutoReset()` 在 `isOnboardingComplete` 变为 true 时调用。

### 全局状态（单一 Store）

`src/store/useAppStore.ts`（Zustand + AsyncStorage，key：`little-brave-adventure-storage`）

**核心字段：**
- `tasks` — 当日任务列表；包含 `battleCardConsumed`（今日战斗是否已消耗）、`streakEnabled/streakCount/streakMilestones`（连续打卡）
- `monsters` — 所有怪兽含已击倒（`isDefeated`），**无** currentMonsterIndex，选择由 MonsterSelectScreen UI 层处理
- `defeatedMonstersHistory` — 历史击败记录，家长快速复用（`reAddMonsterFromHistory`）
- `lastResetDate` — YYYY-MM-DD，`checkAndAutoReset()` 用于每日自动重置
- `pendingMilestoneReward` — 连续打卡里程碑达成时写入，TaskHallScreen 消费后调用 `clearPendingMilestoneReward()` 清除
- `shopItems / redemptions / points / settings / currentRole`

**已移除**：`cards[]`（旧卡牌背包）、`monsterQueue`、`currentMonsterIndex`、`addMonsterToQueue`、`attackCurrentMonster`、`loadNextMonster`、`addCard`、`removeCard`

### 卡牌系统

卡牌不再是独立存储的对象，而是任务状态的镜像：

- **彩色卡牌**：`task.status === 'completed' && !task.battleCardConsumed` → 可上滑攻击
- **灰色卡牌**：其他状态 → 翻到此卡触发怪兽反击动画
- 战斗卡牌数 = 当日启用任务数（`tasks.filter(t => t.isEnabled).slice(0, 10)`）
- 攻击后调用 `attackMonster(monsterId, taskId)`，内部标记 `battleCardConsumed: true` 并扣怪兽 HP
- 普通任务（`type: 'normal'`）→ 普通攻击动画；困难任务（`type: 'hard'`）→ 必杀技演出（`SkillCutscene`）
- 任务完成时 `CardRewardModal` 显示卡牌点亮动画，props 为 `task: Task | null`

### 任务完成路径

```
completeTask(id)
  ├── taskConfirmMode === 'auto'
  │     → status: completed + addPoints() + updateStreak()
  └── taskConfirmMode === 'parent_confirm'
        → status: waiting_confirm
              ↓ confirmTask / rejectTask
              → status: completed + addPoints() + updateStreak()
```

### 每日重置

```typescript
checkAndAutoReset()  // 在 AppNavigator useEffect 中调用
  → 若 lastResetDate !== today()
    → resetDailyTasks()  // 所有 task: status→pending, battleCardConsumed→false
    // 注意：streak 相关字段不重置（streakCount / streakLastCompletedDate 保留）
```

### 连续打卡（Streak）

- `task.streakEnabled` 开启后，每次 `confirmTask/completeTask` 调用 `updateStreak(taskId)`
- 容错规则：diffDays ≤ 2 均计连续（1天=正常连续，2天=容错一次），超过2天归零重计
- 里程碑：3/7/15天，`StreakMilestone.achieved` 标记是否已达成
- 达成里程碑时写入 `pendingMilestoneReward`（持久化），TaskHallScreen 检测后弹出 `StreakMilestoneModal`
- 按天数分色：🔥3天橙色 / ⭐7天紫色 / 👑15天金色

### 必杀技演出（SkillCutscene）

困难任务攻击时触发全屏演出组件 `SkillCutscene`：

```
BattleScreen 上划困难任务卡牌
  → 卡牌飞出（预闪光+放大）
  → afterFlyOut: attackMonster() 提交结果，存入 skillHitRef
  → setShowSkillCutscene(true)
  → SkillCutscene 播放（~1.5s）：压暗→光环→赛罗弹入→冲刺→闪光→退出
  → onComplete → handleSkillCutsceneComplete()
  → 怪兽抖动 + 伤害数字 + HP 条下降
```

英雄图片：`assets/skills/hero_zero.png`（400×600px PNG 透明背景）。`SkillCutscene` 在父组件条件渲染（`{showSkillCutscene && <SkillCutscene .../>}`），`onComplete` 后卸载。

### 怪兽主题系统

`src/constants/monsterThemes.ts` 管理所有主题：

```typescript
MONSTER_THEMES: MonsterTheme[]             // 主题注册表，UI 自动渲染
MONSTER_THEME_IMAGES: Record<string, any>  // require() 映射，key = themeId_imageKey
getMonsterImage(themeId, imageKey)         // 返回 image source 或 null（降级 emoji）
```

图片资源：`assets/monsters/[themeId]_[key].png`（如 `ultraman_baltan.png`，500×500 PNG 透明背景）。新增主题只需在 `MONSTER_THEMES` 加项 + `MONSTER_THEME_IMAGES` 注册 require()。

Monster 对象包含 `imageKey` + `themeId`，渲染优先级：主题图片 → `imageUri`（用户上传）→ emoji。

### 战斗场关键模式（BattleScreen）

- 接收 `route.params.monsterId`，从 store 找到对应怪兽
- `PanResponder` 只创建一次，通过 **callback ref** 避免 stale closure：
  ```typescript
  const gestureRef = useRef({ onSwipeUp: () => {}, onSwipeSide: (_dx: number) => {} });
  gestureRef.current = { /* 每次渲染刷新，使用最新 state */ };
  const isAnimatingRef = useRef(false);
  isAnimatingRef.current = isAnimating;
  ```
- HP 条：`useNativeDriver: false`（width 百分比），其余动画用 `useNativeDriver: true`
- 击倒怪兽弹窗关闭后：`navigation.goBack()` 返回 MonsterSelectScreen

### 家长端怪兽管理（MonsterManageScreen）

添加怪兽有两种模式（Tab 切换）：
- **🎭 主题选择**：选主题 → 选怪兽（带图预览）→ 填奖励 → 保存（自动带 imageKey/themeId）
- **✏️ 自定义**：内置模板快选 + 手动填写 + 相册上传图片

`addMonster()` 需传入 `attack` 字段，`difficulty` 由 store 内部 `getMonsterDifficulty(hp)` 计算，**不需要外部传入**。

### 家长端管理页通用模式

TaskManage / MonsterManage / ShopManage：列表页 + 底部抽屉 Modal（`animationType="slide"`）+ `KeyboardAvoidingView behavior="padding"`（iOS）。删除必须 `Alert.alert` 二次确认。

### 金币商城（儿童端）

- UI 显示"金币"，数据层为 `points`
- 禁止直接用 🪙 emoji（iOS 渲染为银色），用 `<GoldCoin size={n} />` 组件
- `ChildShopScreen` 内含两个自定义 Tab：商城（2列网格）+ 兑换记录
- 兑换弹窗：`modalStep` 状态机（`null → confirm → success`）

### 设计系统

- `src/constants/theme.ts`：`Colors / Spacing / Radius / FontSize / Shadow`，新页面从此引用
- `GoldCoin.tsx`：所有金币显示用 `<GoldCoin size={n} />` + Text 组合，外层需 `flexDirection: 'row', alignItems: 'center'`
- 可点击元素最小 44×44pt，小按钮用 `hitSlop` 扩展
- 按压反馈：`Animated.spring` scale 0.95→1

## 关键文件

```
src/
├── constants/
│   ├── theme.ts          # 设计令牌
│   ├── templates.ts      # 预设任务/怪兽/商城模板数据
│   └── monsterThemes.ts  # 怪兽主题包（MONSTER_THEMES / MONSTER_THEME_IMAGES / getMonsterImage）
├── store/
│   ├── types.ts          # 所有 TypeScript 接口（Task/Monster/MonsterTheme/StreakMilestone/MilestoneAchievement 等）
│   └── useAppStore.ts    # 唯一状态源，含所有业务逻辑
├── utils/
│   ├── haptics.ts        # hapticLight/Medium/Heavy/Success/Warning/Error
│   ├── soundManager.ts   # 音效预加载池（playSound(name)，SoundName 类型限定）
│   └── bgmManager.ts     # BGM 循环（initBGM/unloadBGM/setBGMMuted）
├── navigation/
│   └── AppNavigator.tsx  # 根导航（SplashScreen + 三棵导航树）
├── components/
│   ├── GoldCoin.tsx
│   ├── BattleScene.tsx          # 战斗场景背景（云朵/山脉）
│   ├── CardRewardModal.tsx      # 卡牌点亮弹窗（props: task: Task | null）
│   ├── MonsterDefeatedModal.tsx
│   ├── PINModal.tsx
│   ├── SkillCutscene.tsx        # 必杀技全屏演出（困难任务专属，条件渲染挂载/卸载）
│   └── StreakMilestoneModal.tsx # 连续打卡里程碑庆祝弹窗
assets/
├── monsters/             # 主题怪兽图片（500×500 PNG 透明背景）
│   └── ultraman_*.png
└── skills/               # 必杀技演出图片
    └── hero_zero.png     # 赛罗奥特曼（400×600 PNG 透明背景）
```

## 开发阶段进度

- [x] 阶段 1：数据层（types + store + templates）
- [x] 阶段 2：Onboarding 全流程（7步）
- [x] 阶段 3：家长端管理（仪表盘 / 待确认 / 任务 / 怪兽主题选择 / 商城 / 设置）
- [x] 阶段 4：儿童端任务大厅（卡牌点亮动画）
- [x] 阶段 5：战斗系统（任务镜像卡牌 + 怪兽选择界面 + 普通/绝招攻击 + SplashScreen）
- [x] 阶段 6：金币商城儿童端
- [x] 阶段 7：音效（8个 WAV + BGM）
- [x] 阶段 8：连续打卡 UI（家长配置 + 儿童展示 + 里程碑庆祝弹窗）+ 必杀技演出 + SplashScreen 个性化
- [ ] 阶段 9：家长端历史怪兽复用界面 + 上架准备
