import React, { useMemo } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { SafeAreaView, StatusBar } from 'react-native';

import HomeScreen from './app/screens/HomeScreen';
import GameScreen from './app/screens/GameScreen';
import ProfileScreen from './app/screens/ProfileScreen';
import LeaderboardScreen from './app/screens/LeaderboardScreen';
import WithdrawScreen from './app/screens/WithdrawScreen';
import AuthScreen from './app/screens/AuthScreen';

import { useAuth } from './app/state/auth';

export type RootStackParamList = {
  Home: undefined;
  Game: undefined;
  Profile: undefined;
  Leaderboard: undefined;
  Withdraw: undefined;
  Auth: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const auth = useAuth();

  const initialRoute = useMemo(() => {
    return auth.user ? 'Home' : 'Auth';
  }, [auth.user]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar />
      <NavigationContainer>
        <Stack.Navigator initialRouteName={initialRoute}>
          <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Game" component={GameScreen} options={{ title: 'Typing Game' }} />
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
          <Stack.Screen name="Leaderboard" component={LeaderboardScreen} options={{ title: 'Leaderboard' }} />
          <Stack.Screen name="Withdraw" component={WithdrawScreen} options={{ title: 'Withdraw' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
}

