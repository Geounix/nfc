import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../constants/Colors';
import { updateTag } from '../services/api';
import { RootStackParamList } from '../App';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EditTag'>;
  route: RouteProp<RootStackParamList, 'EditTag'>;
};

export default function EditTagScreen({ navigation, route }: Props) {
  const { tag } = route.params;
  const isPet = tag.tipo === 'mascota';

  const [nombreTag, setNombreTag]     = useState(tag.nombre_tag || '');
  const [nombreDueno, setNombreDueno] = useState(tag.nombre_dueno || '');
  const [telefono, setTelefono]       = useState(tag.telefono || '');
  const [email, setEmail]             = useState(tag.email || '');
  const [mensaje, setMensaje]         = useState(tag.mensaje || '');
  const [especie, setEspecie]         = useState(tag.especie || '');
  const [raza, setRaza]               = useState(tag.raza || '');
  const [color, setColor]             = useState(tag.color_descripcion || '');
  const [edad, setEdad]               = useState(tag.edad || '');
  const [infoMedica, setInfoMedica]   = useState(tag.info_medica || '');

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function handleSave() {
    if (!nombreTag.trim() || !nombreDueno.trim() || !telefono.trim() || !email.trim()) {
      setError('Por favor completa todos los campos requeridos.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const body: Record<string, string> = {
        nombre_tag: nombreTag.trim(), nombre_dueno: nombreDueno.trim(),
        telefono: telefono.trim(), email: email.trim().toLowerCase(),
        mensaje: mensaje.trim(),
      };
      if (isPet) {
        body.especie = especie.trim(); body.raza = raza.trim();
        body.color_descripcion = color.trim(); body.edad = edad.trim();
        body.info_medica = infoMedica.trim();
      }
      await updateTag(tag.id, body);
      navigation.goBack();
    } catch (err: any) {
      setError(err.message || 'Error al guardar.')
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.bgPrimary }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Tag ID (read-only) */}
        <View style={styles.idBox}>
          <Text style={styles.idLabel}>ID del chip</Text>
          <Text style={styles.idValue}>{tag.id}</Text>
          <View style={[styles.typeBadge, isPet ? styles.typePet : styles.typeObj]}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: isPet ? '#FB923C' : '#60A5FA' }}>
              {isPet ? '🐾 Mascota' : '🎒 Objeto'}
            </Text>
          </View>
        </View>

        {error ? <View style={styles.errorBox}><Text style={styles.errorText}>⚠️  {error}</Text></View> : null}

        <Field label={isPet ? 'Nombre de la mascota *' : 'Nombre del objeto *'} value={nombreTag} onChange={setNombreTag} />
        <Field label="Tu nombre público *" value={nombreDueno} onChange={setNombreDueno} />
        <Field label="WhatsApp *" value={telefono} onChange={setTelefono} keyboardType="phone-pad" />
        <Field label="Correo *" value={email} onChange={setEmail} keyboardType="email-address" autoCapitalize="none" />

        {isPet && (
          <View style={styles.petSection}>
            <Text style={styles.petSectionTitle}>🐾 Información de la mascota</Text>
            <View style={styles.row}>
              <View style={{ flex: 1 }}><Field label="Especie *" value={especie} onChange={setEspecie} /></View>
              <View style={{ flex: 1 }}><Field label="Raza" value={raza} onChange={setRaza} /></View>
            </View>
            <View style={styles.row}>
              <View style={{ flex: 1 }}><Field label="Color" value={color} onChange={setColor} /></View>
              <View style={{ flex: 1 }}><Field label="Edad" value={edad} onChange={setEdad} /></View>
            </View>
            <Field label="⚕️ Info médica" value={infoMedica} onChange={setInfoMedica} multiline />
          </View>
        )}

        <Field label="Mensaje para quien encuentre" value={mensaje} onChange={setMensaje} multiline />

        <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.btnWrap} activeOpacity={0.85}>
          <LinearGradient
            colors={Colors.gradientAccent as [string, string]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.btnGradient}
          >
            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>💾 Guardar cambios</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, value, onChange, keyboardType = 'default', autoCapitalize = 'sentences', multiline = false }: {
  label: string; value: string; onChange: (v: string) => void;
  keyboardType?: any; autoCapitalize?: any; multiline?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMulti]}
        value={value} onChangeText={onChange}
        placeholderTextColor={Colors.textMuted}
        keyboardType={keyboardType} autoCapitalize={autoCapitalize}
        autoCorrect={false} multiline={multiline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60, gap: 14 },
  idBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(139,92,246,0.08)', borderWidth: 1, borderColor: Colors.glassBorder,
    borderRadius: 14, padding: 14, marginBottom: 4,
  },
  idLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  idValue: { fontFamily: 'monospace', fontSize: 14, color: Colors.accentLight, fontWeight: '700', flex: 1 },
  typeBadge: { borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 },
  typeObj: { backgroundColor: 'rgba(59,130,246,0.15)' },
  typePet: { backgroundColor: 'rgba(251,146,60,0.15)' },
  errorBox: { backgroundColor: Colors.error, borderWidth: 1, borderColor: 'rgba(244,63,94,0.3)', borderRadius: 12, padding: 14 },
  errorText: { color: Colors.red, fontSize: 14, fontWeight: '500' },
  fieldWrap: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  input: {
    backgroundColor: 'rgba(139,92,246,0.06)', borderWidth: 1, borderColor: Colors.glassBorder,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    color: Colors.textPrimary, fontSize: 15,
  },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
  petSection: {
    backgroundColor: 'rgba(251,146,60,0.05)', borderWidth: 1, borderColor: 'rgba(251,146,60,0.2)',
    borderRadius: 16, padding: 16, gap: 12,
  },
  petSectionTitle: { fontSize: 13, fontWeight: '700', color: '#FB923C', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  row: { flexDirection: 'row', gap: 10 },
  btnWrap: { borderRadius: 16, overflow: 'hidden', marginTop: 8 },
  btnGradient: { paddingVertical: 18, alignItems: 'center' },
  btnText: { fontSize: 16, fontWeight: '700', color: 'white' },
});
