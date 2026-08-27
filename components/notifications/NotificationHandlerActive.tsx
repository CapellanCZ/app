import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';

import { useAuth } from '@/lib/auth/AuthProvider';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Active listeners — only load when `expo-notifications` is supported. */
export function NotificationHandlerActive() {
  const router = useRouter();
  const { session } = useAuth();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    if (!session?.user) return;

    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('[notification] Received:', notification);
      },
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        console.log('[notification] Tapped:', data);

        if (data?.href) {
          router.push(data.href as any);
        }
      },
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [session?.user, router]);

  return null;
}
