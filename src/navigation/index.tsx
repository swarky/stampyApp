import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Colors, Radii } from '../theme';

import CameraScreen        from '../screens/CameraScreen';
import LibraryScreen       from '../screens/LibraryScreen';
import CalendarScreen      from '../screens/CalendarScreen';
import FlowScreen          from '../screens/FlowScreen';
import SaveStampScreen     from '../screens/SaveStampScreen';
import StampDetailScreen   from '../screens/StampDetailScreen';
import SettingsScreen      from '../screens/SettingsScreen';
import CategoryDetailScreen from '../screens/CategoryDetailScreen';
import StampPickerScreen   from '../screens/StampPickerScreen';

// ─── Route param types ────────────────────────────────────────────────────────
export type RootStackParamList = {
  Tabs:           undefined;
  SaveStamp:      { imageUri: string };
  StampDetail:    { stampId: number };
  Settings:       undefined;
  CategoryDetail: { categoryId: number; categoryName: string };
  // Calendar pushes this when the user taps an empty day so they can pick a stamp
  StampPicker:    { forDate: string };
};

export type TabParamList = {
  Camera:   undefined;
  Library:  undefined;
  Calendar: undefined;
  Flow:     undefined;
};

const Tab   = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

// ─── Bottom tab navigator ─────────────────────────────────────────────────────
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 6,
          height: 62,
        },
        tabBarActiveTintColor:   Colors.moonstone,
        tabBarInactiveTintColor: Colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Camera"
        component={CameraScreen}
        options={{ tabBarLabel: 'Create', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📷</Text> }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{ tabBarLabel: 'Library', tabBarIcon: () => <Text style={{ fontSize: 20 }}>🗂️</Text> }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{ tabBarLabel: 'Calendar', tabBarIcon: () => <Text style={{ fontSize: 20 }}>📅</Text> }}
      />
      <Tab.Screen
        name="Flow"
        component={FlowScreen}
        options={{ tabBarLabel: 'Flow', tabBarIcon: () => <Text style={{ fontSize: 20 }}>✨</Text> }}
      />
    </Tab.Navigator>
  );
}

// ─── Root stack (tabs + modal-style screens) ──────────────────────────────────
export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle:      { backgroundColor: Colors.cream },
          headerTintColor:  Colors.moonstone,
          headerTitleStyle: { fontWeight: '700', color: Colors.ink },
          cardStyle:        { backgroundColor: Colors.cream },
        }}
      >
        <Stack.Screen name="Tabs"           component={TabNavigator}         options={{ headerShown: false }} />
        <Stack.Screen name="SaveStamp"      component={SaveStampScreen}      options={{ title: 'New Stamp' }} />
        <Stack.Screen name="StampDetail"    component={StampDetailScreen}    options={{ title: '' }} />
        <Stack.Screen name="Settings"       component={SettingsScreen}       options={{ title: 'Settings' }} />
        <Stack.Screen name="CategoryDetail" component={CategoryDetailScreen} options={({ route }) => ({ title: route.params.categoryName })} />
        <Stack.Screen name="StampPicker"    component={StampPickerScreen}    options={{ title: 'Pick a Stamp' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
