// ============================================================
// 主导航：根据 Onboarding 状态和当前角色决定展示哪个导航树
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import { Text, View, Animated } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import GoldCoin from '../components/GoldCoin';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAppStore } from '../store/useAppStore';

// Onboarding 屏幕
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import SetupPINScreen from '../screens/onboarding/SetupPINScreen';
import SetupProfileScreen from '../screens/onboarding/SetupProfileScreen';
import SetupTasksScreen from '../screens/onboarding/SetupTasksScreen';
import SetupMonsterScreen from '../screens/onboarding/SetupMonsterScreen';
import SetupConfirmModeScreen from '../screens/onboarding/SetupConfirmModeScreen';
import SetupCompleteScreen from '../screens/onboarding/SetupCompleteScreen';

// 儿童端屏幕
import SplashScreen from '../screens/child/SplashScreen';
import TaskHallScreen from '../screens/child/TaskHallScreen';
import MonsterSelectScreen from '../screens/child/MonsterSelectScreen';
import BattleScreen from '../screens/child/BattleScreen';
import ChildShopScreen from '../screens/child/ChildShopScreen';

// 家长端屏幕
import ParentHomeScreen from '../screens/parent/ParentHomeScreen';
import PendingTasksScreen from '../screens/parent/PendingTasksScreen';
import ManageMenuScreen from '../screens/parent/ManageMenuScreen';
import TaskManageScreen from '../screens/parent/TaskManageScreen';
import MonsterManageScreen from '../screens/parent/MonsterManageScreen';
import ShopManageScreen from '../screens/parent/ShopManageScreen';
import ParentSettingsScreen from '../screens/parent/ParentSettingsScreen';

const OnboardingStack = createStackNavigator();
const ChildTab = createBottomTabNavigator();
const BattleStack = createStackNavigator();
const ParentTab = createBottomTabNavigator();
const ManageStack = createStackNavigator();

// ---- Onboarding -----------------------------------------------

function OnboardingNavigator() {
  return (
    <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
      <OnboardingStack.Screen name="Welcome" component={WelcomeScreen} />
      <OnboardingStack.Screen name="SetupPIN" component={SetupPINScreen} />
      <OnboardingStack.Screen name="SetupProfile" component={SetupProfileScreen} />
      <OnboardingStack.Screen name="SetupTasks" component={SetupTasksScreen} />
      <OnboardingStack.Screen name="SetupMonster" component={SetupMonsterScreen} />
      <OnboardingStack.Screen name="SetupConfirmMode" component={SetupConfirmModeScreen} />
      <OnboardingStack.Screen name="SetupComplete" component={SetupCompleteScreen} />
    </OnboardingStack.Navigator>
  );
}

// ---- 战斗子导航（MonsterSelect → Battle）-------------------

function BattleNavigator() {
  return (
    <BattleStack.Navigator screenOptions={{ headerShown: false }}>
      <BattleStack.Screen name="MonsterSelect" component={MonsterSelectScreen} />
      <BattleStack.Screen name="Battle" component={BattleScreen} />
    </BattleStack.Navigator>
  );
}

// ---- 儿童端（含 Splash 前置画面）---------------------------

function ChildNavigator() {
  return (
    <ChildTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          height: 62,
          paddingBottom: 8,
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarActiveTintColor: '#FF8C00',
        tabBarInactiveTintColor: '#aaa',
      }}
    >
      <ChildTab.Screen
        name="TaskHall"
        component={TaskHallScreen}
        options={{
          tabBarLabel: '任务大厅',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>📋</Text>
          ),
        }}
      />
      <ChildTab.Screen
        name="BattleTab"
        component={BattleNavigator}
        options={{
          tabBarLabel: '去战斗',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>⚔️</Text>
          ),
        }}
      />
      <ChildTab.Screen
        name="ChildShop"
        component={ChildShopScreen}
        options={{
          tabBarLabel: '金币商城',
          tabBarIcon: ({ focused }) => (
            <View style={{ opacity: focused ? 1 : 0.5 }}>
              <GoldCoin size={26} />
            </View>
          ),
        }}
      />
    </ChildTab.Navigator>
  );
}

// ---- 家长端管理子导航 ----------------------------------------

function ManageNavigator() {
  return (
    <ManageStack.Navigator screenOptions={{ headerShown: false }}>
      <ManageStack.Screen name="ManageMenu" component={ManageMenuScreen} />
      <ManageStack.Screen name="TaskManage" component={TaskManageScreen} />
      <ManageStack.Screen name="MonsterManage" component={MonsterManageScreen} />
      <ManageStack.Screen name="ShopManage" component={ShopManageScreen} />
    </ManageStack.Navigator>
  );
}

// ---- 家长端主导航 --------------------------------------------

function ParentNavigator() {
  const pendingCount = useAppStore(
    (state) => state.tasks.filter((t) => t.status === 'waiting_confirm').length
  );

  return (
    <ParentTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          height: 62,
          paddingBottom: 8,
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarActiveTintColor: '#4A6FA5',
        tabBarInactiveTintColor: '#aaa',
      }}
    >
      <ParentTab.Screen
        name="ParentHome"
        component={ParentHomeScreen}
        options={{
          tabBarLabel: '首页',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>🏠</Text>
          ),
        }}
      />
      <ParentTab.Screen
        name="Pending"
        component={PendingTasksScreen}
        options={{
          tabBarLabel: '待确认',
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
          tabBarBadgeStyle: { backgroundColor: '#FF8C00', color: '#fff', fontSize: 11 },
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>⏳</Text>
          ),
        }}
      />
      <ParentTab.Screen
        name="Manage"
        component={ManageNavigator}
        options={{
          tabBarLabel: '管理',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>📊</Text>
          ),
        }}
      />
      <ParentTab.Screen
        name="ParentSettings"
        component={ParentSettingsScreen}
        options={{
          tabBarLabel: '设置',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>⚙️</Text>
          ),
        }}
      />
    </ParentTab.Navigator>
  );
}

// ---- 根导航（含 Splash 状态机）------------------------------

export default function AppNavigator() {
  const { settings, currentRole, monsters, checkAndAutoReset } = useAppStore();
  const [showSplash, setShowSplash] = useState(true);
  const prevRole = useRef(currentRole);

  const activeMonster = monsters.find(m => !m.isDefeated) ?? null;

  // 每次切换到儿童端时重新显示 Splash
  useEffect(() => {
    if (prevRole.current !== currentRole && currentRole === 'child') {
      setShowSplash(true);
    }
    prevRole.current = currentRole;
  }, [currentRole]);

  // 每日自动重置检查
  useEffect(() => {
    if (settings.isOnboardingComplete) {
      checkAndAutoReset();
    }
  }, [settings.isOnboardingComplete]);

  const isChildMode = settings.isOnboardingComplete && currentRole === 'child';

  return (
    <NavigationContainer>
      {!settings.isOnboardingComplete ? (
        <OnboardingNavigator />
      ) : currentRole === 'child' ? (
        showSplash ? (
          <SplashScreen
            onEnter={() => setShowSplash(false)}
            childName={settings.childName}
            childAvatar={settings.childAvatar}
            monster={activeMonster}
          />
        ) : (
          <ChildNavigator />
        )
      ) : (
        <ParentNavigator />
      )}
    </NavigationContainer>
  );
}
