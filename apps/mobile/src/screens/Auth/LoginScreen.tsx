import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../api/client';

interface Props {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      await AsyncStorage.setItem('accessToken', data.tokens.accessToken);
      await AsyncStorage.setItem('refreshToken', data.tokens.refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      onLogin();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Giriş başarısız';
      Alert.alert('Hata', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>💪</Text>
        <Text style={styles.title}>FitTrack</Text>
        <Text style={styles.subtitle}>Hesabınıza giriş yapın</Text>

        <TextInput
          style={styles.input}
          placeholder="E-posta"
          placeholderTextColor="#6b7280"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Şifre"
          placeholderTextColor="#6b7280"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },
  inner: { flex: 1, justifyContent: 'center', padding: 24 },
  logo: { fontSize: 56, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 32, fontWeight: '800', color: '#f9fafb', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#9ca3af', textAlign: 'center', marginBottom: 32 },
  input: {
    backgroundColor: '#1f2937', borderRadius: 12, padding: 14,
    color: '#f9fafb', fontSize: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#374151',
  },
  button: {
    backgroundColor: '#f97316', borderRadius: 12,
    padding: 16, alignItems: 'center', marginTop: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
