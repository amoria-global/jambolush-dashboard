/**
 * Notification Sound Utility
 * Plays notification sounds for user alerts
 */

let audioContext: AudioContext | null = null;

/**
 * Initialize audio context (needed for web audio API)
 */
const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

/**
 * Play a notification sound
 * @param type - Type of notification sound to play
 */
export const playNotificationSound = (type: 'success' | 'info' | 'warning' | 'error' | 'urgent' = 'info'): void => {
  try {
    const context = getAudioContext();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    // Different frequencies for different notification types
    const frequencies: Record<typeof type, number> = {
      success: 800,
      info: 600,
      warning: 700,
      error: 400,
      urgent: 900,
    };

    oscillator.frequency.value = frequencies[type];
    oscillator.type = 'sine';

    // Envelope for smooth sound
    gainNode.gain.setValueAtTime(0, context.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, context.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);

    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.5);
  } catch (error) {
    console.warn('Could not play notification sound:', error);
  }
};

/**
 * Play a custom beep sound
 */
export const playBeep = (): void => {
  playNotificationSound('info');
};

/**
 * Check if sound is enabled
 */
export const isSoundEnabled = (): boolean => {
  if (typeof window === 'undefined') return true;
  const enabled = localStorage.getItem('notificationSoundEnabled');
  return enabled !== 'false';
};

/**
 * Enable notification sounds
 */
export const enableSound = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('notificationSoundEnabled', 'true');
  }
};

/**
 * Disable notification sounds
 */
export const disableSound = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('notificationSoundEnabled', 'false');
  }
};

/**
 * Set sound enabled status
 */
export const setSoundEnabled = (enabled: boolean): void => {
  if (enabled) {
    enableSound();
  } else {
    disableSound();
  }
};

export default {
  playNotificationSound,
  playBeep,
  isSoundEnabled,
  enableSound,
  disableSound,
  setSoundEnabled,
};
