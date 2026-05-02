import { Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SCHEDULE_PARTNER } from '@/lib/health-service/bookingScheduleTheme';
import profileCirclePlaceholder from '@/assets/profile-circle.png';

const BRAND = SCHEDULE_PARTNER.brand;
const ICON_BG = SCHEDULE_PARTNER.segmentTrackBg;
const ICON_COLOR = SCHEDULE_PARTNER.textPrimary;

type UserInfoCardProps = {
  name: string;
  email: string;
  avatarUrl: string | null;
  isAvatarUploading?: boolean;
  onAvatarPress: () => void;
  onEditPress: () => void;
};

/**
 * User info card showing avatar, name, email, and quick actions.
 * Displays upload indicator during avatar upload.
 */
export function UserInfoCard({
  name,
  email,
  avatarUrl,
  isAvatarUploading = false,
  onAvatarPress,
  onEditPress,
}: UserInfoCardProps) {
  return (
    <View
      style={{
        marginTop: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: SCHEDULE_PARTNER.cardBorder,
        backgroundColor: SCHEDULE_PARTNER.surface,
        paddingVertical: 14,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}>
      {/* Avatar */}
      <Pressable
        onPress={onAvatarPress}
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
        {isAvatarUploading && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 24,
              backgroundColor: 'rgba(0,0,0,0.35)',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
          </View>
        )}
      </Pressable>

      {/* Name & Email */}
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

      {/* Edit button */}
      <Pressable
        onPress={onEditPress}
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
  );
}
