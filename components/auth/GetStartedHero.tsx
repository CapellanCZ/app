import { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Image,
  Text,
  View,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Extrapolation,
  FadeIn,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import { GetStartedGlassButton } from '@/components/auth/GetStartedGlassButton';
import { GetStartedPagerDots } from '@/components/auth/GetStartedPagerDots';
import { OnboardingBookPreview } from '@/components/auth/OnboardingBookPreview';
import { OnboardingHomePreview } from '@/components/auth/OnboardingHomePreview';
import {
  GET_STARTED_SLIDES,
  type GetStartedSlide,
} from '@/components/auth/getStartedSlides';
import { PlainLogoIcon } from '@/components/icons/PlainLogoIcon';
import { Inter } from '@/lib/typography/inter';
import { BRAND } from '@/lib/ui/theme';

const BG = '#FFFFFF';
const AUTO_SLIDE_MS = 4500;

function headlineMetrics(screenW: number) {
  const raw = Math.round(screenW * (26 / 390));
  const fontSize = Math.min(28, Math.max(22, raw));
  return {
    fontSize,
    lineHeight: Math.round(fontSize * 1.25),
    letterSpacing: -0.7,
  };
}

function subtitleMetrics(screenW: number) {
  const raw = Math.round(screenW * (14 / 390));
  const fontSize = Math.min(15, Math.max(13, raw));
  return {
    fontSize,
    lineHeight: Math.round(fontSize * 1.42),
    letterSpacing: -0.15,
  };
}

function legalMetrics(screenW: number) {
  const raw = Math.round(screenW * (12 / 390));
  const fontSize = Math.min(13, Math.max(11, raw));
  return { fontSize, lineHeight: Math.round(fontSize * 1.35) };
}

function SlideHeroImage({
  slide,
  index,
  pageWidth,
  areaHeight,
  scrollX,
}: {
  slide: GetStartedSlide;
  index: number;
  pageWidth: number;
  areaHeight: number;
  scrollX: SharedValue<number>;
}) {
  const layout = slide.layout;
  const align = layout?.align ?? 'bottom';
  const aspect = layout?.aspect ?? 0.8;
  const widthRatio = layout?.widthRatio ?? 0.9;
  const isPhonePreview = slide.preview === 'home' || slide.preview === 'book';

  /**
   * Phone mockups: fill band width + height (design shows a large cropped device).
   * Photos: keep aspect-fit so they don't crop oddly.
   */
  let width: number;
  let height: number;
  if (isPhonePreview) {
    width = pageWidth * Math.min(0.96, widthRatio);
    height = areaHeight * 1.08;
  } else {
    const maxW = pageWidth * widthRatio;
    const maxH = areaHeight * (align === 'center' ? 0.92 : 1);
    const heightFromWidth = maxW / aspect;
    width = heightFromWidth <= maxH ? maxW : Math.min(maxW, maxH * aspect);
    height = width / aspect;
  }

  const style = useAnimatedStyle(() => {
    if (pageWidth <= 0) return { opacity: index === 0 ? 1 : 0.6 };
    const input = [(index - 1) * pageWidth, index * pageWidth, (index + 1) * pageWidth];
    return {
      opacity: interpolate(scrollX.get(), input, [0.4, 1, 0.4], Extrapolation.CLAMP),
      transform: [
        {
          scale: interpolate(scrollX.get(), input, [0.94, 1, 0.94], Extrapolation.CLAMP),
        },
      ],
    };
  });

  const hero =
    slide.preview === 'home' ? (
      <OnboardingHomePreview width={width} height={height} />
    ) : slide.preview === 'book' ? (
      <OnboardingBookPreview width={width} height={height} />
    ) : slide.image ? (
      <Image
        source={slide.image}
        style={{ width, height }}
        resizeMode="contain"
        accessibilityLabel={slide.imageLabel}
      />
    ) : null;

  return (
    <View
      style={{
        width: pageWidth,
        height: areaHeight,
        alignItems: 'center',
        /** Phones hang from under the logo and fade into copy (matches design). */
        justifyContent: isPhonePreview
          ? 'flex-start'
          : align === 'center'
            ? 'center'
            : 'flex-end',
        overflow: 'hidden',
      }}
      accessibilityLabel={slide.imageLabel}>
      <Animated.View style={style}>{hero}</Animated.View>
      {align === 'bottom' && !isPhonePreview ? (
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.85)', '#FFFFFF']}
          locations={[0, 0.55, 1]}
          style={styles.imageFade}
        />
      ) : null}
    </View>
  );
}

export type GetStartedHeroProps = {
  onSignIn: () => void;
  onTerms?: () => void;
  onPrivacy?: () => void;
};

/**
 * Get-started carousel — one shared logo + bottom chrome so every slide aligns.
 */
export function GetStartedHero({ onSignIn, onTerms, onPrivacy }: GetStartedHeroProps) {
  const insets = useSafeAreaInsets();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const activeIndexRef = useRef(0);
  const scrollRef = useRef<Animated.ScrollView>(null);
  const scrollX = useSharedValue(0);

  const slide = GET_STARTED_SLIDES[activeIndex] ?? GET_STARTED_SLIDES[0];
  const headline = headlineMetrics(screenW);
  const subtitle = subtitleMetrics(screenW);
  const legal = legalMetrics(screenW);
  /** Measured image band — flex takes leftover after logo + footer. */
  const [imageAreaH, setImageAreaH] = useState(() => Math.max(260, Math.round(screenH * 0.48)));

  /** Fixed slots so every slide’s copy / CTA / legal share the same Y. */
  const headlineSlotH = headline.lineHeight * 2;
  const subtitleSlotH = subtitle.lineHeight * 3;
  const legalSlotH = legal.lineHeight * 2;
  const bottomPad = Math.max(insets.bottom, 12) + 8;
  const logoBlockH = insets.top + 44;

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    if (paused || screenW <= 0 || GET_STARTED_SLIDES.length <= 1) return;
    const timer = setInterval(() => {
      const next = (activeIndexRef.current + 1) % GET_STARTED_SLIDES.length;
      scrollRef.current?.scrollTo({ x: next * screenW, y: 0, animated: true });
      setActiveIndex(next);
    }, AUTO_SLIDE_MS);
    return () => clearInterval(timer);
  }, [paused, screenW]);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.set(e.contentOffset.x);
    },
  });

  const syncIndex = (x: number) => {
    const next = Math.round(x / screenW);
    const clamped = Math.max(0, Math.min(GET_STARTED_SLIDES.length - 1, next));
    setActiveIndex((prev) => (prev === clamped ? prev : clamped));
  };

  const accessibilityHeadline = slide.headline.map((p) => p.text).join('');

  return (
    <View style={styles.root}>
      {/* Shared logo — same Y on every slide */}
      <View style={[styles.logoRow, { paddingTop: insets.top + 8, height: logoBlockH }]}>
        <View style={styles.logoLockup}>
          <PlainLogoIcon width={30} height={23} color={BRAND.primary} />
          <Text style={styles.logoText} allowFontScaling={false}>
            Campus Care
          </Text>
        </View>
      </View>

      {/* Image band flexes — never steals space from the legal footer */}
      <View
        style={styles.imageBand}
        onLayout={(e) => {
          const next = Math.round(e.nativeEvent.layout.height);
          setImageAreaH((prev) => (prev === next ? prev : next));
        }}>
        {imageAreaH > 0 ? (
          <Animated.ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            bounces={false}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            onScrollBeginDrag={() => setPaused(true)}
            onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
              syncIndex(e.nativeEvent.contentOffset.x);
              setPaused(false);
            }}>
            {GET_STARTED_SLIDES.map((item, index) => (
              <SlideHeroImage
                key={item.id}
                slide={item}
                index={index}
                pageWidth={screenW}
                areaHeight={imageAreaH}
                scrollX={scrollX}
              />
            ))}
          </Animated.ScrollView>
        ) : null}
      </View>

      {/* Shared bottom chrome — fixed slots + safe-area so legal stays fully visible */}
      <View style={[styles.bottomPanel, { paddingBottom: bottomPad }]}>
        <GetStartedPagerDots
          count={GET_STARTED_SLIDES.length}
          scrollX={scrollX}
          pageWidth={screenW}
        />

        <Animated.View
          key={slide.id}
          entering={FadeIn.duration(200)}
          style={styles.copyBlock}>
          <Text
            accessibilityRole="header"
            accessibilityLabel={accessibilityHeadline}
            style={[
              styles.headline,
              {
                fontSize: headline.fontSize,
                lineHeight: headline.lineHeight,
                letterSpacing: headline.letterSpacing,
                height: headlineSlotH,
              },
            ]}
            allowFontScaling={false}>
            {slide.headline.map((part, i) => (
              <Text
                key={`${slide.id}-${i}`}
                style={part.accent ? styles.headlineAccent : undefined}
                allowFontScaling={false}>
                {part.text}
              </Text>
            ))}
          </Text>

          <Text
            style={[
              styles.subtitle,
              {
                fontSize: subtitle.fontSize,
                lineHeight: subtitle.lineHeight,
                letterSpacing: subtitle.letterSpacing,
                height: subtitleSlotH,
              },
            ]}
            allowFontScaling={false}>
            {slide.subtitle}
          </Text>
        </Animated.View>

        <View style={styles.ctaBlock}>
          <GetStartedGlassButton label="Let's get started!" onPress={onSignIn} />
          <Text
            style={[
              styles.legal,
              {
                fontSize: legal.fontSize,
                lineHeight: legal.lineHeight,
                height: legalSlotH,
              },
            ]}
            allowFontScaling={false}>
            {'By continuing, you accept our '}
            <Text
              style={styles.legalLink}
              onPress={onTerms}
              accessibilityRole="link"
              accessibilityLabel="Terms & Condition">
              Terms & Condition
            </Text>
            {' and\n'}
            <Text
              style={styles.legalLink}
              onPress={onPrivacy}
              accessibilityRole="link"
              accessibilityLabel="Privacy Policy">
              Privacy Policy
            </Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  logoRow: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 4,
    backgroundColor: BG,
  },
  logoLockup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoText: {
    fontFamily: Inter.semiBold,
    fontSize: 18,
    lineHeight: 22,
    color: BRAND.primary,
    letterSpacing: -0.5,
  },
  imageBand: {
    flex: 1,
    minHeight: 200,
    overflow: 'hidden',
  },
  imageFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 72,
  },
  bottomPanel: {
    flexShrink: 0,
    backgroundColor: BG,
    paddingHorizontal: 24,
    paddingTop: 4,
    gap: 8,
    justifyContent: 'flex-start',
  },
  copyBlock: {
    gap: 6,
    alignItems: 'center',
    width: '100%',
  },
  headline: {
    fontFamily: Inter.semiBold,
    color: '#111827',
    textAlign: 'center',
    width: '100%',
  },
  headlineAccent: {
    color: BRAND.primary,
  },
  subtitle: {
    fontFamily: Inter.regular,
    color: '#6B7280',
    textAlign: 'center',
    width: '100%',
    paddingHorizontal: 2,
  },
  ctaBlock: {
    gap: 10,
    width: '100%',
    marginTop: 2,
  },
  legal: {
    fontFamily: Inter.regular,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  legalLink: {
    color: '#6B7280',
    textDecorationLine: 'underline',
  },
});
