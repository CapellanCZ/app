import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_HEIGHT } from '@/components/layout/BottomTabBar';
import { useRouter } from 'expo-router';

import { useAuth } from '@/lib/auth/AuthProvider';
import { pickAndUploadAvatar } from '@/lib/profile/profileApi';
import { useProfileStore } from '@/lib/profile/profileStore';
import { IconsaxNotificationIcon } from '@/components/icons/IconsaxNotificationIcon';
import { IconsaxInfoCircleIcon } from '@/components/icons/IconsaxInfoCircleIcon';
import { UserEditIcon } from '@/components/icons/UserEditIcon';
import { ShieldSecurityIcon } from '@/components/icons/ShieldSecurityIcon';
import { MessageQuestionIcon } from '@/components/icons/MessageQuestionIcon';
import {
  LogoutModal,
  LogoutRow,
  ProfileMenuRow,
  ProfileSection,
  UserInfoCard,
} from '@/components/profile';

export default function ProfileTab() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, patient } = useAuth();
  const profile = useProfileStore((s) => s.profile);
  const fetchProfile = useProfileStore((s) => s.fetchProfile);
  const setAvatarUrl = useProfileStore((s) => s.setAvatarUrl);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;

    const userId = session.user.id;
    const cached = useProfileStore.getState().profile;
    if (cached?.id === userId && (cached.full_name || cached.first_name)) {
      return;
    }

    void fetchProfile(userId, {
      email: session.user.email ?? undefined,
      userMetadata: session.user.user_metadata,
    });
  }, [session?.user?.id, session?.user?.email, session?.user?.user_metadata, fetchProfile]);

  const handleChangeAvatar = useCallback(async () => {
    if (!session?.user?.id || avatarUploading) return;
    setAvatarUploading(true);
    const url = await pickAndUploadAvatar(session.user.id);
    if (url) setAvatarUrl(url);
    setAvatarUploading(false);
  }, [session?.user?.id, avatarUploading, setAvatarUrl]);

  const name =
    patient?.full_name?.trim() ||
    profile?.full_name?.trim() ||
    (profile ? `${profile.first_name} ${profile.last_name}`.trim() : '') ||
    'CampusCare user';
  const email = patient?.email ?? profile?.email ?? session?.user?.email ?? '—';
  const avatarUrl = profile?.avatar_url ?? null;

  return (
    <View style={{ flex: 1, backgroundColor: '#FDFDFD' }}>
      <ScrollView
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 20,
          paddingBottom: Math.max(insets.bottom, 16) + TAB_BAR_HEIGHT + 8,
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

        <UserInfoCard
          name={name}
          email={email}
          avatarUrl={avatarUrl}
          onAvatarPress={handleChangeAvatar}
        />

        <ProfileSection title="Account">
          <ProfileMenuRow
            icon={<UserEditIcon size={24} color="#000" />}
            label="Edit Profile"
            onPress={() => router.push('/personal-info')}
          />
          <ProfileMenuRow
            icon={<IconsaxNotificationIcon size={24} color="#000" />}
            label="Notifications"
            onPress={() => router.push('/notification-settings')}
          />
          <ProfileMenuRow
            icon={<ShieldSecurityIcon size={24} color="#000" />}
            label="Security & Privacy"
            onPress={() => router.push('/security')}
          />
        </ProfileSection>

        <ProfileSection title="Support & About">
          <ProfileMenuRow
            icon={<IconsaxInfoCircleIcon size={24} color="#000" />}
            label="Terms & Policies"
            onPress={() => router.push('/terms')}
          />
          <ProfileMenuRow
            icon={<MessageQuestionIcon size={24} color="#000" />}
            label="Help & Support"
            onPress={() => router.push('/help-center')}
          />
        </ProfileSection>

        <LogoutRow onPress={() => setShowLogoutModal(true)} />

        <LogoutModal
          visible={showLogoutModal}
          onConfirm={() => router.replace('/logout')}
          onCancel={() => setShowLogoutModal(false)}
        />
      </ScrollView>
    </View>
  );
}
