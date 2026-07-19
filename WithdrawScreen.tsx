import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Screen from '../components/Screen';
import { useAuth } from '../state/auth';
import { db } from '../../config/firebase';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { POINTS_TO_PESOS } from '../../lib/scoring';

const MIN_WITHDRAW_POINTS = 1000;

export default function WithdrawScreen() {
  const { user } = useAuth();
  const [points, setPoints] = useState(0);
  const [fullName, setFullName] = useState('');
  const [gcashNumber, setGcashNumber] = useState('');

  useEffect(() => {
    if (!user) return;
    (async () => {
      const snap = await getDoc(doc(db, 'users', user.uid));
      const d: any = snap.data();
      setPoints(d?.points ?? 0);
    })().catch((e) => Alert.alert('Error', e?.message ?? ''));
  }, [user]);

  const amountPesos = Math.floor(points / POINTS_TO_PESOS);

  async function submitWithdrawal() {
    if (!user) return;

    if (points < MIN_WITHDRAW_POINTS) {
      Alert.alert('Not enough points', `Minimum withdrawal is ${MIN_WITHDRAW_POINTS} points.`);
      return;
    }
    if (!fullName.trim()) {
      Alert.alert('Missing name', 'Enter your full name.');
      return;
    }
    if (!gcashNumber.trim()) {
      Alert.alert('Missing GCash number', 'Enter your GCash number.');
      return;
    }

    const withdrawalId = `${user.uid}_${Date.now()}`;
    const request = {
      withdrawalId,
      uid: user.uid,
      fullName: fullName.trim(),
      gcashNumber: gcashNumber.trim(),
      pointsAtRequest: points,
      amountPesos: amountPesos,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'withdrawals', withdrawalId), request as any);
    Alert.alert('Submitted', 'Your withdrawal request is pending admin approval.');
  }

  return (
    <Screen>
      <Text style={styles.title}>Withdraw (GCash)</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Your Points</Text>
        <Text style={styles.value}>{points}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Estimated Amount</Text>
        <Text style={styles.value}>₱{amountPesos}</Text>
      </View>

      <Text style={styles.sectionTitle}>Withdrawal details</Text>

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        placeholderTextColor="#7d8fb6"
        value={fullName}
        onChangeText={setFullName}
      />
      <TextInput
        style={styles.input}
        placeholder="GCash Number"
        placeholderTextColor="#7d8fb6"
        value={gcashNumber}
        keyboardType="phone-pad"
        onChangeText={setGcashNumber}
      />

      <TouchableOpacity style={styles.button} onPress={submitWithdrawal}>
        <Text style={styles.buttonText}>Request Withdrawal</Text>
      </TouchableOpacity>

      <Text style={styles.note}>
        MVP note: Points deduction and admin approval should be implemented via Cloud Functions + secure rules.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '900', color: '#e8f0ff' },
  card: { backgroundColor: '#111b2f', borderRadius: 16, padding: 16, marginTop: 12 },
  label: { color: '#9fb0d0', fontSize: 13 },
  value: { color: '#e8f0ff', fontSize: 26, fontWeight: '900', marginTop: 8 },
  sectionTitle: { color: '#e8f0ff', fontWeight: '900', marginTop: 14, fontSize: 16 },
  input: { backgroundColor: '#0b1220', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, color: '#e8f0ff', borderWidth: 1, borderColor: '#1f2b45', marginTop: 10 },
  button: { backgroundColor: '#2e7dff', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  note: { color: '#7d8fb6', fontSize: 12, marginTop: 12 },
});

