import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
 
type Tone = 'error' | 'warning';
 
type AuthErrorBannerProps = {
  message: string;
  tone?: Tone;
};
 
const THEME: Record<Tone, { border: string; bg: string; text: string; icon: string; iconName: React.ComponentProps<typeof Ionicons>['name'] }> = {
  error: { border: 'border-[#FECACA]', bg: 'bg-[#FFF1F0]', text: 'text-[#991B1B]', icon: '#DC2626', iconName: 'alert-circle' },
  warning: { border: 'border-[#FED7AA]', bg: 'bg-[#FFFBEB]', text: 'text-[#92400E]', icon: '#D97706', iconName: 'warning' },
};
 
export function AuthErrorBanner({ message, tone = 'warning' }: AuthErrorBannerProps) {
  const t = THEME[tone];
 
  return (
    <View className={`flex-row items-start gap-3 rounded-xl border px-3.5 py-3 ${t.border} ${t.bg}`}>
      <View className="mt-0.5">
        <Ionicons name={t.iconName} size={20} color={t.icon} />
      </View>
      <Text className={`flex-1 text-sm leading-5 ${t.text}`}>{message}</Text>
    </View>
  );
}