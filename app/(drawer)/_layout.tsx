import { Drawer } from 'expo-router/drawer';

import {
  HOME_TAB_ICON_ACTIVE,
  HOME_TAB_ICON_INACTIVE,
} from '@/components/icons/IconsaxHomeTabIcon';
import {
  IconsaxHierarchyDrawerIcon,
  IconsaxHospitalDrawerIcon,
  IconsaxJudgeDrawerIcon,
  IconsaxTeacherDrawerIcon,
} from '@/components/icons/DrawerItemIcons';

const HIDDEN_DRAWER_ITEM = { display: 'none' as const };

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

const DrawerLayout = () => {
  return (
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
          title: 'Student Development Affairs',
          drawerLabel: 'Student Development Affairs',
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
          title: 'Health Service',
          drawerLabel: 'Health Service',
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
    </Drawer>
  );
};

export default DrawerLayout;
