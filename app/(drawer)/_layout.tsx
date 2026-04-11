import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { Drawer } from 'expo-router/drawer';

import { LogoutConfirmModal } from '@/components/LogoutConfirmModal';
import {
  HOME_TAB_ICON_ACTIVE,
  HOME_TAB_ICON_INACTIVE,
} from '@/components/icons/IconsaxHomeTabIcon';
import {
  IconsaxHierarchyDrawerIcon,
  IconsaxHospitalDrawerIcon,
  IconsaxJudgeDrawerIcon,
  IconsaxLogoutDrawerIcon,
  IconsaxTeacherDrawerIcon,
} from '@/components/icons/DrawerItemIcons';
import { supabase } from '@/utils/supabase';

const HIDDEN_DRAWER_ITEM = { display: 'none' as const };

/** Drawer label + icon; focused state uses a slightly stronger red. */
const LOGOUT_DRAWER_RED_INACTIVE = '#E53935';
const LOGOUT_DRAWER_RED_ACTIVE = '#C62828';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

const DrawerLayout = () => {
  const router = useRouter();
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const handleConfirmLogout = useCallback(() => {
    void (async () => {
      await supabase?.auth.signOut();
      setLogoutModalOpen(false);
      router.replace('/login');
    })();
  }, [router]);

  return (
    <>
      <Drawer
        screenOptions={{
          drawerActiveTintColor: HOME_TAB_ICON_ACTIVE,
          drawerInactiveTintColor: HOME_TAB_ICON_INACTIVE,
          headerTitleAlign: 'center',
        }}>
        <Drawer.Screen
          name="(tabs)"
          options={{
            drawerItemStyle: HIDDEN_DRAWER_ITEM,
            headerShown: false,
          }}
        />
        <Drawer.Screen
          name="index"
          options={{
            drawerItemStyle: HIDDEN_DRAWER_ITEM,
            headerShown: false,
          }}
        />
        <Drawer.Screen
          name="student-development-affairs"
          options={{
            title: 'Student Development & Activities',
            drawerLabel: 'Student Development & Activities',
            drawerIcon: ({ color, size, focused }) => (
              <IconsaxTeacherDrawerIcon
                color={color}
                focused={focused}
                size={size}
              />
            ),
          }}
        />
        <Drawer.Screen
          name="health-service"
          options={{
            title: 'Health Service Office',
            drawerLabel: 'Health Service Office',
            drawerIcon: ({ color, size, focused }) => (
              <IconsaxHospitalDrawerIcon
                color={color}
                focused={focused}
                size={size}
              />
            ),
          }}
        />
        <Drawer.Screen
          name="discipline-office"
          options={{
            headerShown: false,
            title: 'Discipline Office',
            drawerLabel: 'Discipline Office',
            drawerIcon: ({ color, size, focused }) => (
              <IconsaxJudgeDrawerIcon color={color} focused={focused} size={size} />
            ),
          }}
        />
        <Drawer.Screen
          name="referrals"
          options={{
            title: 'Referrals',
            drawerLabel: 'Referrals',
            drawerIcon: ({ color, size, focused }) => (
              <IconsaxHierarchyDrawerIcon
                color={color}
                focused={focused}
                size={size}
              />
            ),
          }}
        />
        <Drawer.Screen
          name="logout"
          listeners={{
            drawerItemPress: (e) => {
              e.preventDefault();
              setLogoutModalOpen(true);
            },
          }}
          options={{
            title: 'Logout',
            drawerLabel: 'Logout',
            drawerActiveTintColor: LOGOUT_DRAWER_RED_ACTIVE,
            drawerInactiveTintColor: LOGOUT_DRAWER_RED_INACTIVE,
            drawerIcon: ({ color, size, focused }) => (
              <IconsaxLogoutDrawerIcon color={color} focused={focused} size={size} />
            ),
          }}
        />
      </Drawer>
      <LogoutConfirmModal
        open={logoutModalOpen}
        onOpenChange={setLogoutModalOpen}
        onConfirmLogout={handleConfirmLogout}
      />
    </>
  );
};

export default DrawerLayout;
