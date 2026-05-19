import { usePathname, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { useAuth } from '@/lib/auth/AuthProvider';
/* eslint-disable-next-line import/no-unresolved */
import { SDAO_MAIN_NAV } from '@/lib/scholarships/sdaoNavConfig';
/* eslint-disable-next-line import/no-unresolved */
import { SDAO_ROUTE_PREFIX } from '@/lib/scholarships/sdaoAdminConfig';

export function SdaoWebSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { session } = useAuth();

  const normalizedPath = pathname.replace(/\/$/, '') || '/';

  const isActive = (href: string, id: string) => {
    if (id === 'dashboard') {
      return normalizedPath === SDAO_ROUTE_PREFIX || normalizedPath === `${SDAO_ROUTE_PREFIX}/index`;
    }
    return normalizedPath === href || normalizedPath.startsWith(`${href}/`);
  };

  return (
    <View className="sdao-web-sidebar">
      <View className="sdao-web-sidebar__inner">
        <View className="sdao-web-sidebar__brand">
          <Text className="sdao-web-sidebar__logo">🛡</Text>
          <Text className="sdao-web-sidebar__title">CampusCare Scholarship Management</Text>
          <Text className="sdao-web-sidebar__institution-label">INSTITUTION</Text>
          <Text className="sdao-web-sidebar__institution">National University Dasmariñas</Text>
        </View>

        <View className="sdao-web-sidebar__nav" accessibilityRole="menu">
          {SDAO_MAIN_NAV.map((item) => {
            const active = isActive(item.href, item.id);
            return (
              <Pressable
                key={item.id}
                accessibilityRole="menuitem"
                onPress={() => router.push(item.href as never)}
                className={`sdao-web-sidebar__link${active ? ' sdao-web-sidebar__link--active' : ''}`}>
                <Text className="sdao-web-sidebar__link-label">{item.label}</Text>
                {item.readOnly ? <Text className="sdao-web-sidebar__link-meta">Read only</Text> : null}
              </Pressable>
            );
          })}
        </View>

        <View className="sdao-web-sidebar__footer">
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(tabs)/profiles' as never)}
            className="sdao-web-sidebar__footer-link">
            <Text className="sdao-web-sidebar__footer-text">Profile & Settings</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/logout' as never)}
            className="sdao-web-sidebar__footer-link">
            <Text className="sdao-web-sidebar__footer-text">Logout</Text>
          </Pressable>
          {session?.user?.email ? (
            <Text className="sdao-web-sidebar__user-email" numberOfLines={1}>
              {session.user.email}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}
