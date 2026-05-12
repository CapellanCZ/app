import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { HealthServiceScreenShell } from '../../../../components/health-service/HealthServiceScreenShell';
import { IconsaxArrowLeftIcon } from '../../../../components/icons/IconsaxArrowLeftIcon';
import { useHealthServiceStore } from '../../../../lib/health-service/healthServiceStore';
import {
  getSlotLabelsForPeriod,
  isStaffWorkingOnDate,
} from '../../../../lib/health-service/slotUtils';
import type { SlotPeriod, StaffRole } from '../../../../lib/health-service/types';

const BRAND = '#2970FF';
const BRAND_LIGHT = '#528BFF';
const GRAY_100 = '#F5F5F5';
const GRAY_200 = '#E9EAEB';
const GRAY_500 = '#717680';
const GRAY_600 = '#535862';
const GRAY_800 = '#252B37';

const FEELING_OPTIONS = [
  { id: 'fatigue', label: 'Fatigue' },
  { id: 'pain', label: 'Pain or Injury' },
  { id: 'cramps', label: 'Cramps' },
  { id: 'fever', label: 'Fever' },
  { id: 'digestive', label: 'Digestive Issues' },
  { id: 'sorethroat', label: 'Soretroat' },
];

const PERIOD_TABS: { id: SlotPeriod; label: string }[] = [
  { id: 'morning', label: 'Morning' },
  { id: 'afternoon', label: 'Afternoon' },
  { id: 'evening', label: 'Evening' },
];

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dateKey(d: Date): string {
  const x = startOfDay(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function getWeekDays(anchor: Date): Date[] {
  const s = startOfDay(anchor);
  const dow = s.getDay();
  const daysToMon = dow === 0 ? -6 : 1 - dow;
  const mon = new Date(s);
  mon.setDate(s.getDate() + daysToMon);
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
}

function resolveSpecialty(role: StaffRole, specialty: string): string {
  if (specialty) return specialty;
  if (role === 'doctor') return 'Physician';
  if (role === 'dentist') return 'General Dentist';
  return 'Nurse';
}

function initialsFromName(name: string): string {
  const cleaned = name.replace(/^Dr\.?\s*/i, '').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]?.[0] ?? ''}${parts[parts.length - 1]?.[0] ?? ''}`.toUpperCase();
  return (parts[0]?.slice(0, 2) ?? '?').toUpperCase();
}

export default function HealthServiceBookScreen() {
  const { staffId } = useLocalSearchParams<{ staffId: string }>();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { staff: allStaff } = useHealthServiceStore();

  const staff = useMemo(
    () => (staffId ? allStaff.find((s) => s.id === staffId) : undefined),
    [staffId, allStaff],
  );

  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()));
  const [period, setPeriod] = useState<SlotPeriod>('morning');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [feelingIds, setFeelingIds] = useState<string[]>([]);
  const [symptoms, setSymptoms] = useState('');
  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => { setAvatarFailed(false); }, [staff?.id, staff?.photoUrl]);

  const working = staff ? isStaffWorkingOnDate(staff.id, selectedDay) : false;
  const dk = dateKey(selectedDay);

  const slotLabels = useMemo((): string[] => {
    if (!staff || !working) return [];
    return getSlotLabelsForPeriod(staff.id, dk, period);
  }, [staff, working, dk, period]);

  const weekDays = useMemo(() => getWeekDays(selectedDay), [selectedDay]);

  const goToVisitNotes = useCallback(() => {
    if (!staff || !selectedSlot) return;
    const q = new URLSearchParams({ dateKey: dk, slot: selectedSlot });
    router.push(`/health-service/book/${staff.id}/feelings?${q.toString()}`);
  }, [staff, selectedSlot, dk]);

  const toggleFeeling = (id: string) => {
    setFeelingIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  if (!staff) {
    return (
      <HealthServiceScreenShell>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text style={{ textAlign: 'center', color: GRAY_600 }}>Provider not found.</Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ fontWeight: '600', color: BRAND }}>Go back</Text>
          </Pressable>
        </View>
      </HealthServiceScreenShell>
    );
  }

  const rating = staff.rating ?? 4.6;
  const showPhoto = Boolean(staff.photoUrl) && !avatarFailed;
  const specLabel = resolveSpecialty(staff.role, staff.specialtyLabel);

  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const pillW = Math.floor((screenWidth - 32 - 5 * 8) / 6);

  return (
    <HealthServiceScreenShell>
      <View style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ paddingBottom: 100 + Math.max(insets.bottom, 8) }}>

          {/* ─────────────── GREY HEADER CARD ─────────────── */}
          <View style={{ padding: 8, paddingBottom: 0 }}>
            <View style={{
              backgroundColor: GRAY_100,
              borderRadius: 48,
              paddingTop: insets.top + 12,
              paddingBottom: 28,
              paddingHorizontal: 14,
              gap: 24,
            }}>

              {/* Back + Title */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                  onPress={() => router.back()}
                  style={{
                    width: 44, height: 44, borderRadius: 999,
                    backgroundColor: '#FDFDFD',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                  <IconsaxArrowLeftIcon size={20} color="#181D27" />
                </Pressable>
                <Text style={{ fontSize: 24, fontWeight: '500', color: '#000', letterSpacing: -0.48 }}>
                  Book Appointment
                </Text>
              </View>

              {/* Doctor row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 5, gap: 20 }}>
                {/* Avatar */}
                <View style={{
                  width: 108, height: 108, borderRadius: 999,
                  borderWidth: 4, borderColor: '#FDFDFD',
                  overflow: 'hidden', backgroundColor: '#D8E4F0', flexShrink: 0,
                }}>
                  {showPhoto ? (
                    <Image
                      source={{ uri: staff.photoUrl! }}
                      onError={() => setAvatarFailed(true)}
                      style={{ width: 100, height: 100 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 32, fontWeight: '700', color: BRAND }}>
                        {initialsFromName(staff.name)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Info */}
                <View style={{ flex: 1, gap: 8 }}>
                  {/* Verified badge */}
                  <View style={{
                    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4,
                    backgroundColor: 'rgba(209,224,255,0.6)',
                    borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4,
                  }}>
                    <Ionicons name="checkmark-circle" size={16} color={BRAND} />
                    <Text style={{ fontSize: 12, color: BRAND }}>Professional Doctor</Text>
                  </View>

                  {/* Name */}
                  <View>
                    <Text style={{ fontSize: 24, fontWeight: '500', color: GRAY_800, letterSpacing: -0.96 }} numberOfLines={1}>
                      {staff.name}
                    </Text>
                    <Text style={{ fontSize: 14, color: GRAY_800, marginTop: 2 }}>
                      {specLabel}
                    </Text>
                  </View>

                  {/* Stars */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Ionicons
                        key={i}
                        name="star"
                        size={12}
                        color={i < Math.round(rating) ? '#FDB022' : '#E9EAEB'}
                      />
                    ))}
                    <Text style={{ fontSize: 12, color: GRAY_800, marginLeft: 4 }}>
                      {rating.toFixed(1)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Stats card */}
              <View style={{
                flexDirection: 'row',
                backgroundColor: '#FDFDFD',
                borderRadius: 16,
                paddingVertical: 16,
              }}>
                {[
                  { label: 'Patient', value: '2100+' },
                  { label: 'Experience', value: '10 yrs+' },
                  { label: 'Reviews', value: '20' },
                ].map((stat, i, arr) => (
                  <View key={stat.label} style={{
                    flex: 1, alignItems: 'center',
                    borderRightWidth: i < arr.length - 1 ? 1 : 0,
                    borderRightColor: GRAY_200,
                  }}>
                    <Text style={{ fontSize: 16, fontWeight: '300', color: GRAY_500, letterSpacing: -0.32 }}>
                      {stat.label}
                    </Text>
                    <Text style={{ fontSize: 20, fontWeight: '500', color: GRAY_800, marginTop: 4, letterSpacing: -0.4 }}>
                      {stat.value}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* ─────────────── SELECT DATE ─────────────── */}
          <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
            <Text style={{ fontSize: 22, fontWeight: '600', color: '#000', marginBottom: 16 }}>
              Select Date
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {weekDays.map((d) => {
                const selected = isSameDay(d, selectedDay);
                const today = startOfDay(new Date());
                const isPast = d.getTime() < today.getTime();
                const isDisabled = d.getDay() === 0 || isPast;
                return (
                  <Pressable
                    key={d.getTime()}
                    onPress={() => { if (!isDisabled) { setSelectedDay(startOfDay(d)); setSelectedSlot(null); } }}
                    disabled={isDisabled}
                    style={{
                      width: pillW,
                      paddingVertical: 10,
                      borderRadius: 999,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: selected ? BRAND : '#FFFFFF',
                      borderWidth: 1,
                      borderColor: selected ? BRAND : GRAY_200,
                      opacity: isDisabled && !selected ? 0.45 : 1,
                      gap: 2,
                    }}>
                    <Text style={{
                      fontSize: 11, fontWeight: '500',
                      color: selected ? 'rgba(255,255,255,0.85)' : GRAY_500,
                    }}>
                      {DAY_LABELS[d.getDay()]}
                    </Text>
                    <Text style={{
                      fontSize: 18, fontWeight: '700',
                      color: selected ? '#FFF' : '#000',
                    }}>
                      {d.getDate()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ─────────────── AVAILABLE TIME ─────────────── */}
          <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
            <Text style={{ fontSize: 22, fontWeight: '600', color: '#000', marginBottom: 16 }}>
              Available Time
            </Text>

            {/* Period tabs */}
            <View style={{
              flexDirection: 'row',
              borderRadius: 999,
              borderWidth: 1,
              borderColor: GRAY_200,
              backgroundColor: GRAY_100,
              padding: 3,
              marginBottom: 16,
            }}>
              {PERIOD_TABS.map((t) => {
                const sel = period === t.id;
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => { setPeriod(t.id); setSelectedSlot(null); }}
                    style={{
                      flex: 1,
                      borderRadius: 999,
                      paddingVertical: 10,
                      alignItems: 'center',
                      backgroundColor: sel ? '#FFFFFF' : 'transparent',
                      shadowColor: sel ? '#000' : 'transparent',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: sel ? 0.06 : 0,
                      shadowRadius: 2,
                      elevation: sel ? 1 : 0,
                    }}>
                    <Text style={{
                      fontSize: 14,
                      fontWeight: sel ? '600' : '400',
                      color: sel ? BRAND : GRAY_600,
                    }}>
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Time slot grid — 4 per row */}
            {!working ? (
              <Text style={{ fontSize: 14, color: GRAY_500, textAlign: 'center', paddingVertical: 20 }}>
                No clinic hours on this day.
              </Text>
            ) : slotLabels.length === 0 ? (
              <Text style={{ fontSize: 14, color: GRAY_500, textAlign: 'center', paddingVertical: 20 }}>
                No slots in this period.
              </Text>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {slotLabels.map((label, idx) => {
                  const isSelected = selectedSlot === label;
                  const isGrey = !isSelected && idx % 4 === 0;
                  return (
                    <Pressable
                      key={label}
                      onPress={() => setSelectedSlot(label)}
                      style={{
                        width: (screenWidth - 32 - 30) / 4,
                        paddingVertical: 13,
                        borderRadius: 999,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: isSelected ? BRAND : GRAY_200,
                        backgroundColor: isSelected ? BRAND : '#FFFFFF',
                      }}>
                      <Text style={{
                        fontSize: 14,
                        fontWeight: '500',
                        color: isSelected ? '#FFF' : isGrey ? '#B0B5C0' : GRAY_600,
                      }}>
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          {/* ─────────────── PATIENT INFO ─────────────── */}
          <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
            <Text style={{ fontSize: 22, fontWeight: '600', color: '#000', marginBottom: 8 }}>
              Patient Info
            </Text>
            <Text style={{ fontSize: 16, color: '#000', marginBottom: 12 }}>
              What have you been feeling?
            </Text>

            {/* Symptoms input */}
            <View style={{
              height: 44,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: GRAY_200,
              paddingHorizontal: 12,
              justifyContent: 'center',
              marginBottom: 12,
            }}>
              <TextInput
                placeholder="Type your symptoms..."
                placeholderTextColor={GRAY_500}
                value={symptoms}
                onChangeText={setSymptoms}
                style={{ fontSize: 14, color: '#000', padding: 0 }}
              />
            </View>

            {/* Chip row 1: Fatigue, Pain or Injury, Cramps, Fever */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              {FEELING_OPTIONS.slice(0, 4).map((opt) => {
                const on = feelingIds.includes(opt.id);
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => toggleFeeling(opt.id)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderRadius: 34,
                      borderWidth: 1,
                      backgroundColor: on ? BRAND : GRAY_100,
                      borderColor: on ? BRAND : GRAY_200,
                    }}>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: on ? '#FFF' : GRAY_600 }}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Chip row 2: Digestive Issues, Soretroat */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {FEELING_OPTIONS.slice(4).map((opt) => {
                const on = feelingIds.includes(opt.id);
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => toggleFeeling(opt.id)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderRadius: 34,
                      borderWidth: 1,
                      backgroundColor: on ? BRAND : GRAY_100,
                      borderColor: on ? BRAND : GRAY_200,
                    }}>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: on ? '#FFF' : GRAY_600 }}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

        </ScrollView>

        {/* ─────────────── BOOK BUTTON ─────────────── */}
        <View style={{
          position: 'absolute',
          bottom: Math.max(insets.bottom, 16) + 8,
          left: 16,
          right: 16,
        }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Book Appointment"
            accessibilityState={{ disabled: !selectedSlot }}
            onPress={goToVisitNotes}
            disabled={!selectedSlot}
            style={{
              opacity: selectedSlot ? 1 : 0.55,
              backgroundColor: BRAND,
              borderRadius: 24,
              borderWidth: 2,
              borderColor: BRAND_LIGHT,
              height: 48,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingLeft: 4,
              paddingRight: 20,
              overflow: 'hidden',
            }}>
            {/* Circle arrow left */}
            <View style={{
              width: 40, height: 40, borderRadius: 999,
              backgroundColor: '#EFF4FF',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name="arrow-forward" size={22} color={BRAND} />
            </View>

            <Text style={{ fontSize: 16, fontWeight: '500', color: '#FFF' }}>
              Book Appointment
            </Text>

            {/* >>> right side */}
            <Text style={{ fontSize: 18, fontWeight: '400', color: 'rgba(255,255,255,0.55)', letterSpacing: 1 }}>
              {`>>>`}
            </Text>
          </Pressable>
        </View>
      </View>
    </HealthServiceScreenShell>
  );
}
