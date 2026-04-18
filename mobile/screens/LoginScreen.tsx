import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../constants/Colors';
import { login } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../App';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Login'> };

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUser, setToken } = useAuth();

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError('Por favor completa todos los campos.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await login(email.trim().toLowerCase(), password);
      setUser(data.user);
      setToken(data.token);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.bgPrimary }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Bienvenido de vuelta 👋</Text>
          <Text style={styles.subtitle}>Inicia sesión para gestionar tus tags</Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️  {error}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="tu@correo.com"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Tu contraseña"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            style={styles.btnWrap}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={Colors.gradientAccent as [string, string]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              {loading
                ? <ActivityIndicator color="white" />
                : <Text style={styles.btnText}>Iniciar sesión</Text>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿No tienes cuenta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.footerLink}>Regístrate gratis</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 28, justifyContent: 'center' },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, marginTop: 8 },
  errorBox: {
    backgroundColor: Colors.error,
    borderWidth: 1, borderColor: 'rgba(244,63,94,0.3)',
    borderRadius: 12, padding: 14, marginBottom: 20,
  },
  errorText: { color: Colors.red, fontSize: 14, fontWeight: '500' },
  form: { gap: 20 },
  fieldWrap: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  input: {
    backgroundColor: 'rgba(139,92,246,0.06)',
    borderWidth: 1, borderColor: Colors.glassBorder,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    color: Colors.textPrimary, fontSize: 15,
  },
  btnWrap: { borderRadius: 16, overflow: 'hidden', marginTop: 8 },
  btnGradient: { paddingVertical: 18, alignItems: 'center' },
  btnText: { fontSize: 16, fontWeight: '700', color: 'white' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { color: Colors.textMuted, fontSize: 14 },
  footerLink: { color: Colors.accentLight, fontWeight: '700', fontSize: 14 },
});
