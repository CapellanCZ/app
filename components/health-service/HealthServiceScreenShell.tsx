import type { ReactNode } from 'react';
import { View } from 'react-native';

type HealthServiceScreenShellProps = {
  children: ReactNode;
};

/**
 * Same background as home so Health Service feels native to CampusCare.
 */
export function HealthServiceScreenShell({ children }: HealthServiceScreenShellProps) {
  return (
    <View style={{ flex: 1, backgroundColor: '#FDFDFD' }}>
      <View className="flex-1 bg-transparent">{children}</View>
    </View>
  );
}
