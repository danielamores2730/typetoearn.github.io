import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import { db } from '../../config/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

export default function LeaderboardScreen() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        // MVP approach: fetch top users by points.
        const q = query(collection(db, 'users'), orderBy('points', 'desc'));
        const snap = await getDocs(q);
        const list: any[] = [];
        snap.forEach((d) => list.push({ uid: d.id, ...d.data() }));
        setRows(list.slice(0, 30));
      } catch (e: any) {
        Alert.alert('Leaderboard error', e?.message ?? '');
      }
    })();
  }, []);

  return (
    <Screen>
      <Text style={styles.title}>Leaderboard</Text>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.uid}
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            <Text style={styles.rank}>#{index + 1}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name ?? 'Player'}</Text>
              <Text style={styles.meta}>WPM: {(item.bestWpm ?? 0).toFixed(0)} | Accuracy: {(item.accuracy ?? 0).toFixed(1)}%</Text>
            </View>
            <Text style={styles.points}>{item.points ?? 0}</Text>
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '900', color: '#e8f0ff', marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111b2f', borderRadius: 16, padding: 14, marginBottom: 10, gap: 10 },
  rank: { color: '#6aa9ff', fontWeight: '900', fontSize: 18, width: 50 },
  name: { color: '#e8f0ff', fontWeight: '800', fontSize: 16 },
  meta: { color: '#9fb0d0', marginTop: 4 },
  points: { color: '#e8f0ff', fontWeight: '900', fontSize: 18 },
});

