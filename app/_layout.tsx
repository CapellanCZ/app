import '../global.css';
import { useFonts } from 'expo-font';
import { HeroUINativeProvider } from 'heroui-native';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TamaguiProvider } from 'tamagui';

import { UniwindInsetSync } from '@/components/UniwindInsetSync';
import { tamaguiConfig } from '../tamagui.config';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(drawer)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  const themeName = colorScheme === 'dark' ? 'dark' : 'light';
  const rootBackgroundColor = colorScheme === 'dark' ? '#000000' : '#FFFFFF';

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: rootBackgroundColor }}>
      <HeroUINativeProvider>
        <TamaguiProvider config={tamaguiConfig} defaultTheme={themeName}>
          <SafeAreaProvider>
            <UniwindInsetSync />
            <Stack screenOptions={{ contentStyle: { flex: 1 } }}>
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ title: 'Modal', presentation: 'modal' }} />
            </Stack>
          </SafeAreaProvider>
        </TamaguiProvider>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
