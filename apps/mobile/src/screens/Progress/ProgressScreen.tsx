import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ProgressScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>📈 İlerleme</Text>
      <Text style={styles.sub}>Vücut ölçümleri ve grafikler yakında</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712', alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 24, fontWeight: '800', color: '#f9fafb' },
  sub: { fontSize: 14, color: '#9ca3af', marginTop: 8 },
});
