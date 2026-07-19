import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';

export default function Screen({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <SafeAreaView style={[styles.safe, style]}>
      <ScrollView contentContainerStyle={styles.scroll}>{children}</ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0b1220' },
  scroll: { padding: 16, gap: 12 },
});

