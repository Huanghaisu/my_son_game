// ============================================================
// 主导航：根据 Onboarding 状态和当前角色决定展示哪个导航树
// ============================================================

import React from 'react';
import { Text, View } from 'react-native';
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
import TaskHallScreen from '../screens/child/TaskHallScreen';
import CardBackpackScreen from '../screens/child/CardBackpackScreen';
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

// ---- 儿童端 ---------------------------------------------------

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
        name="CardBackpack"
        component={CardBackpackScreen}
        options={{
          tabBarLabel: '卡牌背包',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>🃏</Text>
          ),
        }}
      />
      <ChildTab.Screen
        name="Battle"
        component={BattleScreen}
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

// ---- 家长端管理子导航（嵌套在 管理 Tab 内）-------------------

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

// ---- 家长端主导航（底部 Tab）---------------------------------

function ParentNavigator() {
  const pendingCount = useAppStore(
    state => state.tasks.filter(t => t.status === 'waiting_confirm').length
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

// ---- 根导航 --------------------------------------------------

export default function AppNavigator() {
  const { settings, currentRole } = useAppStore();

  return (
    <NavigationContainer>
      {!settings.isOnboardingComplete ? (
        <OnboardingNavigator />
      ) : currentRole === 'child' ? (
        <ChildNavigator />
      ) : (
        <ParentNavigator />
      )}
    </NavigationContainer>
  );
}
