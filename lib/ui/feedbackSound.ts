import * as Haptics from 'expo-haptics';
import type { AudioPlayer } from 'expo-audio';

export type ToastFeedbackKind = 'default' | 'accent' | 'success' | 'warning' | 'danger';

type FeedbackPlayers = {
  success: AudioPlayer;
  info: AudioPlayer;
  warning: AudioPlayer;
  danger: AudioPlayer;
};

let players: FeedbackPlayers | null = null;
let modeReady = false;
let lastPlayAt = 0;
let lastPlayKey: string | null = null;

/** Bound from `FeedbackSoundHost` once players are mounted. */
export function bindFeedbackPlayers(next: FeedbackPlayers | null) {
  players = next;
}

function mapVariant(variant: ToastFeedbackKind | undefined): keyof FeedbackPlayers {
  switch (variant) {
    case 'success':
      return 'success';
    case 'warning':
      return 'warning';
    case 'danger':
      return 'danger';
    case 'accent':
    case 'default':
    default:
      return 'info';
  }
}

async function hapticFor(variant: ToastFeedbackKind | undefined) {
  try {
    switch (variant) {
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'danger':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      default:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
    }
  } catch {
    // Haptics unavailable (simulator / web) — ignore.
  }
}

/**
 * Soft toast chime + haptic.
 * Sound respects the ringer / silent switch (`playsInSilentMode: false`);
 * haptics still fire so silent-mode users get feedback.
 */
export async function playToastFeedback(variant?: ToastFeedbackKind): Promise<void> {
  const key = mapVariant(variant);
  const now = Date.now();
  // Avoid double-chime when a toast and success screen fire back-to-back.
  if (lastPlayKey === key && now - lastPlayAt < 900) {
    return;
  }
  lastPlayKey = key;
  lastPlayAt = now;

  void hapticFor(variant);

  const pool = players;
  if (!pool) return;

  const player = pool[key];
  if (!player) return;

  try {
    if (!modeReady) {
      const { setAudioModeAsync } = await import('expo-audio');
      await setAudioModeAsync({
        playsInSilentMode: false,
        interruptionMode: 'mixWithOthers',
        shouldPlayInBackground: false,
      });
      modeReady = true;
    }

    player.volume = 0.85;
    await player.seekTo(0);
    player.play();
  } catch (error) {
    console.warn('[feedback] play failed:', error);
  }
}
