import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Merhaba 👋</Text>
      <Text style={styles.sub}>Bugün ne yapmak istiyorsun?</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },
  content: { padding: 20 },
  greeting: { fontSize: 28, fontWeight: '800', color: '#f9fafb', marginBottom: 8 },
  sub: { fontSize: 16, color: '#9ca3af' },
});
