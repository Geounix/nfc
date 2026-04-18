import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../constants/Colors';
import { register } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../App';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Register'> };

export default function RegisterScreen({ navigation }: Props) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUser, setToken } = useAuth();

  async function handleRegister() {
    if (!nombre.trim() || !email.trim() || !password.trim()) {
      setError('Por favor completa todos los campos.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await register(nombre.trim(), email.trim().toLowerCase(), password);
      setUser(data.user);
      setToken(data.token);
    } catch (err: any) {
      setError(err.message || 'Error al registrarse.');
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
          <Text style={styles.title}>Crea tu cuenta 🏷️</Text>
          <Text style={styles.subtitle}>Comienza a proteger lo que más quieres</Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️  {error}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          {[
            { label: 'Tu nombre', value: nombre, setter: setNombre, placeholder: 'Juan García', secure: false, type: 'default' as const },
            { label: 'Correo electrónico', value: email, setter: setEmail, placeholder: 'tu@correo.com', secure: false, type: 'email-address' as const },
            { label: 'Contraseña', value: password, setter: setPassword, placeholder: 'Mínimo 6 caracteres', secure: true, type: 'default' as const },
            { label: 'Confirmar contraseña', value: confirmPassword, setter: setConfirmPassword, placeholder: 'Repite tu contraseña', secure: true, type: 'default' as const },
          ].map(field => (
            <View style={styles.fieldWrap} key={field.label}>
              <Text style={styles.label}>{field.label}</Text>
              <TextInput
                style={styles.input}
                value={field.value}
                onChangeText={field.setter}
                placeholder={field.placeholder}
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={field.secure}
                keyboardType={field.type}
                autoCapitalize={field.type === 'email-address' ? 'none' : 'words'}
                autoCorrect={false}
              />
            </View>
          ))}

          <TouchableOpacity
            onPress={handleRegister}
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
                : <Text style={styles.btnText}>Crear mi cuenta</Text>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>Inicia sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 28, paddingTop: 20, paddingBottom: 40 },
  header: { marginBottom: 28 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, marginTop: 8 },
  errorBox: {
    backgroundColor: Colors.error,
    borderWidth: 1, borderColor: 'rgba(244,63,94,0.3)',
    borderRadius: 12, padding: 14, marginBottom: 20,
  },
  errorText: { color: Colors.red, fontSize: 14, fontWeight: '500' },
  form: { gap: 18 },
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
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: Colors.textMuted, fontSize: 14 },
  footerLink: { color: Colors.accentLight, fontWeight: '700', fontSize: 14 },
});
