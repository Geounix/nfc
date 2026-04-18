import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { getTags, updateTag, deleteTag } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../App';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Main'> };

interface Tag {
  id: string; nombre_tag: string; nombre_dueno: string;
  activo: number; tipo: string;
  especie?: string; raza?: string; color_descripcion?: string;
  total_scans?: number; ultimo_escaneo?: string;
}

export default function DashboardScreen({ navigation }: Props) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, logout } = useAuth();

  // Reload tags each time screen is focused
  useFocusEffect(
    useCallback(() => { loadTags(); }, [])
  );

  async function loadTags() {
    try {
      const data = await getTags();
      setTags(data);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudieron cargar los tags');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleToggle(tag: Tag) {
    try {
      await updateTag(tag.id, { activo: !tag.activo });
      loadTags();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  }

  async function handleDelete(tag: Tag) {
    Alert.alert(
      'Eliminar tag',
      `¿Eliminar "${tag.nombre_tag}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => {
            try {
              await deleteTag(tag.id);
              loadTags();
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  }

  const totalScans = tags.reduce((sum, t) => sum + (t.total_scans || 0), 0);
  const activeCount = tags.filter(t => t.activo).length;

  const renderTag = ({ item }: { item: Tag }) => {
    const isPet = item.tipo === 'mascota';
    return (
      <View style={[styles.tagCard, !item.activo && styles.tagInactive]}>
        {/* Left accent bar */}
        <LinearGradient
          colors={isPet ? ['#FB923C', '#EF4444'] : (Colors.gradientAccent as [string, string])}
          style={styles.accentBar}
        />

        <View style={styles.tagContent}>
          {/* Header */}
          <View style={styles.tagHeader}>
            <View style={styles.tagIdBadge}>
              <Text style={styles.tagIdText}>#{item.id}</Text>
            </View>
            <View style={[styles.typeBadge, isPet ? styles.typePet : styles.typeObj]}>
              <Text style={[styles.typeBadgeText, isPet ? { color: '#FB923C' } : { color: '#60A5FA' }]}>
                {isPet ? '🐾 Mascota' : '🎒 Objeto'}
              </Text>
            </View>
          </View>

          {/* Name + owner */}
          <Text style={styles.tagName}>{item.nombre_tag}</Text>
          <Text style={styles.tagOwner}>👤 {item.nombre_dueno}</Text>

          {/* Pet pills */}
          {isPet && (
            <View style={styles.petPills}>
              {item.especie   && <View style={styles.petPill}><Text style={styles.petPillText}>{item.especie}</Text></View>}
              {item.raza      && <View style={[styles.petPill, styles.petPillGray]}><Text style={styles.petPillGrayText}>{item.raza}</Text></View>}
              {item.color_descripcion && <View style={[styles.petPill, styles.petPillGray]}><Text style={styles.petPillGrayText}>🎨 {item.color_descripcion}</Text></View>}
            </View>
          )}

          {/* Stats */}
          <View style={styles.tagStats}>
            <Text style={styles.tagStatText}>
              📡 {item.total_scans || 0} escaneo{item.total_scans !== 1 ? 's' : ''}
            </Text>
            <View style={[styles.statusDot, { backgroundColor: item.activo ? Colors.cyan : Colors.red }]} />
            <Text style={[styles.statusText, { color: item.activo ? Colors.cyan : Colors.red }]}>
              {item.activo ? 'Activo' : 'Inactivo'}
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.tagActions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('Scans', { tagId: item.id, tagName: item.nombre_tag })}
            >
              <Ionicons name="bar-chart-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.actionText}>Historial</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('EditTag', { tag: item })}
            >
              <Ionicons name="pencil-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.actionText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleToggle(item)}
            >
              <Ionicons name={item.activo ? 'pause-outline' : 'play-outline'} size={16} color={Colors.textSecondary} />
              <Text style={styles.actionText}>{item.activo ? 'Pausar' : 'Activar'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionDanger]}
              onPress={() => handleDelete(item)}
            >
              <Ionicons name="trash-outline" size={16} color={Colors.red} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bgPrimary} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>Hola, {user?.nombre?.split(' ')[0]} 👋</Text>
          <Text style={styles.headerTitle}>Mis Tags NFC</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        {[
          { label: 'Total', value: tags.length, icon: '🏷️', color: Colors.accent },
          { label: 'Activos', value: activeCount, icon: '✅', color: Colors.cyan },
          { label: 'Escaneos', value: totalScans, icon: '📡', color: Colors.magenta },
        ].map(stat => (
          <View style={styles.statCard} key={stat.label}>
            <Text style={styles.statIcon}>{stat.icon}</Text>
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Tags list */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      ) : (
        <FlatList
          data={tags}
          keyExtractor={t => t.id}
          renderItem={renderTag}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadTags(); }}
              colors={[Colors.accent]}
              tintColor={Colors.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🏷️</Text>
              <Text style={styles.emptyTitle}>Sin tags aún</Text>
              <Text style={styles.emptyDesc}>Toca el botón + para agregar tu primer chip NFC</Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddTag')}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={Colors.gradientAccent as [string, string]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color="white" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16,
  },
  headerGreeting: { fontSize: 14, color: Colors.textMuted, fontWeight: '500' },
  headerTitle: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  logoutBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 16,
  },
  statCard: {
    flex: 1, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.glassBorder,
    borderRadius: 16, padding: 14, alignItems: 'center', gap: 4,
  },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  list: { padding: 20, paddingBottom: 100, gap: 14 },
  tagCard: {
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.glassBorder,
    borderRadius: 20, flexDirection: 'row', overflow: 'hidden',
  },
  tagInactive: { opacity: 0.65 },
  accentBar: { width: 4 },
  tagContent: { flex: 1, padding: 16, gap: 8 },
  tagHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tagIdBadge: {
    backgroundColor: 'rgba(139,92,246,0.12)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  tagIdText: { fontFamily: 'monospace', fontSize: 12, color: Colors.accentLight, fontWeight: '600' },
  typeBadge: { borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 },
  typeObj: { backgroundColor: 'rgba(59,130,246,0.15)' },
  typePet: { backgroundColor: 'rgba(251,146,60,0.15)' },
  typeBadgeText: { fontSize: 12, fontWeight: '700' },
  tagName: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  tagOwner: { fontSize: 13, color: Colors.textSecondary },
  petPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  petPill: {
    backgroundColor: 'rgba(251,146,60,0.12)', borderRadius: 100,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  petPillText: { fontSize: 11, color: '#FB923C', fontWeight: '700' },
  petPillGray: { backgroundColor: 'rgba(255,255,255,0.06)' },
  petPillGrayText: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  tagStats: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  tagStatText: { fontSize: 12, color: Colors.textMuted },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '700' },
  tagActions: {
    flexDirection: 'row', gap: 8, marginTop: 4,
    paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.glassBorder,
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.glassBorder,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8,
  },
  actionText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  actionDanger: { marginLeft: 'auto', borderColor: 'rgba(244,63,94,0.3)' },
  fab: {
    position: 'absolute', bottom: 32, right: 24,
    borderRadius: 20, overflow: 'hidden',
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 16, elevation: 12,
  },
  fabGradient: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyIcon: { fontSize: 56, opacity: 0.4 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.textSecondary },
  emptyDesc: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', maxWidth: 260 },
});
