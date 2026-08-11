import '../global.css';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { HeroUINativeProvider } from 'heroui-native';
import { Stack } from 'expo-router';
import { useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TamaguiProvider } from 'tamagui';

import { UniwindInsetSync } from '@/components/UniwindInsetSync';
import { AuthProvider } from '@/lib/auth/AuthProvider';
import { AppointmentSubscription } from '@/components/health-service/AppointmentSubscription';
import { NotificationHandler } from '@/components/notifications/NotificationHandler';
import { NotificationSubscription } from '@/components/notifications/NotificationSubscription';
import { AppToastBinder } from '@/components/ui/AppToastBinder';
import { FeedbackSoundHost } from '@/components/ui/FeedbackSoundHost';
import { tamaguiConfig } from '../tamagui.config';

void SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'index',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    InstrumentSans: require('../assets/fonts/InstrumentSans-Variable.ttf'),
    'Inter-Regular': require('@tamagui/font-inter/otf/Inter-Regular.otf'),
    'Inter-Medium': require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    'Inter-SemiBold': require('@tamagui/font-inter/otf/Inter-SemiBold.otf'),
    'Inter-Bold': require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  const themeName = colorScheme === 'dark' ? 'dark' : 'light';
  const rootBackgroundColor = '#FFFFFF';

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: rootBackgroundColor }}>
      <HeroUINativeProvider>
        <TamaguiProvider config={tamaguiConfig} defaultTheme={themeName}>
          <SafeAreaProvider>
            <KeyboardProvider>
              <AuthProvider>
              <AppToastBinder />
              <FeedbackSoundHost />
              <AppointmentSubscription />
              <NotificationHandler />
              <NotificationSubscription />
              <UniwindInsetSync />
              <View style={{ flex: 1, backgroundColor: rootBackgroundColor }}>
              <Stack
                screenOptions={{
                  contentStyle: { flex: 1, backgroundColor: rootBackgroundColor },
                  headerShown: false,
                  /** Avoid iOS back labels derived from route segment names like `(tabs)`. */
                  headerBackTitleVisible: false,
                }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" options={{ animation: 'fade', animationDuration: 120 }} />
                <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="health-service" options={{ animation: 'fade', animationDuration: 120 }} />
                <Stack.Screen name="appointments" />
                <Stack.Screen
                  name="visit-completed"
                  options={{
                    presentation: 'transparentModal',
                    animation: 'none',
                    headerShown: false,
                    contentStyle: { backgroundColor: 'transparent' },
                  }}
                />
                <Stack.Screen name="logout" />
                <Stack.Screen name="(settings)" />
                <Stack.Screen
                  name="modal"
                  options={{ headerShown: true, title: 'Modal', presentation: 'modal' }}
                />
              </Stack>
              </View>
              </AuthProvider>
            </KeyboardProvider>
          </SafeAreaProvider>
        </TamaguiProvider>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
