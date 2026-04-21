import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/lib/auth/AuthProvider';
import { fetchStudentProfile, pickAndUploadAvatar, type StudentProfile } from '@/lib/profile/profileApi';
import { SCHEDULE_PARTNER } from '@/lib/health-service/bookingScheduleTheme';
import {
  HOME_BG_GRADIENT_COLORS,
  HOME_BG_GRADIENT_LOCATIONS,
  HOME_SCROLL_PADDING_H,
} from '@/lib/ui/screenGradients';
import profileCirclePlaceholder from '@/assets/profile-circle.png';

const BRAND = SCHEDULE_PARTNER.brand;
const ICON_BG = SCHEDULE_PARTNER.segmentTrackBg;
const ICON_COLOR = SCHEDULE_PARTNER.textPrimary;
const DIVIDER = SCHEDULE_PARTNER.divider;
const SURFACE = SCHEDULE_PARTNER.surface;

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type RowProps = {
  icon: IoniconName;
  label: string;
  onPress?: () => void;
  value?: string;
  isFirst?: boolean;
  isLast?: boolean;
  variant?: 'default' | 'danger';
};

function Row({ icon, label, onPress, value, isFirst, isLast, variant = 'default' }: RowProps) {
  const isDanger = variant === 'danger';
  const isDisplay = !onPress;

  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 13,
        paddingHorizontal: 14,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: DIVIDER,
        backgroundColor: SURFACE,
        gap: 12,
        borderTopLeftRadius: isFirst ? 16 : 0,
        borderTopRightRadius: isFirst ? 16 : 0,
        borderBottomLeftRadius: isLast ? 16 : 0,
        borderBottomRightRadius: isLast ? 16 : 0,
      }}>
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          backgroundColor: isDanger ? 'rgba(239,68,68,0.1)' : ICON_BG,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Ionicons name={icon} size={20} color={isDanger ? '#EF4444' : ICON_COLOR} />
      </View>
      <Text
        style={{
          flex: 1,
          fontSize: 16,
          color: isDanger ? '#EF4444' : SCHEDULE_PARTNER.textPrimary,
        }}>
        {label}
      </Text>
      {value ? (
        <Text style={{ fontSize: 14, color: SCHEDULE_PARTNER.textMuted }}>{value}</Text>
      ) : !isDisplay ? (
        <Ionicons name="chevron-forward" size={18} color={isDanger ? '#EF4444' : SCHEDULE_PARTNER.textDisabled} />
      ) : null}
    </View>
  );

  if (isDisplay) return content;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="active:opacity-60">
      {content}
    </Pressable>
  );
}

function SectionLabel({ title }: { title: string }) {
  return (
    <Text
      style={{
        marginTop: 24,
        marginBottom: 8,
        marginLeft: 4,
        fontSize: 15,
        fontWeight: '500',
        color: SCHEDULE_PARTNER.textMuted,
      }}>
      {title}
    </Text>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: SCHEDULE_PARTNER.cardBorder,
        overflow: 'hidden',
        backgroundColor: SURFACE,
      }}>
      {children}
    </View>
  );
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${'*'.repeat(Math.min(local.length - 2, 5))}@${domain}`;
}

export default function ProfileTab() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const scrimOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (!session?.user?.id) return;
    fetchStudentProfile(session.user.id).then(setProfile);
  }, [session?.user?.id]);

  const handleChangeAvatar = useCallback(async () => {
    if (!session?.user?.id || avatarUploading) return;
    setAvatarUploading(true);
    const url = await pickAndUploadAvatar(session.user.id);
    if (url) setProfile((p) => p ? { ...p, avatar_url: url } : p);
    setAvatarUploading(false);
  }, [session?.user?.id, avatarUploading]);

  useEffect(() => {
    if (showLogoutModal) {
      Animated.parallel([
        Animated.timing(scrimOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(sheetTranslateY, { toValue: 0, damping: 22, stiffness: 280, useNativeDriver: true }),
      ]).start();
    }
  }, [showLogoutModal]);

  const closeModal = (cb?: () => void) => {
    Animated.parallel([
      Animated.timing(scrimOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(sheetTranslateY, { toValue: 400, duration: 220, useNativeDriver: true }),
    ]).start(() => {
      setShowLogoutModal(false);
      sheetTranslateY.setValue(400);
      scrimOpacity.setValue(0);
      cb?.();
    });
  };

  const name = profile
    ? `${profile.first_name} ${profile.last_name}`.trim() || 'Nationalian'
    : 'Nationalian';
  const email = profile?.email ? maskEmail(profile.email) : '—';
  const avatarUrl = profile?.avatar_url ?? null;

  return (
    <LinearGradient
      colors={[...HOME_BG_GRADIENT_COLORS]}
      locations={[...HOME_BG_GRADIENT_LOCATIONS]}
      start={{ x: 0.5, y: 1 }}
      end={{ x: 0.5, y: 0 }}
      style={{ flex: 1 }}>
      <ScrollView
        className="flex-1 bg-transparent"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 10,
          paddingHorizontal: HOME_SCROLL_PADDING_H,
          paddingBottom: Math.max(insets.bottom, 16) + 28,
        }}>

        {/* Page title */}
        <Text
          style={{
            fontSize: 32,
            fontWeight: '700',
            letterSpacing: -0.35,
            color: SCHEDULE_PARTNER.textPrimary,
          }}>
          Profile
        </Text>

        {/* Identity row */}
        <View
          style={{
            marginTop: 20,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: SCHEDULE_PARTNER.cardBorder,
            backgroundColor: SURFACE,
            paddingVertical: 14,
            paddingHorizontal: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}>
          <Pressable
            onPress={handleChangeAvatar}
            accessibilityLabel="Change profile picture"
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              borderWidth: 2,
              borderColor: BRAND,
              flexShrink: 0,
            }}>
            <View style={{ flex: 1, borderRadius: 24, overflow: 'hidden' }}>
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              ) : (
                <Image
                  source={profileCirclePlaceholder}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              )}
            </View>
            {avatarUploading && (
              <View style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.35)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
              </View>
            )}
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: SCHEDULE_PARTNER.textPrimary,
                letterSpacing: -0.1,
              }}
              numberOfLines={1}>
              {name}
            </Text>
            <Text
              style={{ fontSize: 13, color: SCHEDULE_PARTNER.textMuted, marginTop: 1 }}
              numberOfLines={1}>
              {email}
            </Text>
          </View>

          <Pressable
            onPress={() => router.push('/personal-info')}
            accessibilityRole="button"
            accessibilityLabel="View personal information"
            hitSlop={8}
            className="active:opacity-60"
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              backgroundColor: ICON_BG,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons name="person-outline" size={18} color={ICON_COLOR} />
          </Pressable>
        </View>

        {/* Combined card — all menu items */}
        <SectionLabel title="Account & Settings" />
        <Card>
          <Row
            icon="notifications-outline"
            label="Notification Settings"
            isFirst
            onPress={() => router.push('/notification-settings')}
          />
          <Row
            icon="help-circle-outline"
            label="Help Center"
            onPress={() => router.push('/help-center')}
          />
          <Row
            icon="document-text-outline"
            label="Terms & Conditions"
            onPress={() => router.push('/terms')}
          />
          <Row
            icon="shield-checkmark-outline"
            label="Privacy Policy"
            onPress={() => router.push('/privacy')}
          />
          <Row
            icon="information-circle-outline"
            label="About CampusCare"
            onPress={() => router.push('/about')}
            isLast
          />
        </Card>

        <View style={{ marginTop: 24 }} />
        <Card>
          <Row
            icon="log-out-outline"
            label="Log Out"
            onPress={() => setShowLogoutModal(true)}
            isFirst
            isLast
            variant="danger"
          />
        </Card>

        {/* Logout confirmation modal */}
        <Modal
          visible={showLogoutModal}
          transparent
          animationType="none"
          onRequestClose={() => closeModal()}>

          {/* Scrim — fades independently, does NOT slide */}
          <Animated.View
            style={{
              flex: 1,
              justifyContent: 'flex-end',
              backgroundColor: 'rgba(0,0,0,0.5)',
              opacity: scrimOpacity,
            }}>
            <Pressable
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              onPress={() => closeModal()}
            />

            {/* Sheet — slides up independently */}
            <Animated.View
              style={{
                transform: [{ translateY: sheetTranslateY }],
                backgroundColor: SURFACE,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                paddingTop: 10,
                paddingHorizontal: 20,
                paddingBottom: Math.max(insets.bottom, 24) + 8,
              }}>

              {/* Drag handle */}
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: SCHEDULE_PARTNER.borderCell,
                  alignSelf: 'center',
                  marginBottom: 28,
                }}
              />

              {/* Icon — double ring */}
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: 'rgba(239,68,68,0.06)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <View
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      backgroundColor: 'rgba(239,68,68,0.12)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Ionicons name="log-out-outline" size={28} color="#EF4444" />
                  </View>
                </View>
              </View>

              {/* Text */}
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: SCHEDULE_PARTNER.textPrimary,
                  textAlign: 'center',
                  letterSpacing: -0.3,
                  marginBottom: 8,
                }}>
                Log Out
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: SCHEDULE_PARTNER.textMuted,
                  textAlign: 'center',
                  lineHeight: 21,
                  paddingHorizontal: 16,
                  marginBottom: 32,
                }}>
                You'll need to use your magic link to sign back in. Are you sure you want to log out?
              </Text>

              {/* Primary */}
              <Pressable
                onPress={() => closeModal(() => router.replace('/logout'))}
                accessibilityRole="button"
                accessibilityLabel="Confirm log out"
                className="active:opacity-80"
                style={{
                  backgroundColor: '#EF4444',
                  borderRadius: 14,
                  paddingVertical: 15,
                  alignItems: 'center',
                  marginBottom: 10,
                }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.1 }}>
                  Yes, Log Out
                </Text>
              </Pressable>

              {/* Secondary */}
              <Pressable
                onPress={() => closeModal()}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                className="active:opacity-60"
                style={{
                  borderRadius: 14,
                  paddingVertical: 15,
                  alignItems: 'center',
                  backgroundColor: SCHEDULE_PARTNER.segmentTrackBg,
                }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: SCHEDULE_PARTNER.textPrimary }}>
                  Cancel
                </Text>
              </Pressable>
            </Animated.View>
          </Animated.View>
        </Modal>

      </ScrollView>
    </LinearGradient>
  );
}
