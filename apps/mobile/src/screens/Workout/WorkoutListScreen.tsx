import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import type { Workout } from '@fittrack/shared';

export default function WorkoutListScreen() {
  const { data: workouts, isLoading } = useQuery<Workout[]>({
    queryKey: ['workouts'],
    queryFn: () => api.get('/workouts').then((r) => r.data),
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={workouts ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Henüz antrenman yok</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardDate}>
              {new Date(item.startedAt).toLocaleDateString('tr-TR')}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
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
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#f9fafb' },
  cardDate: { fontSize: 13, color: '#9ca3af', marginTop: 4 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#6b7280', fontSize: 16 },
});
