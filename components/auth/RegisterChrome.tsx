import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppLogoIcon } from '@/components/icons/AppLogoIcon';

import { AuthBackRow } from './AuthBackRow';
import { AuthLegalFooter } from './AuthLegalFooter';

type RegisterChromeProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  /** Renders below the scroll area, pinned to the bottom (e.g. primary CTA + legal). */
  footer?: React.ReactNode;
};

/** Register / sign-up shell (Figma 703:33165): white screen, blue logo badge, centered heading. */
export function RegisterChrome({ title, subtitle, children, footer }: RegisterChromeProps) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>
      <View style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <AuthBackRow />

          <View className="gap-10 px-5 pt-2">
            <View className="items-center gap-5">
              <AppLogoIcon width={51} height={48} />
              <View className="items-center gap-2 px-1">
                <Text className="text-center text-2xl font-semibold leading-7 text-[#181D27]">{title}</Text>
                <Text className="text-center text-sm leading-5 text-[#535862]">{subtitle}</Text>
              </View>
            </View>

            {children}

            {footer ? null : <AuthLegalFooter />}
          </View>
        </ScrollView>

        {footer ? (
          <View style={{ paddingBottom: Math.max(insets.bottom, 12) }}>{footer}</View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
