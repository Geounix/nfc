import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../constants/Colors';
import { createTag } from '../services/api';
import { RootStackParamList } from '../App';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'AddTag'> };

export default function AddTagScreen({ navigation }: Props) {
  const [tipo, setTipo] = useState<'objeto' | 'mascota'>('objeto');
  const [id, setId] = useState('');
  const [nombreTag, setNombreTag] = useState('');
  const [nombreDueno, setNombreDueno] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState('');
  // Pet fields
  const [especie, setEspecie] = useState('');
  const [raza, setRaza] = useState('');
  const [color, setColor] = useState('');
  const [edad, setEdad] = useState('');
  const [infoMedica, setInfoMedica] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (!id.trim() || !nombreTag.trim() || !nombreDueno.trim() || !telefono.trim() || !email.trim()) {
      setError('Por favor completa todos los campos requeridos (*).');
      return;
    }
    if (tipo === 'mascota' && !especie.trim()) {
      setError('La especie de tu mascota es requerida.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const body: Record<string, string> = {
        id: id.trim().toUpperCase(), tipo,
        nombre_tag: nombreTag.trim(),
        nombre_dueno: nombreDueno.trim(),
        telefono: telefono.trim(),
        email: email.trim().toLowerCase(),
        mensaje: mensaje.trim(),
      };
      if (tipo === 'mascota') {
        body.especie = especie.trim();
        body.raza = raza.trim();
        body.color_descripcion = color.trim();
        body.edad = edad.trim();
        body.info_medica = infoMedica.trim();
      }
      await createTag(body);
      navigation.goBack();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el tag.');
    } finally {
      setLoading(false);
    }
  }

  const isPet = tipo === 'mascota';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.bgPrimary }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Type selector */}
        <View style={styles.typeSelector}>
          {(['objeto', 'mascota'] as const).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.typeOption, tipo === t && (t === 'mascota' ? styles.typeSelectedPet : styles.typeSelectedObj)]}
              onPress={() => setTipo(t)}
            >
              <Text style={styles.typeOptionText}>
                {t === 'objeto' ? '🎒 Objeto / Equipaje' : '🐾 Mascota'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {error ? <View style={styles.errorBox}><Text style={styles.errorText}>⚠️  {error}</Text></View> : null}

        {/* Common fields */}
        <Field label="ID del Chip NFC *" value={id} onChange={setId}
          placeholder="Ej: ST-001 (impreso en el chip)"
          hint="Este código está en el chip físico que recibiste"
          autoCapitalize="characters" />
        <Field
          label={isPet ? 'Nombre de la mascota *' : 'Nombre del objeto *'}
          value={nombreTag} onChange={setNombreTag}
          placeholder={isPet ? 'Max, Luna, Rocky...' : 'Mi mochila negra de viaje'}
        />
        <Field label="Tu nombre público *" value={nombreDueno} onChange={setNombreDueno}
          placeholder="El nombre que verá quien lo encuentre" />
        <Field label="WhatsApp * (con código de país)" value={telefono} onChange={setTelefono}
          placeholder="+50688889999" keyboardType="phone-pad" />
        <Field label="Correo de contacto *" value={email} onChange={setEmail}
          placeholder="tu@correo.com" keyboardType="email-address" autoCapitalize="none" />

        {/* Pet fields */}
        {isPet && (
          <View style={styles.petSection}>
            <View style={styles.petSectionHeader}>
              <Text style={styles.petSectionTitle}>🐾 Información de la mascota</Text>
            </View>
            <View style={styles.row}>
              <View style={{ flex: 1 }}><Field label="Especie *" value={especie} onChange={setEspecie} placeholder="Perro, Gato..." /></View>
              <View style={{ flex: 1 }}><Field label="Raza" value={raza} onChange={setRaza} placeholder="Golden Retriever" /></View>
            </View>
            <View style={styles.row}>
              <View style={{ flex: 1 }}><Field label="Color / descripción" value={color} onChange={setColor} placeholder="Dorado, collar azul" /></View>
              <View style={{ flex: 1 }}><Field label="Edad" value={edad} onChange={setEdad} placeholder="2 años" /></View>
            </View>
            <Field label="⚕️ Info médica" value={infoMedica} onChange={setInfoMedica}
              placeholder="Alergias, medicamentos, vacunas..." multiline hint="Ayuda en caso de emergencia" />
          </View>
        )}

        {/* Message */}
        <Field label="Mensaje para quien encuentre" value={mensaje} onChange={setMensaje}
          placeholder={isPet ? '¡Hola! Encontraste a mi mascota. Por favor contáctame 🐾' : '¡Hola! Encontraste mi objeto. Por favor contáctame 🙏'}
          multiline />

        <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.btnWrap} activeOpacity={0.85}>
          <LinearGradient
            colors={Colors.gradientAccent as [string, string]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.btnGradient}
          >
            {loading
              ? <ActivityIndicator color="white" />
              : <Text style={styles.btnText}>💾 Guardar Tag</Text>
            }
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, value, onChange, placeholder, keyboardType = 'default', autoCapitalize = 'sentences', multiline = false, hint, }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; keyboardType?: any; autoCapitalize?: any;
  multiline?: boolean; hint?: string;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMulti]}
        value={value} onChangeText={onChange}
        placeholder={placeholder} placeholderTextColor={Colors.textMuted}
        keyboardType={keyboardType} autoCapitalize={autoCapitalize}
        autoCorrect={false} multiline={multiline}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60, gap: 14 },
  typeSelector: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  typeOption: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    alignItems: 'center', borderWidth: 2, borderColor: Colors.glassBorder,
  },
  typeSelectedObj: { borderColor: '#60A5FA', backgroundColor: 'rgba(59,130,246,0.1)' },
  typeSelectedPet: { borderColor: '#FB923C', backgroundColor: 'rgba(251,146,60,0.1)' },
  typeOptionText: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  errorBox: {
    backgroundColor: Colors.error, borderWidth: 1, borderColor: 'rgba(244,63,94,0.3)',
    borderRadius: 12, padding: 14,
  },
  errorText: { color: Colors.red, fontSize: 14, fontWeight: '500' },
  fieldWrap: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  input: {
    backgroundColor: 'rgba(139,92,246,0.06)', borderWidth: 1, borderColor: Colors.glassBorder,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    color: Colors.textPrimary, fontSize: 15,
  },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
  hint: { fontSize: 12, color: Colors.textMuted },
  petSection: {
    backgroundColor: 'rgba(251,146,60,0.05)', borderWidth: 1, borderColor: 'rgba(251,146,60,0.2)',
    borderRadius: 16, padding: 16, gap: 12,
  },
  petSectionHeader: { borderBottomWidth: 1, borderBottomColor: 'rgba(251,146,60,0.15)', paddingBottom: 10 },
  petSectionTitle: { fontSize: 13, fontWeight: '700', color: '#FB923C', textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', gap: 10 },
  btnWrap: { borderRadius: 16, overflow: 'hidden', marginTop: 8 },
  btnGradient: { paddingVertical: 18, alignItems: 'center' },
  btnText: { fontSize: 16, fontWeight: '700', color: 'white' },
});
