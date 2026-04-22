import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, StatusBar, Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../constants/Colors';
import { RootStackParamList } from '../App';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Welcome'> };

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bgPrimary} />

      {/* Background orbs */}
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      {/* Logo */}
      <View style={styles.logoWrap}>
        <Image style={{ width: 44, height: 44, resizeMode: 'contain' }} source={require('../assets/logo.png')} />
        <Text style={styles.logoText}>Cerca</Text>
      </View>

      {/* Hero cards */}
      <View style={styles.cardsRow}>
        <View style={[styles.miniCard, styles.miniCardLeft]}>
          <Text style={styles.cardEmoji}>🎒</Text>
          <Text style={styles.cardLabel}>Equipaje</Text>
          <View style={[styles.activeDot, { backgroundColor: Colors.cyan }]} />
        </View>
        <View style={[styles.miniCard, styles.miniCardRight]}>
          <Text style={styles.cardEmoji}>🐕</Text>
          <Text style={styles.cardLabel}>Mascotas</Text>
          <View style={[styles.activeDot, { backgroundColor: Colors.orange }]} />
        </View>
      </View>

      {/* NFC Pulse */}
      <View style={styles.nfcPulse}>
        <Ionicons name="wifi-outline" size={24} color={Colors.cyan} />
        <Text style={styles.nfcText}>Chips NFC · Sin apps · Privacidad total</Text>
      </View>

      {/* Tagline */}
      <View style={styles.heroText}>
        <Text style={styles.title}>
          Lo que más{'\n'}quieres siempre{'\n'}tiene forma de
        </Text>
        <LinearGradient
          colors={Colors.gradientAccent as [string, string]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.highlightBox}
        >
          <Text style={styles.titleHighlight}>volver</Text>
        </LinearGradient>
        <Text style={styles.subtitle}>
          Protege tus mochilas, maletas y mascotas con tecnología NFC.
          Quien las encuentre puede contactarte al instante.
        </Text>
      </View>

      {/* CTAs */}
      <View style={styles.ctas}>
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() => navigation.navigate('Register')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={Colors.gradientAccent as [string, string]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.btnGradient}
          >
            <Text style={styles.btnPrimaryText}>🚀 Comenzar gratis</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnSecondaryText}>Ya tengo una cuenta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  orb1: {
    position: 'absolute', top: -80, left: -80,
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(139,92,246,0.12)',
  },
  orb2: {
    position: 'absolute', bottom: -60, right: -60,
    width: 250, height: 250, borderRadius: 125,
    backgroundColor: 'rgba(217,70,239,0.08)',
  },
  logoWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBox: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  logoEmoji: { fontSize: 22 },
  logoText: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  miniCard: {
    flex: 1, borderRadius: 16, padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  miniCardLeft: {
    backgroundColor: 'rgba(139,92,246,0.1)',
    borderColor: 'rgba(139,92,246,0.3)',
  },
  miniCardRight: {
    backgroundColor: 'rgba(251,146,60,0.1)',
    borderColor: 'rgba(251,146,60,0.3)',
  },
  cardEmoji: { fontSize: 32, marginBottom: 8 },
  cardLabel: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  activeDot: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
  nfcPulse: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(6,182,212,0.08)',
    borderWidth: 1, borderColor: 'rgba(6,182,212,0.2)',
    borderRadius: 100, paddingHorizontal: 16, paddingVertical: 10,
    alignSelf: 'center',
  },
  nfcText: { fontSize: 12, color: Colors.cyan, fontWeight: '600' },
  heroText: { gap: 12 },
  title: {
    fontSize: 34, fontWeight: '900',
    color: Colors.textPrimary, lineHeight: 40,
    letterSpacing: -1,
  },
  highlightBox: { borderRadius: 8, alignSelf: 'flex-start', paddingHorizontal: 4 },
  titleHighlight: {
    fontSize: 34, fontWeight: '900',
    color: 'white', lineHeight: 40,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 15, color: Colors.textSecondary, lineHeight: 23,
  },
  ctas: { gap: 12 },
  btnPrimary: { borderRadius: 16, overflow: 'hidden' },
  btnGradient: { paddingVertical: 18, alignItems: 'center' },
  btnPrimaryText: { fontSize: 16, fontWeight: '700', color: 'white' },
  btnSecondary: {
    paddingVertical: 16, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.glassBorder,
    borderRadius: 16, backgroundColor: Colors.glass,
  },
  btnSecondaryText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
});
