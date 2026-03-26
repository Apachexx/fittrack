import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';

// Screens (stub imports — implemented below)
import HomeScreen from '../screens/HomeScreen';
import WorkoutListScreen from '../screens/Workout/WorkoutListScreen';
import NutritionScreen from '../screens/Nutrition/NutritionScreen';
import ProgressScreen from '../screens/Progress/ProgressScreen';
import ProgramsScreen from '../screens/Programs/ProgramsScreen';
import LoginScreen from '../screens/Auth/LoginScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_ICONS: Record<string, string> = {
  Home: '🏠',
  Workout: '💪',
  Nutrition: '🥗',
  Progress: '📈',
  Programs: '📋',
};

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>{TAB_ICONS[route.name]}</Text>,
        tabBarStyle: { backgroundColor: '#111827', borderTopColor: '#1f2937' },
        tabBarActiveTintColor: '#f97316',
        tabBarInactiveTintColor: '#6b7280',
        headerStyle: { backgroundColor: '#111827' },
        headerTintColor: '#f9fafb',
        headerTitleStyle: { fontWeight: '700' },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Ana Sayfa' }} />
      <Tab.Screen name="Workout" component={WorkoutListScreen} options={{ title: 'Antrenman' }} />
      <Tab.Screen name="Nutrition" component={NutritionScreen} options={{ title: 'Beslenme' }} />
      <Tab.Screen name="Progress" component={ProgressScreen} options={{ title: 'İlerleme' }} />
      <Tab.Screen name="Programs" component={ProgramsScreen} options={{ title: 'Programlar' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator({
  isAuthenticated,
  onLogin,
}: {
  isAuthenticated: boolean;
  onLogin?: () => void;
}) {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={TabNavigator} />
        ) : (
          <Stack.Screen name="Login">
            {() => <LoginScreen onLogin={onLogin ?? (() => {})} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
