import { useEffect } from 'react';
import { useAudioPlayer } from 'expo-audio';

import { bindFeedbackPlayers } from '@/lib/ui/feedbackSound';

/**
 * Preloads toast/notification feedback chimes and binds them for
 * imperative `showAppToast` / notification use.
 */
export function FeedbackSoundHost() {
  const success = useAudioPlayer(require('../../assets/sounds/toast-success.wav'));
  const info = useAudioPlayer(require('../../assets/sounds/toast-info.wav'));
  const warning = useAudioPlayer(require('../../assets/sounds/toast-warning.wav'));
  const danger = useAudioPlayer(require('../../assets/sounds/toast-danger.wav'));

  useEffect(() => {
    bindFeedbackPlayers({ success, info, warning, danger });
    return () => bindFeedbackPlayers(null);
  }, [success, info, warning, danger]);

  return null;
}
