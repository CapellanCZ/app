import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconsaxCalendarIcon } from '@/components/icons/IconsaxCalendarIcon';
import { IconsaxDangerFilledIcon } from '@/components/icons/IconsaxDangerFilledIcon';
import { IconsaxMedalFilledIcon } from '@/components/icons/IconsaxMedalFilledIcon';
import { IconsaxMegaphoneIcon } from '@/components/icons/IconsaxMegaphoneIcon';
import { IconsaxSearchIcon } from '@/components/icons/IconsaxSearchIcon';
import { GradientText } from '@/components/GradientText';
import { ScreenNavbar } from '@/components/ScreenNavbar';

const HERO_BORDER = '#0040C1';
/** Figma 1263:3156 — brand hero; gradient reads richer than flat fill on device. */
const HERO_GRADIENT = ['#2970FF', '#155EEF', '#1248E8'] as const;
const IN_PROGRESS_DOT = '#47CD89';

/** Figma 1263:3151 — personal scholarship progress + requirement cards. */
export default function MyScholarshipScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-[#FAFAFA]">
      <ScreenNavbar
        title="My Scholarship"
        showMenu={false}
        onBackPress={() => router.replace('/(tabs)')}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 20) + 16,
        }}>
        <View className="px-5 pb-5 pt-2">
          <View
            className="w-full overflow-hidden rounded-3xl"
            style={{ borderWidth: 1, borderColor: HERO_BORDER }}>
            <LinearGradient
              colors={[...HERO_GRADIENT]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={{ paddingHorizontal: 20, paddingVertical: 24 }}>
              <View className="items-center">
                <View
                  className="flex-row items-center gap-2 rounded-[20px] px-3 py-2"
                  style={{ backgroundColor: 'rgba(0,53,158,0.4)' }}>
                  <View
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: IN_PROGRESS_DOT }}
                  />
                  <Text className="text-sm font-semibold capitalize leading-5 text-white">Active</Text>
                </View>
              </View>

              <View className="mt-4 items-center">
                <GradientText className="text-sm font-medium capitalize leading-5">
                  Scholarship
                </GradientText>
                <View className="flex-row items-center justify-center gap-2">
                  <IconsaxMedalFilledIcon size={36} color="#FFFFFF" />
                  <GradientText className="text-3xl font-bold capitalize leading-9">
                    White Scholar
                  </GradientText>
                </View>
              </View>

              <View className="mt-6 flex-row items-stretch rounded-3xl bg-white px-5 py-6">
                <View className="min-w-0 flex-1 items-center gap-2">
                  <Text className="text-3xl font-semibold leading-9 text-[#155EEF]">1</Text>
                  <Text className="text-center text-sm font-normal leading-6 text-[#181D27]">
                    Requirements
                  </Text>
                </View>
                <View className="w-px self-stretch bg-[#E4E7EC]" />
                <View className="min-w-0 flex-1 items-center gap-2">
                  <Text className="text-3xl font-semibold leading-9 text-[#155EEF]">60%</Text>
                  <Text className="text-center text-sm font-normal leading-6 text-[#181D27]">
                    Your Progress
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>

        <View className="min-h-[200px] flex-1 rounded-t-[30px] bg-white px-5 pb-8 pt-8">
          <View className="mb-4 flex-row items-center justify-between gap-3">
            <Text className="min-w-0 flex-1 text-lg font-semibold leading-6 text-[#1F2024]">
              Scholarship Requirements
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="See all scholarships"
              hitSlop={8}
              onPress={() => router.push('/student-development-affairs')}>
              <Text className="text-[15px] font-medium leading-5 text-[#2970FF]">See All</Text>
            </Pressable>
          </View>

          <LinearGradient
            colors={['#2970FF', '#00359E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 14,
              marginBottom: 16,
              minHeight: 52,
            }}>
            <IconsaxMegaphoneIcon size={24} color="#FFFFFF" />
            <Text className="ml-3 flex-1 text-sm leading-6 text-white">
              Kindly talk to your professors to submit your grade.
            </Text>
          </LinearGradient>

          <View className="mb-4 rounded-2xl border border-[rgba(164,167,174,0.24)] bg-white p-5">
            <View className="flex-row items-center justify-between gap-3">
              <Text className="min-w-0 flex-1 text-lg font-semibold capitalize leading-6 text-[#181D27]">
                Latest Copy Grades
              </Text>
              <Pressable
                accessibilityRole="button"
                className="flex-row items-center gap-1.5 rounded-2xl bg-[#2970FF] px-3 py-2.5">
                <Text className="text-sm font-semibold text-white">Re-submit</Text>
                <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
            <View className="my-4 h-px w-full border-t border-dashed border-[#E4E7EC]" />
            <View className="flex-row flex-wrap items-center gap-3">
              <View className="flex-row items-center gap-2">
                <IconsaxCalendarIcon size={22} color="#717680" />
                <Text className="text-[15px] font-normal leading-5 text-[#717680]">Sat, Feb 21</Text>
              </View>
              <View className="size-1.5 rounded-full bg-[#717680]" />
              <Text className="text-[15px] font-normal leading-5 text-[#717680]">26 days left</Text>
            </View>
            <View className="mt-4 flex-row items-start gap-3 rounded-xl bg-[#FFFaeb] px-4 py-3.5">
              <View className="pt-0.5">
                <IconsaxDangerFilledIcon size={24} color="#F79009" />
              </View>
              <Text className="flex-1 text-sm font-normal leading-6 text-[#181D27]">
                Please upload the latest copy of your grades.
              </Text>
            </View>
          </View>

          <View className="rounded-2xl border border-[rgba(164,167,174,0.24)] bg-white p-5">
            <View className="flex-row items-center justify-between gap-3">
              <Text className="min-w-0 flex-1 text-lg font-semibold capitalize leading-6 text-[#181D27]">
                Certificate of Grades
              </Text>
              <View className="flex-row items-center gap-2 rounded-xl bg-[#EAF2FF] px-3 py-2">
                <Text className="text-sm font-semibold capitalize tracking-wide text-[#006FFD]">
                  Under review
                </Text>
                <IconsaxSearchIcon size={16} color="#006FFD" />
              </View>
            </View>
            <View className="my-4 h-px w-full border-t border-dashed border-[#E4E7EC]" />
            <View className="flex-row flex-wrap items-center gap-3">
              <View className="flex-row items-center gap-2">
                <IconsaxCalendarIcon size={22} color="#717680" />
                <Text className="text-[15px] font-normal leading-5 text-[#717680]">Sat, Feb 21</Text>
              </View>
              <View className="size-1.5 rounded-full bg-[#717680]" />
              <Text className="text-[15px] font-normal leading-5 text-[#717680]">26 days left</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
