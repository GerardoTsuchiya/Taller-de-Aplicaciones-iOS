import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createHabit, updateHabit, deleteHabit } from '@/api/habits';
import { isUnauthorizedError } from '@/api/client';
import {
  cancelHabitReminder,
  loadHabitReminderConfig,
  ReminderMode,
  saveHabitReminderConfig,
  scheduleHabitReminder,
} from '@/services/reminders';
import { Colors, Fonts, MIN_TOUCH } from '@/constants/theme';
import AppHeader from '@/components/AppHeader';
import GridBackground from '@/components/GridBackground';
import PixelButton from '@/components/PixelButton';
import PixelInput from '@/components/PixelInput';
import PixelText from '@/components/PixelText';
//se añadio para el calendario
import MonthCalendar from '@/components/Calendar';
import { getHabitCompletions } from '@/api/habits';

const padTime = (value: number) => String(value).padStart(2, '0');
const formatTime = (hour: number, minute: number) => `${padTime(hour)}:${padTime(minute)}`;

const WEEK_DAYS = [
  { label: 'DOM', value: 0 },
  { label: 'LUN', value: 1 },
  { label: 'MAR', value: 2 },
  { label: 'MIÉ', value: 3 },
  { label: 'JUE', value: 4 },
  { label: 'VIE', value: 5 },
  { label: 'SÁB', value: 6 },
];

const getInitialTime = (time?: string) => {
  const match = time?.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (match) return { hour: Number(match[1]), minute: Number(match[2]) };

  const date = new Date(Date.now() + 60 * 1000);
  return { hour: date.getHours(), minute: date.getMinutes() };
};

export default function HabitFormModal() {
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    description?: string;
    reminder_enabled?: string;
    reminder_time?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isEditing = Boolean(params.id);
  const initialTime = getInitialTime(params.reminder_time);

  const [name, setName] = useState(params.name ?? '');
  const [description, setDescription] = useState(params.description ?? '');
  const [reminderEnabled, setReminderEnabled] = useState(params.reminder_enabled === '1');
  const [reminderMode, setReminderMode] = useState<ReminderMode>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([new Date().getDay()]);
  const [reminderHour, setReminderHour] = useState(initialTime.hour);
  const [reminderMinute, setReminderMinute] = useState(initialTime.minute);
  const [saving, setSaving] = useState(false);

  //del calendario
  const [completions, setCompletions] = useState<string[]>([]);
  const [displayYear, setDisplayYear] = useState<number>(() => new Date().getFullYear());
  const [displayMonth, setDisplayMonth] = useState<number>(() => new Date().getMonth() + 1);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    let mounted = true;
    (async () => {
      // clear previous completions to avoid stale data while loading
      setCompletions([]);
      setLoadingHistory(true);
      try {
        const data = await getHabitCompletions(params.id!);
        if (!mounted) return;
        setCompletions(data.completions ?? []);
      } catch (e: any) {
        // maneja sesión expirada o errores de carga: limpia historial y notifica
        if (isUnauthorizedError(e)) {
          setCompletions([]);
          Alert.alert('Sesión expirada', 'Inicia sesión nuevamente para ver el historial', [
            { text: 'OK', onPress: () => router.replace('/(auth)/login') },
          ]);
          return;
        }
        setCompletions([]);
        Alert.alert('Error', e.message ?? 'No se pudo cargar historial');
      } finally {
        setLoadingHistory(false);
      }
    })();
    return () => { mounted = false; };
  }, [params.id]);

  useEffect(() => {
    if (!params.id) return;

    let mounted = true;
    (async () => {
      const config = await loadHabitReminderConfig(params.id!);
      if (!mounted || !config) return;

      const [hour, minute] = config.time.split(':').map(Number);
      if (Number.isInteger(hour) && Number.isInteger(minute)) {
        setReminderHour(hour);
        setReminderMinute(minute);
      }

      setReminderEnabled(true);
      setReminderMode(config.mode);

      if (config.mode === 'weekly' && typeof config.weekday === 'number') {
        setSelectedDays([config.weekday]);
      } else if (config.mode === 'custom' && Array.isArray(config.weekdays) && config.weekdays.length > 0) {
        setSelectedDays(config.weekdays);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [params.id]);
  //

  const shiftHour = (delta: number) => {
    setReminderHour((current) => (current + delta + 24) % 24);
  };

  const shiftMinute = (delta: number) => {
    setReminderMinute((current) => (current + delta + 60) % 60);
  };

  const selectOffset = (minutes: number) => {
    const date = new Date();
    date.setHours(reminderHour, reminderMinute, 0, 0);
    date.setMinutes(date.getMinutes() + minutes);
    setReminderHour(date.getHours());
    setReminderMinute(date.getMinutes());
  };

  const toggleDay = (day: number) => {
    if (reminderMode === 'weekly') {
      setSelectedDays([day]);
      return;
    }

    setSelectedDays((current) => {
      if (current.includes(day)) {
        const next = current.filter((item) => item !== day);
        return next.length > 0 ? next : current;
      }

      return [...current, day].sort((a, b) => a - b);
    });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre del hábito es requerido');
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      reminder_enabled: reminderEnabled,
      reminder_time: reminderEnabled ? formatTime(reminderHour, reminderMinute) : null,
    };

    const reminderSchedule = reminderEnabled
      ? {
          mode: reminderMode,
          time: formatTime(reminderHour, reminderMinute),
          weekday: reminderMode === 'weekly' ? (selectedDays[0] ?? new Date().getDay()) : undefined,
          weekdays: reminderMode === 'custom' ? (selectedDays.length > 0 ? selectedDays : [new Date().getDay()]) : undefined,
        }
      : null;

    if (reminderEnabled && reminderMode !== 'daily' && selectedDays.length === 0) {
      Alert.alert('Error', 'Selecciona al menos un día para este recordatorio');
      return;
    }

    setSaving(true);
    try {
      const savedHabit = params.id
        ? await updateHabit(params.id, payload)
        : await createHabit(payload);

      const scheduled = savedHabit.reminder_enabled
        ? await scheduleHabitReminder(savedHabit.id, savedHabit.name, reminderSchedule)
        : await cancelHabitReminder(savedHabit.id).then(() => true);

      if (scheduled && reminderSchedule) {
        await saveHabitReminderConfig(savedHabit.id, reminderSchedule);
      }

      if (!scheduled) {
        Alert.alert(
          'Recordatorio no activado',
          'Permite notificaciones para recibir avisos de tus hábitos.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return;
      }

      router.back();
    } catch (e: any) {
      if (isUnauthorizedError(e)) return;
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!params.id) return;

    Alert.alert(
      'Eliminar hábito',
      `¿Eliminar "${name.trim() || 'este hábito'}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              await deleteHabit(params.id!);
              await cancelHabitReminder(params.id!);
              router.back();
            } catch (e: any) {
              if (isUnauthorizedError(e)) return;
              Alert.alert('Error', e.message);
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.screen}>
      <GridBackground />
      <AppHeader
        title={isEditing ? '✎ EDITAR' : '＋ HÁBITO'}
        right={
          <PixelText size={9} color={Colors.redGlow} glow="red" onPress={() => router.back()}>
            CERRAR
          </PixelText>
        }
      />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(28, insets.bottom + 20) }]}
        keyboardShouldPersistTaps="handled"
      >
        <PixelText size={14} glow="red" style={styles.title}>
          {isEditing ? 'MODIFICAR HÁBITO' : 'NUEVO HÁBITO'}
        </PixelText>

        <PixelInput
          label="NOMBRE"
          value={name}
          onChangeText={setName}
          pixelFont
        />

        <View style={styles.field}>
          <PixelText size={9} color={Colors.textSecondary} style={styles.label}>
            DESCRIPCIÓN
          </PixelText>
          <TextInput
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
            placeholderTextColor={Colors.textDisabled}
            cursorColor={Colors.red}
            selectionColor={Colors.red}
            style={[styles.input, styles.textArea]}
          />
        </View>

        <View style={styles.field}>
          <PixelText size={9} color={Colors.textSecondary} style={styles.label}>
            RECORDATORIO
          </PixelText>
          <View style={styles.segment}>
            <TouchableOpacity
              onPress={() => setReminderEnabled(false)}
              activeOpacity={0.7}
              style={[styles.segmentButton, !reminderEnabled && styles.segmentActive]}
            >
              <PixelText size={9} color={!reminderEnabled ? Colors.redGlow : Colors.textDisabled} glow={!reminderEnabled ? 'red' : 'none'}>
                NO
              </PixelText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setReminderEnabled(true)}
              activeOpacity={0.7}
              style={[styles.segmentButton, reminderEnabled && styles.segmentActive]}
            >
              <PixelText size={9} color={reminderEnabled ? Colors.green : Colors.textDisabled} glow={reminderEnabled ? 'green' : 'none'}>
                SÍ
              </PixelText>
            </TouchableOpacity>
          </View>
        </View>

        {reminderEnabled && (
          <View style={styles.field}>
            <PixelText size={9} color={Colors.textSecondary} style={styles.label}>
              HORA DEL RECORDATORIO
            </PixelText>
            <View style={styles.timePicker}>
              <View style={styles.timeColumn}>
                <TouchableOpacity onPress={() => shiftHour(1)} activeOpacity={0.7} style={styles.stepButton}>
                  <PixelText size={10} color={Colors.redGlow} glow="red">▲</PixelText>
                </TouchableOpacity>
                <PixelText size={20} color="#ffffff" glow="red" style={styles.timeValue}>
                  {padTime(reminderHour)}
                </PixelText>
                <PixelText size={7} color={Colors.textDisabled}>HORA</PixelText>
                <TouchableOpacity onPress={() => shiftHour(-1)} activeOpacity={0.7} style={styles.stepButton}>
                  <PixelText size={10} color={Colors.redGlow} glow="red">▼</PixelText>
                </TouchableOpacity>
              </View>
              <PixelText size={18} color={Colors.textSecondary} style={styles.timeDivider}>:</PixelText>
              <View style={styles.timeColumn}>
                <TouchableOpacity onPress={() => shiftMinute(1)} activeOpacity={0.7} style={styles.stepButton}>
                  <PixelText size={10} color={Colors.redGlow} glow="red">▲</PixelText>
                </TouchableOpacity>
                <PixelText size={20} color="#ffffff" glow="red" style={styles.timeValue}>
                  {padTime(reminderMinute)}
                </PixelText>
                <PixelText size={7} color={Colors.textDisabled}>MIN</PixelText>
                <TouchableOpacity onPress={() => shiftMinute(-1)} activeOpacity={0.7} style={styles.stepButton}>
                  <PixelText size={10} color={Colors.redGlow} glow="red">▼</PixelText>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.quickRow}>
              {[1, 5, 15].map((minutes) => (
                <TouchableOpacity
                  key={minutes}
                  onPress={() => selectOffset(minutes)}
                  activeOpacity={0.7}
                  style={styles.quickButton}
                >
                  <PixelText size={8} color={Colors.green} glow="green">
                    +{minutes} MIN
                  </PixelText>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modeSection}>
              <PixelText size={9} color={Colors.textSecondary} style={styles.label}>
                REPETICIÓN
              </PixelText>
              <View style={styles.modeRow}>
                {[
                  { key: 'daily' as const, label: 'DIARIO' },
                  { key: 'weekly' as const, label: 'SEMANAL' },
                  { key: 'custom' as const, label: 'DÍAS' },
                ].map((option) => {
                  const active = reminderMode === option.key;
                  return (
                    <TouchableOpacity
                      key={option.key}
                      onPress={() => setReminderMode(option.key)}
                      activeOpacity={0.7}
                      style={[styles.modeButton, active && styles.modeButtonActive]}
                    >
                      <PixelText size={8} color={active ? Colors.green : Colors.textDisabled} glow={active ? 'green' : 'none'}>
                        {option.label}
                      </PixelText>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {reminderMode === 'weekly' && (
                <View style={styles.daysSection}>
                  <PixelText size={8} color={Colors.textSecondary} style={styles.daysLabel}>
                    ELIGE UN DÍA
                  </PixelText>
                  <View style={styles.daysRow}>
                    {WEEK_DAYS.map((day) => {
                      const active = selectedDays[0] === day.value;
                      return (
                        <TouchableOpacity
                          key={day.value}
                          onPress={() => setSelectedDays([day.value])}
                          activeOpacity={0.7}
                          style={[styles.dayChip, active && styles.dayChipActive]}
                        >
                          <PixelText size={7} color={active ? Colors.green : Colors.textDisabled} glow={active ? 'green' : 'none'}>
                            {day.label}
                          </PixelText>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {reminderMode === 'custom' && (
                <View style={styles.daysSection}>
                  <PixelText size={8} color={Colors.textSecondary} style={styles.daysLabel}>
                    ELIGE UNO O MÁS DÍAS
                  </PixelText>
                  <View style={styles.daysRow}>
                    {WEEK_DAYS.map((day) => {
                      const active = selectedDays.includes(day.value);
                      return (
                        <TouchableOpacity
                          key={day.value}
                          onPress={() => toggleDay(day.value)}
                          activeOpacity={0.7}
                          style={[styles.dayChip, active && styles.dayChipActive]}
                        >
                          <PixelText size={7} color={active ? Colors.green : Colors.textDisabled} glow={active ? 'green' : 'none'}>
                            {day.label}
                          </PixelText>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {reminderMode === 'daily' && (
                <PixelText size={8} color={Colors.textDisabled} style={styles.daysHint}>
                  Se repetirá todos los días a esta hora.
                </PixelText>
              )}
            </View>
          </View>
        )}

        <View style={styles.actions}>
          <PixelButton
            label={isEditing ? '► GUARDAR CAMBIOS' : '► CREAR HÁBITO'}
            onPress={handleSave}
            disabled={saving}
          />
          <PixelButton
            label="CANCELAR"
            onPress={() => router.back()}
            variant="outline"
            disabled={saving}
            style={styles.secondaryButton}
          />
          {isEditing && (
            <TouchableOpacity onPress={handleDelete} disabled={saving} activeOpacity={0.7} style={styles.deleteButton}>
              <PixelText size={9} color={Colors.redGlow} glow="red">
                × ELIMINAR HÁBITO
              </PixelText>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: 20 },
  title: { marginBottom: 20 },
  field: { marginBottom: 12 },
  label: {
    letterSpacing: 1,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0d0d18',
    borderWidth: 1,
    borderColor: '#2a2a44',
    borderRightColor: '#111',
    borderBottomColor: '#111',
    padding: 12,
    minHeight: MIN_TOUCH,
    color: Colors.textMain,
    fontFamily: Fonts.pixel,
    fontSize: 9,
    letterSpacing: 1,
  },
  textArea: {
    minHeight: 92,
    lineHeight: 18,
  },
  segment: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#2a2a44',
    backgroundColor: '#0d0d18',
  },
  segmentButton: {
    flex: 1,
    minHeight: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#1e1e30',
  },
  segmentActive: {
    backgroundColor: 'rgba(204,0,0,0.12)',
    borderColor: Colors.red,
  },
  timePicker: {
    minHeight: 132,
    borderWidth: 1,
    borderColor: '#2a2a44',
    backgroundColor: '#0d0d18',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 10,
  },
  timeColumn: {
    width: 92,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButton: {
    width: '100%',
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1e1e30',
    backgroundColor: '#06060d',
  },
  timeValue: {
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  timeDivider: { marginTop: -14 },
  quickRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  quickButton: {
    flex: 1,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1a3a1a',
    backgroundColor: 'rgba(74,222,128,0.07)',
  },
  modeSection: {
    marginTop: 14,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  modeButton: {
    flex: 1,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2a2a44',
    backgroundColor: '#0d0d18',
  },
  modeButtonActive: {
    borderColor: Colors.green,
    backgroundColor: 'rgba(74,222,128,0.08)',
  },
  daysSection: {
    marginTop: 12,
  },
  daysLabel: {
    marginBottom: 6,
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dayChip: {
    width: '13%',
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2a2a44',
    backgroundColor: '#0d0d18',
  },
  dayChipActive: {
    borderColor: Colors.green,
    backgroundColor: 'rgba(74,222,128,0.08)',
  },
  daysHint: {
    marginTop: 8,
  },
  actions: { marginTop: 8 },
  secondaryButton: { marginTop: 8 },
  deleteButton: {
    marginTop: 12,
    minHeight: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4a0000',
    backgroundColor: 'rgba(204,0,0,0.08)',
  },
});
