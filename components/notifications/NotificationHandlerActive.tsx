import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';

import { useAuth } from '@/lib/auth/AuthProvider';
import { ensureDefaultAndroidNotificationChannel } from '@/lib/notifications/androidNotificationChannel';
import { sanitizeNotificationHref } from '@/lib/notifications/safeNotificationHref';
import { toastFromNotification } from '@/lib/notifications/toastFromNotification';
import { resolveNotificationStatus } from '@/lib/notifications/resolveNotificationStatus';

/**
 * Foreground → hide OS banner/sound (in-app toast handles it).
 * Background / killed → system tray via Expo Push (FCM).
 */
function applyPresentationForAppState(state: AppStateStatus) {
  const inForeground = state === 'active';
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: !inForeground,
      shouldPlaySound: !inForeground,
      shouldSetBadge: true,
      shouldShowBanner: !inForeground,
      shouldShowList: !inForeground,
    }),
  });
}

applyPresentationForAppState(AppState.currentState);

function stringData(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

/** Active listeners — only load when `expo-notifications` is supported. */
export function NotificationHandlerActive() {
  const router = useRouter();
  const { session } = useAuth();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    void ensureDefaultAndroidNotificationChannel();
    applyPresentationForAppState(AppState.currentState);
    const sub = AppState.addEventListener('change', applyPresentationForAppState);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!session?.user) return;

    // If a push arrives while foreground (OS banner suppressed), show toast once.
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        if (AppState.currentState !== 'active') return;

        const content = notification.request.content;
        const data = (content.data ?? {}) as Record<string, unknown>;
        const title = content.title?.trim();
        const body = content.body?.trim() ?? '';
        if (!title) return;

        const notificationId =
          stringData(data.notificationId) ??
          notification.request.identifier ??
          `push-${title}-${body}`;

        toastFromNotification({
          id: notificationId,
          title,
          body,
          href: sanitizeNotificationHref(stringData(data.href)),
          ticketId: stringData(data.ticket_id),
          queueMilestone: stringData(data.queue_milestone),
          appointmentId: stringData(data.appointment_id),
          notificationType: resolveNotificationStatus(
            stringData(data.notification_type),
            title,
          ),
        });
      },
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as Record<string, unknown>;
        const href = sanitizeNotificationHref(stringData(data?.href));
        if (href) {
          router.push(href as never);
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
