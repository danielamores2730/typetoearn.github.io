import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Screen from '../components/Screen';
import { db } from '../../config/firebase';
import { useAuth } from '../state/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { DICTIONARY, getRandomWord } from '../../lib/dictionary';
import { calcAccuracy, calcEstimatedEarningsPesos, calcWpm, POINTS_PER_WORD, POINTS_TO_PESOS, difficultyToWordSpeedMs } from '../../lib/scoring';
import type { Difficulty } from '../../types';
import { v4 as uuidv4 } from 'uuid';

const GAME_DURATION_SEC = 60;

export default function GameScreen() {
  const { user } = useAuth();
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [timeLeftMs, setTimeLeftMs] = useState(GAME_DURATION_SEC * 1000);

  const [currentWord, setCurrentWord] = useState('');
  const [typed, setTyped] = useState('');

  const [totalTyped, setTotalTyped] = useState(0);
  const [correctTyped, setCorrectTyped] = useState(0);

  const [running, setRunning] = useState(false);
  const wordDurationMs = useMemo(() => difficultyToWordSpeedMs(difficulty), [difficulty]);

  const [wordTimerKey, setWordTimerKey] = useState(0);

  useEffect(() => {
    setCurrentWord(getRandomWord(difficulty));
  }, [difficulty]);

  useEffect(() => {
    if (!running) return;
    setTimeLeftMs(GAME_DURATION_SEC * 1000);

    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      const left = Math.max(0, GAME_DURATION_SEC * 1000 - elapsed);
      setTimeLeftMs(left);
      if (left <= 0) {
        clearInterval(id);
        setRunning(false);
      }
    }, 50);

    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (!running) return;
    // New word each time wordTimerKey changes
    setTyped('');
    setCurrentWord(getRandomWord(difficulty));
    setWordTimerKey((k) => k + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!running) return;

    // Word timeout loop
    const id = setInterval(() => {
      // if time is up, we ignore; game end is controlled elsewhere
      setTotalTyped((t) => t + 1);
      // typed is checked on submit; when word expires we treat as incorrect.
      setCurrentWord(getRandomWord(difficulty));
      setTyped('');
    }, wordDurationMs);

    return () => clearInterval(id);
  }, [running, wordDurationMs, difficulty]);

  useEffect(() => {
    if (running) return;
    if (timeLeftMs <= 0) {
      finishGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, timeLeftMs]);

  const accuracy = calcAccuracy(correctTyped, totalTyped);
  const wpm = calcWpm(correctTyped, GAME_DURATION_SEC);
  const pointsEarned = correctTyped * POINTS_PER_WORD;
  const estimatedEarnings = calcEstimatedEarningsPesos(pointsEarned);

  async function ensureUserDocExists() {
    if (!user) return;
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: user.uid,
        name: user.displayName ?? 'Player',
        email: user.email,
        points: 0,
        earningsPesos: 0,
        gamesPlayed: 0,
        bestWpm: 0,
        accuracy: 0,
        joinDateMs: Date.now(),
        createdAt: serverTimestamp(),
      });
    }
  }

  async function finishGame() {
    if (!user) {
      Alert.alert('Not signed in', 'Please sign in to save results.');
      return;
    }

    try {
      await ensureUserDocExists();

      const gameId = uuidv4();
      const gameResult = {
        gameId,
        uid: user.uid,
        finishedAtMs: Date.now(),
        durationSec: GAME_DURATION_SEC,
        totalTyped,
        correctTyped,
        accuracy,
        wpm,
        pointsEarned,
        difficulty,
        createdAt: serverTimestamp(),
      };

      // Save game result (top-level collection)
      await addDoc(collection(db, 'games'), gameResult as any);

      // Update user points + stats
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        points: (await getDoc(userRef)).data()?.points + pointsEarned,
        gamesPlayed: (await getDoc(userRef)).data()?.gamesPlayed + 1,
        bestWpm: Math.max((await getDoc(userRef)).data()?.bestWpm ?? 0, wpm),
        accuracy: accuracy,
        updatedAt: serverTimestamp(),
      } as any);

      Alert.alert(
        'Game Over',
        `Correct: ${correctTyped}\nAccuracy: ${accuracy.toFixed(1)}%\nWPM: ${wpm.toFixed(0)}\nPoints: ${pointsEarned}\nEst. ₱${estimatedEarnings}`
      );
    } catch (e: any) {
      Alert.alert('Save failed', e?.message ?? '');
    }
  }

  function submitWord() {
    if (!running) return;
    const isCorrect = typed.trim().toLowerCase() === currentWord.trim().toLowerCase();
    setTotalTyped((t) => t + 1);
    if (isCorrect) setCorrectTyped((c) => c + 1);

    setCurrentWord(getRandomWord(difficulty));
    setTyped('');
  }

  return (
    <Screen>
      <Text style={styles.title}>Typing Game</Text>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Time</Text>
          <Text style={styles.statValue}>{Math.ceil(timeLeftMs / 1000)}s</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Score</Text>
          <Text style={styles.statValue}>{pointsEarned}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Accuracy</Text>
          <Text style={styles.statValue}>{accuracy.toFixed(1)}%</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>WPM</Text>
          <Text style={styles.statValue}>{wpm.toFixed(0)}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Difficulty</Text>
        <View style={styles.diffRow}>
          {(['easy', 'medium', 'hard'] as const).map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.pill, difficulty === d && styles.pillActive]}
              onPress={() => setDifficulty(d)}
              disabled={running}
            >
              <Text style={[styles.pillText, difficulty === d && { color: '#0b1220' }]}> {d} </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.wordLabel}>Type this word</Text>
        <Text style={styles.word}>{currentWord}</Text>

        <TextInput
          style={styles.input}
          placeholder="Type here..."
          placeholderTextColor="#7d8fb6"
          value={typed}
          autoCapitalize="none"
          onChangeText={setTyped}
          editable={running}
          returnKeyType="done"
          onSubmitEditing={submitWord}
        />

        <TouchableOpacity style={styles.button} onPress={submitWord} disabled={!running}>
          <Text style={styles.buttonText}>Submit</Text>
        </TouchableOpacity>
      </View>

      {!running ? (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#16a34a' }]}
          onPress={() => {
            setTotalTyped(0);
            setCorrectTyped(0);
            setTyped('');
            setTimeLeftMs(GAME_DURATION_SEC * 1000);
            setRunning(true);
          }}
        >
          <Text style={styles.buttonText}>Start 60s Game</Text>
        </TouchableOpacity>
      ) : null}

      <Text style={styles.note}>
        MVP note: word timing is simplified. Anti-cheat/score validation should be server-side.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '800', color: '#e8f0ff' },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  statBox: { backgroundColor: '#111b2f', borderRadius: 14, padding: 10, minWidth: 120 },
  statLabel: { color: '#9fb0d0', fontSize: 12 },
  statValue: { color: '#e8f0ff', fontSize: 18, fontWeight: '900', marginTop: 4 },
  card: { backgroundColor: '#111b2f', borderRadius: 16, padding: 16 },
  cardTitle: { color: '#e8f0ff', fontWeight: '800', marginBottom: 10 },
  diffRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: '#334a72' },
  pillActive: { backgroundColor: '#6aa9ff' },
  pillText: { color: '#e8f0ff', fontWeight: '800' },
  wordLabel: { color: '#9fb0d0', marginBottom: 8 },
  word: { fontSize: 32, fontWeight: '900', color: '#ffffff', marginBottom: 14 },
  input: {
    backgroundColor: '#0b1220',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#e8f0ff',
    borderWidth: 1,
    borderColor: '#1f2b45',
  },
  button: { marginTop: 12, backgroundColor: '#2e7dff', borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  note: { color: '#7d8fb6', marginTop: 8, fontSize: 12 },
});

