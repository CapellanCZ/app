import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import Animated from 'react-native-reanimated';

import { fadeSlideUpEntering } from '@/lib/animations/fadeSlideUp';

import { HealthServiceScreenShell } from '../../components/health-service/HealthServiceScreenShell';
import { ProviderCard } from '../../components/health-service/ProviderCard';
import { IconsaxArrowLeftIcon } from '@/components/icons/IconsaxArrowLeftIcon';
import { IconsaxSearchIcon } from '../../components/icons/IconsaxSearchIcon';
import { useHealthServiceStore } from '../../lib/health-service/healthServiceStore';
import type { StaffRole } from '../../lib/health-service/types';

const BRAND = '#2970FF';

const ROLE_CHIPS: { label: string; value: StaffRole | 'all' }[] = [
  { label: 'Physician', value: 'doctor' },
  { label: 'Dentist', value: 'dentist' },
  { label: 'Cardiology', value: 'all' },
  { label: 'Psychiatrist', value: 'all' },
];

export default function AllDoctorsScreen() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<StaffRole | 'all'>('all');

  const { staff, loadStaff } = useHealthServiceStore();

  useFocusEffect(
    useCallback(() => {
      if (!staff.length) loadStaff();
    }, [loadStaff, staff.length]),
  );

  const filteredStaff = useMemo(() => {
    const q = search.trim().toLowerCase();
    return staff.filter((s) => {
      if (roleFilter !== 'all' && s.role !== roleFilter) return false;
      if (q && !s.name.toLowerCase().includes(q) && !s.specialtyLabel.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [staff, roleFilter, search]);

  const cardWidth = (windowWidth - 20 * 2 - 29) / 2;

  return (
    <HealthServiceScreenShell>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ══ Header ══ */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            paddingHorizontal: 20,
            paddingTop: insets.top + 16,
          }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              backgroundColor: '#F5F5F5',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            className="active:opacity-70">
            <IconsaxArrowLeftIcon size={20} color="#252B37" />
          </Pressable>

          <View style={{ flex: 1, gap: 4 }}>
            <Text
              style={{
                fontSize: 24,
                fontWeight: '600',
                color: '#000000',
                letterSpacing: -0.48,
              }}>
              Our Doctors
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '300',
                color: '#535862',
                letterSpacing: -0.28,
              }}>
              Choose a doctor that you want to be accomadated
            </Text>
          </View>
        </View>

        {/* ══ Content ══ */}
        <View style={{ paddingHorizontal: 20, marginTop: 24, gap: 24 }}>

          {/* Search bar */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              height: 45,
              backgroundColor: '#FFFFFF',
              borderRadius: 9999,
              paddingHorizontal: 16,
              gap: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 4,
              elevation: 3,
            }}>
            <IconsaxSearchIcon size={16} color="#717680" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Find the right doctor for you..."
              placeholderTextColor="#71717A"
              returnKeyType="search"
              style={{
                flex: 1,
                fontSize: 16,
                fontWeight: '300',
                color: '#252B37',
                padding: 0,
              }}
            />
          </View>

          {/* Chips + grid */}
          <View style={{ gap: 20 }}>

            {/* Role filter chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}>
              {ROLE_CHIPS.map((chip) => {
                const isActive = roleFilter === chip.value && chip.value !== 'all';
                return (
                  <Pressable
                    key={chip.label}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    onPress={() => setRoleFilter(isActive ? 'all' : chip.value)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 99999,
                      backgroundColor: isActive ? '#EFF4FF' : '#F5F5F5',
                    }}
                    className="active:opacity-75">
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '500',
                        lineHeight: 16,
                        color: isActive ? BRAND : '#717680',
                        letterSpacing: -0.24,
                      }}>
                      {chip.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* 2-column doctor grid */}
            {filteredStaff.length === 0 ? (
              <Text
                style={{
                  width: '100%',
                  paddingVertical: 32,
                  textAlign: 'center',
                  fontSize: 14,
                  color: '#9095A1',
                }}>
                No providers match your search.
              </Text>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 29 }}>
                {filteredStaff.map((s, index) => (
                  <Animated.View
                    key={s.id}
                    entering={fadeSlideUpEntering(index)}
                    style={{ width: cardWidth }}>
                    <ProviderCard
                      staff={s}
                      availableToday={true}
                      onPress={() => router.push(`/health-service/book/${s.id}`)}
                    />
                  </Animated.View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </HealthServiceScreenShell>
  );
}
