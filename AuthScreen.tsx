import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Screen from '../components/Screen';
import { auth, db } from '../../config/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('register');

  async function register() {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        name: name.trim() || 'Player',
        email: cred.user.email,
        points: 0,
        earningsPesos: 0,
        gamesPlayed: 0,
        bestWpm: 0,
        accuracy: 0,
        joinDateMs: Date.now(),
        createdAt: serverTimestamp(),
      });
    } catch (e: any) {
      Alert.alert('Register error', e?.message ?? '');
    }
  }

  async function login() {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e: any) {
      Alert.alert('Login error', e?.message ?? '');
    }
  }

  return (
    <Screen>
      <Text style={styles.title}>Type & Earn</Text>

      <Text style={styles.subtitle}>{mode === 'register' ? 'Create account' : 'Sign in'}</Text>

      {mode === 'register' && (
        <TextInput
          placeholder="Name"
          placeholderTextColor="#7d8fb6"
          style={styles.input}
          value={name}
          onChangeText={setName}
        />
      )}

      <TextInput
        placeholder="Email"
        placeholderTextColor="#7d8fb6"
        style={styles.input}
        value={email}
        keyboardType="email-address"
        autoCapitalize="none"
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#7d8fb6"
        style={styles.input}
        value={password}
        secureTextEntry
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={() => (mode === 'register' ? register() : login())}
      >
        <Text style={styles.buttonText}>{mode === 'register' ? 'Register' : 'Login'}</Text>
      </TouchableOpacity>

      <View style={styles.switchRow}>
        <Text style={styles.switchText}>
          {mode === 'register' ? 'Already have an account?' : "Don't have an account?"}
        </Text>
        <TouchableOpacity onPress={() => setMode((m) => (m === 'register' ? 'login' : 'register'))}>
          <Text style={styles.switchLink}>{mode === 'register' ? 'Login' : 'Register'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.note}>
        Google sign-in is not wired in this MVP scaffold (Expo needs proper auth browser setup).
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', color: '#e8f0ff' },
  subtitle: { color: '#9fb0d0', fontSize: 16, marginTop: 4 },
  input: {
    backgroundColor: '#111b2f',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#e8f0ff',
    borderWidth: 1,
    borderColor: '#1f2b45',
  },
  button: {
    backgroundColor: '#2e7dff',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  switchText: { color: '#9fb0d0' },
  switchLink: { color: '#6aa9ff', fontWeight: '800' },
  note: { color: '#7d8fb6', marginTop: 14, fontSize: 12 },
});

