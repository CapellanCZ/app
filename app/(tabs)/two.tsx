import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useAuth } from '@/lib/auth/AuthProvider';
import { fetchStudentProfile, pickAndUploadAvatar, type StudentProfile } from '@/lib/profile/profileApi';
import { useScholarshipStore } from '@/lib/scholarships/scholarshipStore';
import { SCHEDULE_PARTNER } from '@/lib/health-service/bookingScheduleTheme';
import { IconsaxNotificationIcon } from '@/components/icons/IconsaxNotificationIcon';
import { IconsaxInfoCircleIcon } from '@/components/icons/IconsaxInfoCircleIcon';
import { IconsaxMedalIcon } from '@/components/icons/IconsaxMedalIcon';
import { IconsaxArrowRightIcon } from '@/components/icons/IconsaxArrowRightIcon';
import { UserEditIcon } from '@/components/icons/UserEditIcon';
import { ShieldSecurityIcon } from '@/components/icons/ShieldSecurityIcon';
import { MessageQuestionIcon } from '@/components/icons/MessageQuestionIcon';
import { LogoutIcon } from '@/components/icons/LogoutIcon';

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${'*'.repeat(Math.min(local.length - 2, 5))}@${domain}`;
}

// ── Scholarship status card ──────────────────────────────────────────────────

function ScholarshipStatusCard({ onPress }: { onPress: () => void }) {
  const { myEnrollment } = useScholarshipStore();

  if (!myEnrollment) return null;

  const programName = myEnrollment.program?.name ?? 'Scholarship';
  const totalItems = myEnrollment.complianceItems.length;
  const pendingActionable = myEnrollment.complianceItems.filter(
    (i) => i.status === 'pending' || i.status === 'overdue' || i.status === 'rejected',
  ).length;
  const verifiedItems = myEnrollment.complianceItems.filter(
    (i) => i.status === 'verified' || i.status === 'waived',
  ).length;

  return (
    <View style={{ marginTop: 24, marginBottom: 24 }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`View ${programName} status`}
        className="active:opacity-80">
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 16,
            gap: 18,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 2,
          }}>
          {/* Header with medal icon and See All button */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              {/* Medal icon */}
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  backgroundColor: 'rgba(255, 193, 7, 0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 2,
                }}>
                <IconsaxMedalIcon size={24} color="#FFC107" />
              </View>
              {/* Scholarship info */}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#181D27',
                    marginBottom: 2,
                  }}>
                  {programName}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontStyle: 'italic',
                    color: '#A4A7AE',
                  }}>
                  Expires on Dec 3 2027
                </Text>
              </View>
            </View>
            {/* See All button */}
            <Pressable
              onPress={onPress}
              style={{
                backgroundColor: '#2970FF',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: 12,
              }}>
              <Text style={{ fontSize: 12, fontWeight: '500', color: '#FFFFFF' }}>
                See All
              </Text>
            </Pressable>
          </View>

          {/* Divider */}
          <View
            style={{
              height: 1,
              backgroundColor: '#E5E7EB',
            }}
          />

          {/* Stats row */}
          <View style={{ flexDirection: 'row', gap: 32 }}>
            {/* Pending Requirements */}
            <View>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '600',
                  color: '#181D27',
                  marginBottom: 2,
                }}>
                {pendingActionable}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: '#717680',
                }}>
                Pending Requirements
              </Text>
            </View>

            {/* Progress Percentage */}
            <View>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '600',
                  color: '#181D27',
                  marginBottom: 2,
                }}>
                {totalItems > 0 ? `${Math.round((verifiedItems / totalItems) * 100)}%` : '0%'}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: '#717680',
                }}>
                Progress Percentage
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

export default function ProfileTab() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useAuth();
  const { myEnrollment, fetchMyEnrollment } = useScholarshipStore();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const scrimOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (!session?.user?.id) {
      console.log('[Profile] No session user ID');
      return;
    }
    console.log('[Profile] Fetching profile for user:', session.user.id);
    console.log('[Profile] User email:', session.user.email);
    console.log('[Profile] User metadata:', session.user.user_metadata);
    setLoading(true);
    Promise.all([
      fetchStudentProfile(session.user.id),
      fetchMyEnrollment(),
    ])
      .then(([profileData]) => {
        console.log('[Profile] Fetched profile:', profileData);
        // Fallback to auth metadata if no students table row exists
        if (!profileData && session.user.user_metadata) {
          const meta = session.user.user_metadata;
          const fallbackProfile: StudentProfile = {
            id: session.user.id,
            email: session.user.email ?? meta.email ?? '',
            first_name: meta.first_name ?? '',
            last_name: meta.last_name ?? '',
            program: meta.program ?? '',
            student_id: meta.student_id ?? '',
            avatar_url: meta.avatar_url ?? null,
          };
          console.log('[Profile] Using metadata fallback:', fallbackProfile);
          setProfile(fallbackProfile);
        } else {
          setProfile(profileData);
        }
      })
      .catch((err) => {
        console.error('[Profile] Error fetching profile:', err);
      })
      .finally(() => setLoading(false));
  }, [session?.user?.id, fetchMyEnrollment]);

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
  const email = profile?.email ?? '—';
  const avatarUrl = profile?.avatar_url ?? null;

  return (
    <View style={{ flex: 1, backgroundColor: '#FDFDFD' }}>
      <ScrollView
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 20,
          paddingBottom: Math.max(insets.bottom, 16) + 28,
        }}>

        {/* Page title */}
        <Text
          style={{
            fontSize: 32,
            fontWeight: '700',
            letterSpacing: -0.64,
            color: '#000',
            marginBottom: 24,
          }}>
          Profile
        </Text>

        {/* User info card */}
        <View
          style={{
            backgroundColor: '#FAFAFA',
            borderRadius: 16,
            paddingHorizontal: 8,
            paddingVertical: 12,
            marginBottom: 24,
            gap: 12,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable
              onPress={handleChangeAvatar}
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: '#E5E7EB',
                overflow: 'hidden',
              }}>
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              ) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 20, fontWeight: '600', color: '#9CA3AF' }}>
                    {name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </Pressable>
            <View style={{ flex: 1, gap: 4 }}>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 20,
                  fontWeight: '500',
                  color: '#000',
                  letterSpacing: -0.8,
                }}>
                {name}
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 12,
                  color: '#717680',
                  letterSpacing: -0.2,
                }}>
                {email}
              </Text>
            </View>
          </View>

          {/* Apply for Scholarship button */}
          <Pressable
            onPress={() => router.push('/student-development-affairs/apply')}
            style={{
              backgroundColor: '#2970FF',
              borderRadius: 24,
              paddingVertical: 12,
              paddingHorizontal: 16,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: '#b2ccff',
            }}
            className="active:opacity-80">
            <Text
              style={{
                fontSize: 16,
                fontWeight: '500',
                color: '#FFFFFF', 
                letterSpacing: -0.40,
              }}>
              Apply for Scholarship
            </Text>
          </Pressable>
        </View>

        {/* Scholarship section   {myEnrollment && <ScholarshipStatusCard onPress={() => router.push('/my-scholarship')} />}*/}
       

        {/* Account */}
        <Text
          style={{
            fontSize: 14,
            fontWeight: '400',
            color: '#717680',
            marginBottom: 12,
          }}>
          Account
        </Text>
        <View style={{ marginBottom: 24, gap: 16 }}>
          <Pressable
            onPress={() => router.push('/personal-info')}
            style={{
              backgroundColor: '#FAFAFA',
              borderRadius: 16,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}>
            <View style={{ width: 24, height: 24 }}>
              <UserEditIcon size={24} color="#000" />
            </View>
            <Text style={{ flex: 1, fontSize: 16, fontWeight: '400', color: '#000' }}>
              Edit Profile
            </Text>
            <IconsaxArrowRightIcon size={20} color="#A4A7AE" />
          </Pressable>

          <Pressable
            onPress={() => router.push('/notification-settings')}
            style={{
              backgroundColor: '#FAFAFA',
              borderRadius: 16,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}>
            <View style={{ width: 24, height: 24 }}>
              <IconsaxNotificationIcon size={24} color="#000" />
            </View>
            <Text style={{ flex: 1, fontSize: 16, fontWeight: '400', color: '#000' }}>
              Notifications
            </Text>
            <IconsaxArrowRightIcon size={20} color="#A4A7AE" />
          </Pressable>

          <Pressable
            onPress={() => router.push('/security')}
            style={{
              backgroundColor: '#FAFAFA',
              borderRadius: 16,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}>
            <View style={{ width: 24, height: 24 }}>
              <ShieldSecurityIcon size={24} color="#000" />
            </View>
            <Text style={{ flex: 1, fontSize: 16, fontWeight: '400', color: '#000' }}>
              Security & Privacy
            </Text>
            <IconsaxArrowRightIcon size={20} color="#A4A7AE" />
          </Pressable>
        </View>

        {/* Support & About */}
        <Text
          style={{
            fontSize: 14,
            fontWeight: '400',
            color: '#717680',
            marginBottom: 12,
          }}>
          Support & About
        </Text>
        <View style={{ marginBottom: 24, gap: 16 }}>
          <Pressable
            onPress={() => router.push('/terms')}
            style={{
              backgroundColor: '#FAFAFA',
              borderRadius: 16,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}>
            <View style={{ width: 24, height: 24 }}>
              <IconsaxInfoCircleIcon size={24} color="#000" />
            </View>
            <Text style={{ flex: 1, fontSize: 16, fontWeight: '400', color: '#000' }}>
              Terms & Policies
            </Text>
            <IconsaxArrowRightIcon size={20} color="#A4A7AE" />
          </Pressable>

          <Pressable
            onPress={() => router.push('/help-center')}
            style={{
              backgroundColor: '#FAFAFA',
              borderRadius: 16,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}>
            <View style={{ width: 24, height: 24 }}>
              <MessageQuestionIcon size={24} color="#000" />
            </View>
            <Text style={{ flex: 1, fontSize: 16, fontWeight: '400', color: '#000' }}>
              Help & Support
            </Text>
            <IconsaxArrowRightIcon size={20} color="#A4A7AE" />
          </Pressable>
        </View>

        {/* Logout */}
        <Pressable
          onPress={() => setShowLogoutModal(true)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingVertical: 16,
            backgroundColor: '#FAFAFA',
          }}>
          <LogoutIcon size={24} color="#D92D20" />
          <Text style={{ fontSize: 16, fontWeight: '400', color: '#D92D20' }}>
            Logout
          </Text>
        </Pressable>

        {/* Logout confirmation modal */}
        <Modal
          visible={showLogoutModal}
          transparent
          animationType="none"
          onRequestClose={() => closeModal()}>

          {/* Scrim */}
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

            {/* Sheet */}
            <Animated.View
              style={{
                transform: [{ translateY: sheetTranslateY }],
                backgroundColor: SCHEDULE_PARTNER.surface,
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
                    <IconsaxArrowRightIcon size={28} color="#EF4444" />
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
                Logout
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
                  Yes, Logout
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
    </View>
  );
}
