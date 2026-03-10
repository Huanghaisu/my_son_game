// ============================================================
// 主导航：根据 Onboarding 状态和当前角色决定展示哪个导航树
// ============================================================

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAppStore } from '../store/useAppStore';

// Onboarding 屏幕
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import SetupPINScreen from '../screens/onboarding/SetupPINScreen';
import SetupProfileScreen from '../screens/onboarding/SetupProfileScreen';
import SetupTasksScreen from '../screens/onboarding/SetupTasksScreen';
import SetupMonsterScreen from '../screens/onboarding/SetupMonsterScreen';
import SetupConfirmModeScreen from '../screens/onboarding/SetupConfirmModeScreen';
import SetupCompleteScreen from '../screens/onboarding/SetupCompleteScreen';

// 占位屏幕（后续替换）
import TaskHallScreen from '../screens/child/TaskHallScreen';
import ParentHomeScreen from '../screens/parent/ParentHomeScreen';

const OnboardingStack = createStackNavigator();
const ChildStack = createStackNavigator();
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
    <ChildStack.Navigator screenOptions={{ headerShown: false }}>
      <ChildStack.Screen name="TaskHall" component={TaskHallScreen} />
      {/* TODO: CardBackpack, BattleScreen, ShopScreen */}
    </ChildStack.Navigator>
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
