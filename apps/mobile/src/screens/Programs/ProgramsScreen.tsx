import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../api/client';
import type { Program } from '@fittrack/shared';

const LEVEL_LABELS: Record<string, string> = {
  beginner: '🟢 Başlangıç',
  intermediate: '🟡 Orta',
  advanced: '🔴 İleri',
};

export default function ProgramsScreen() {
  const { data: programs, isLoading } = useQuery<Program[]>({
    queryKey: ['programs'],
    queryFn: () => api.get('/programs').then((r) => r.data),
  });

  const enrollMutation = useMutation({
    mutationFn: (id: string) => api.post(`/programs/${id}/enroll`),
  });

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#f97316" /></View>;
  }

  return (
    <FlatList
      style={styles.container}
      data={programs ?? []}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.badge}>{LEVEL_LABELS[item.level]}</Text>
            <Text style={styles.duration}>{item.durationWeeks} hafta</Text>
          </View>
          <Text style={styles.title}>{item.title}</Text>
          {item.description && <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>}
          <TouchableOpacity
            style={styles.enrollButton}
            onPress={() => enrollMutation.mutate(item.id)}
          >
            <Text style={styles.enrollText}>Programa Başla</Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#111827', borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: '#1f2937',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  badge: { fontSize: 13, color: '#d1d5db' },
  duration: { fontSize: 13, color: '#9ca3af' },
  title: { fontSize: 18, fontWeight: '700', color: '#f9fafb', marginBottom: 6 },
  desc: { fontSize: 14, color: '#9ca3af', marginBottom: 12 },
  enrollButton: {
    backgroundColor: '#f97316', borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
  },
  enrollText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
