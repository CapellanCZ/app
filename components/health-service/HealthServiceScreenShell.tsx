import type { ReactNode } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import {
  HOME_BG_GRADIENT_COLORS,
  HOME_BG_GRADIENT_LOCATIONS,
} from '../../lib/ui/screenGradients';

type HealthServiceScreenShellProps = {
  children: ReactNode;
};

/**
 * Same powder gradient shell as home so Health Service feels native to CampusCare.
 */
export function HealthServiceScreenShell({ children }: HealthServiceScreenShellProps) {
  return (
    <LinearGradient
      colors={[...HOME_BG_GRADIENT_COLORS]}
      locations={[...HOME_BG_GRADIENT_LOCATIONS]}
      start={{ x: 0.5, y: 1 }}
      end={{ x: 0.5, y: 0 }}
      style={{ flex: 1 }}>
      <View className="flex-1 bg-transparent">{children}</View>
    </LinearGradient>
  );
}
