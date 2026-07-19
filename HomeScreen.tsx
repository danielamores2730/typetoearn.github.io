import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import Screen from '../components/Screen';
import { calcEstimatedEarningsPesos } from '../../lib/scoring';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../state/auth';

export default function HomeScreen({ navigation }: any) {
  const { user, loading } = useAuth();
  const [points, setPoints] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const data: any = snap.data();
          setPoints(data.points ?? 0);
        }
      } catch (e: any) {
        Alert.alert('Error', e?.message ?? 'Failed to load profile');
      }
    })();
  }, [user]);

  const earnings = calcEstimatedEarningsPesos(points);

  if (loading) {
    return (
      <Screen>
        <Text style={styles.title}>Loading...</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.title}>Welcome</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Current Points</Text>
        <Text style={styles.value}>{points}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Estimated Earnings</Text>
        <Text style={styles.value}>₱{earnings}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.small}>Fast play:</Text>
        <Text style={styles.small}>60 seconds per game</Text>
      </View>

      <View style={styles.actions}>
        <Text style={styles.link} onPress={() => navigation.navigate('Game')}>
          Play
        </Text>
        <Text style={styles.link} onPress={() => navigation.navigate('Leaderboard')}>
          Leaderboard
        </Text>
        <Text style={styles.link} onPress={() => navigation.navigate('Withdraw')}>
          Withdraw
        </Text>
        <Text style={styles.link} onPress={() => navigation.navigate('Profile')}>
          Profile
        </Text>
        <Text
          style={[styles.link, { color: '#ff5d5d' }]}
          onPress={async () => {
            try {
              await signOut(auth);
            } catch (e: any) {
              Alert.alert('Sign out error', e?.message ?? '');
            }
          }}
        >
          Sign out
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '700', color: '#e8f0ff' },
  card: { backgroundColor: '#111b2f', borderRadius: 16, padding: 16 },
  label: { color: '#9fb0d0', fontSize: 14 },
  value: { color: '#e8f0ff', fontSize: 30, fontWeight: '800', marginTop: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  small: { color: '#b8c6e4' },
  actions: { marginTop: 8, gap: 12 },
  link: { color: '#6aa9ff', fontSize: 18, fontWeight: '600' },
});

