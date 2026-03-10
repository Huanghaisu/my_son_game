// ============================================================
// 主导航：根据 Onboarding 状态和当前角色决定展示哪个导航树
// ============================================================

import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
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

// 家长端
import ParentHomeScreen from '../screens/parent/ParentHomeScreen';

const OnboardingStack = createStackNavigator();
const ChildTab = createBottomTabNavigator();
const ParentStack = createStackNavigator();

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
          tabBarLabel: '商城',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>🏪</Text>
          ),
        }}
      />
    </ChildTab.Navigator>
  );
}

function ParentNavigator() {
  return (
    <ParentStack.Navigator screenOptions={{ headerShown: false }}>
      <ParentStack.Screen name="ParentHome" component={ParentHomeScreen} />
      {/* TODO: TaskManage, MonsterManage, ShopManage, Stats, Settings */}
    </ParentStack.Navigator>
  );
}

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
