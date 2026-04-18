import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../constants/Colors';
import { getTagScans } from '../services/api';
import { RootStackParamList } from '../App';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Scans'>;
  route: RouteProp<RootStackParamList, 'Scans'>;
};

interface Scan {
  id: number; ip: string; user_agent: string;
  pais: string; ciudad: string; scanned_at: string;
}

function getDeviceEmoji(ua: string) {
  if (!ua) return '❓';
  if (/iPhone/i.test(ua)) return '🍎';
  if (/iPad/i.test(ua)) return '📱';
  if (/Android/i.test(ua)) return '🤖';
  if (/Windows/i.test(ua)) return '🪟';
  if (/Mac/i.test(ua)) return '💻';
  return '🌐';
}

function getDeviceName(ua: string) {
  if (!ua) return 'Desconocido';
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/iPad/i.test(ua)) return 'iPad';
  if (/Android/i.test(ua)) return 'Android';
  if (/Chrome/i.test(ua)) return 'Chrome';
  if (/Safari/i.test(ua)) return 'Safari';
  return 'Navegador';
}

export default function ScansScreen({ route }: Props) {
  const { tagId, tagName } = route.params;
  const [scans, setScans] = useState<Scan[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadScans(); }, []);

  async function loadScans() {
    try {
      const data = await getTagScans(tagId);
      setScans(data.scans || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const renderScan = ({ item }: { item: Scan }) => (
    <View style={styles.scanCard}>
      <View style={styles.scanIcon}>
        <Text style={{ fontSize: 20 }}>{getDeviceEmoji(item.user_agent)}</Text>
      </View>
      <View style={styles.scanInfo}>
        <Text style={styles.scanDate}>
          {new Date(item.scanned_at).toLocaleString('es-ES', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
          })}
        </Text>
        <Text style={styles.scanDevice}>{getDeviceName(item.user_agent)}</Text>
        <Text style={styles.scanLocation}>
          📍 {item.ciudad !== 'Desconocida' ? `${item.ciudad}, ` : ''}{item.pais || 'Ubicación desconocida'}
        </Text>
      </View>
      <View style={styles.scanIp}>
        <Text style={styles.scanIpText}>{item.ip?.slice(0, 12)}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryTag}>{tagName}</Text>
        <Text style={styles.summaryCount}>
          <Text style={styles.summaryNum}>{total}</Text> escaneo{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.accent} size="large" /></View>
      ) : error ? (
        <View style={styles.center}><Text style={styles.errorText}>{error}</Text></View>
      ) : scans.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>📡</Text>
          <Text style={styles.emptyTitle}>Sin escaneos todavía</Text>
          <Text style={styles.emptyDesc}>Cuando alguien escanee el chip, aparecerá aquí.</Text>
        </View>
      ) : (
        <FlatList
          data={scans}
          keyExtractor={s => String(s.id)}
          renderItem={renderScan}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  summary: {
    padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.glassBorder,
    backgroundColor: Colors.bgSecondary,
  },
  summaryTag: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  summaryCount: { fontSize: 14, color: Colors.textSecondary },
  summaryNum: { color: Colors.accentLight, fontWeight: '800', fontSize: 18 },
  list: { padding: 16, gap: 10 },
  scanCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.glassBorder,
    borderRadius: 14, padding: 14,
  },
  scanIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(139,92,246,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  scanInfo: { flex: 1, gap: 2 },
  scanDate: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  scanDevice: { fontSize: 12, color: Colors.textSecondary },
  scanLocation: { fontSize: 12, color: Colors.textMuted },
  scanIp: {
    backgroundColor: 'rgba(139,92,246,0.08)', borderRadius: 8, padding: 6, maxWidth: 80,
  },
  scanIpText: { fontSize: 10, color: Colors.textMuted, fontFamily: 'monospace' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: Colors.red, textAlign: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.textSecondary },
  emptyDesc: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', maxWidth: 240 },
});
