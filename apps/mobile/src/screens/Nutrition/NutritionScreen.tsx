import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import BarcodeScannerScreen from './BarcodeScannerScreen';

export default function NutritionScreen() {
  const [showScanner, setShowScanner] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const { data: summary } = useQuery({
    queryKey: ['nutrition-summary', today],
    queryFn: () => api.get(`/nutrition/summary?date=${today}`).then((r) => r.data),
  });

  if (showScanner) {
    return (
      <BarcodeScannerScreen
        onFoodFound={(food) => {
          console.log('Gıda bulundu:', food);
          setShowScanner(false);
        }}
        onClose={() => setShowScanner(false)}
      />
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Bugünkü Beslenme</Text>

      <View style={styles.macroRow}>
        {[
          { label: 'Kalori', value: Math.round(summary?.totalCalories ?? 0), unit: 'kcal', color: '#f97316' },
          { label: 'Protein', value: Math.round(summary?.totalProtein ?? 0), unit: 'g', color: '#3b82f6' },
          { label: 'Karb', value: Math.round(summary?.totalCarbs ?? 0), unit: 'g', color: '#eab308' },
          { label: 'Yağ', value: Math.round(summary?.totalFat ?? 0), unit: 'g', color: '#ec4899' },
        ].map((m) => (
          <View key={m.label} style={styles.macroCard}>
            <Text style={[styles.macroValue, { color: m.color }]}>{m.value}</Text>
            <Text style={styles.macroUnit}>{m.unit}</Text>
            <Text style={styles.macroLabel}>{m.label}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.barcodeButton} onPress={() => setShowScanner(true)}>
        <Text style={styles.barcodeButtonText}>📷 Barkod ile Ekle</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#f9fafb', marginBottom: 20 },
  macroRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  macroCard: {
    flex: 1, backgroundColor: '#111827', borderRadius: 16,
    padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#1f2937',
  },
  macroValue: { fontSize: 22, fontWeight: '800' },
  macroUnit: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  macroLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  barcodeButton: {
    backgroundColor: '#1f2937', borderRadius: 16,
    padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#374151',
  },
  barcodeButtonText: { color: '#f9fafb', fontSize: 16, fontWeight: '600' },
});
