import type { ReactNode } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  width: number;
  height: number;
  children: ReactNode;
  /** Soft white fade under the phone (matches onboarding mockups). */
  fadeBottom?: boolean;
};

/**
 * HD iPhone-style bezel for onboarding product previews.
 */
export function PhoneMockFrame({ width, height, children, fadeBottom = true }: Props) {
  const radius = Math.round(width * 0.11);
  const bezel = Math.max(7, Math.round(width * 0.022));
  const islandW = Math.round(width * 0.26);
  const islandH = Math.max(16, Math.round(width * 0.048));
  /** Device body extends past the fade so the mock reads larger (design). */
  const bodyH = fadeBottom ? height * 0.98 : height;

  return (
    <View style={{ width, height, alignItems: 'center' }}>
      <View
        style={{
          width,
          height: bodyH,
          borderRadius: radius,
          backgroundColor: '#0B0B0C',
          padding: bezel,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: '#2A2A2E',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 18 },
          shadowOpacity: 0.2,
          shadowRadius: 30,
          elevation: 14,
        }}>
        <View
          style={{
            flex: 1,
            borderRadius: Math.max(10, radius - bezel),
            overflow: 'hidden',
            backgroundColor: '#F8F9FB',
          }}>
          {/* Dynamic Island */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: Math.round(width * 0.022),
              alignSelf: 'center',
              left: (width - bezel * 2 - islandW) / 2,
              width: islandW,
              height: islandH,
              borderRadius: islandH / 2,
              backgroundColor: '#0B0B0C',
              zIndex: 20,
            }}
          />
          {children}
        </View>
      </View>

      {fadeBottom ? (
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.55)', '#FFFFFF']}
          locations={[0, 0.4, 1]}
          style={{
            position: 'absolute',
            left: -12,
            right: -12,
            bottom: 0,
            height: height * 0.28,
          }}
        />
      ) : null}
    </View>
  );
}
