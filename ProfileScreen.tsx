import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import { useAuth } from '../state/auth';
import { db } from '../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function ProfileScreen() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [points, setPoints] = useState(0);
  const [bestWpm, setBestWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const d: any = snap.data();
          setName(d.name ?? 'Player');
          setEmail(d.email ?? user.email ?? '');
          setPoints(d.points ?? 0);
          setBestWpm(d.bestWpm ?? 0);
          setAccuracy(d.accuracy ?? 0);
          setGamesPlayed(d.gamesPlayed ?? 0);
        }
      } catch (e: any) {
        Alert.alert('Error', e?.message ?? 'Failed to load profile');
      }
    })();
  }, [user]);

  return (
    <Screen>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>{name}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{email}</Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.smallCard}>
          <Text style={styles.label}>Points</Text>
          <Text style={styles.big}>{points}</Text>
        </View>
        <View style={styles.smallCard}>
          <Text style={styles.label}>Best WPM</Text>
          <Text style={styles.big}>{bestWpm.toFixed(0)}</Text>
        </View>
        <View style={styles.smallCard}>
          <Text style={styles.label}>Accuracy</Text>
          <Text style={styles.big}>{accuracy.toFixed(1)}%</Text>
        </View>
        <View style={styles.smallCard}>
          <Text style={styles.label}>Games Played</Text>
          <Text style={styles.big}>{gamesPlayed}</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '900', color: '#e8f0ff' },
  card: { backgroundColor: '#111b2f', borderRadius: 16, padding: 16 },
  label: { color: '#9fb0d0', fontSize: 13 },
  value: { color: '#e8f0ff', fontSize: 16, marginTop: 6, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  smallCard: { backgroundColor: '#111b2f', borderRadius: 16, padding: 16, minWidth: 150, flex: 1 },
  big: { color: '#e8f0ff', fontSize: 22, fontWeight: '900', marginTop: 6 },
});

