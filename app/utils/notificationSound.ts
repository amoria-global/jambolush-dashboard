//app/utils/notificationSound.ts

export class NotificationSoundManager {
  private static instance: NotificationSoundManager;
  private audioContext: AudioContext | null = null;
  private soundEnabled: boolean = true;

  private constructor() {
    this.soundEnabled = typeof window !== 'undefined'
      ? localStorage.getItem('notificationSounds') !== 'false'
      : true;
  }

  static getInstance(): NotificationSoundManager {
    if (!NotificationSoundManager.instance) {
      NotificationSoundManager.instance = new NotificationSoundManager();
    }
    return NotificationSoundManager.instance;
  }

  setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('notificationSounds', enabled.toString());
    }
  }

  isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  private initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private createTone(frequency: number, duration: number, volume: number = 0.1): Promise<void> {
    return new Promise((resolve) => {
      if (!this.soundEnabled) {
        resolve();
        return;
      }

      try {
        this.initAudioContext();
        if (!this.audioContext) {
          resolve();
          return;
        }

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);

        oscillator.onended = () => resolve();
      } catch (error) {
        console.warn('Error playing notification sound:', error);
        resolve();
      }
    });
  }

  async playNotificationSound(type: 'info' | 'success' | 'warning' | 'error' | 'urgent' = 'info') {
    if (!this.soundEnabled) return;

    try {
      switch (type) {
        case 'success':
          // Happy ascending tones
          await this.createTone(523, 0.15); // C5
          await this.createTone(659, 0.15); // E5
          await this.createTone(784, 0.2);  // G5
          break;

        case 'warning':
          // Two-tone warning
          await this.createTone(400, 0.2);
          await this.createTone(300, 0.2);
          break;

        case 'error':
          // Low descending tones
          await this.createTone(330, 0.15); // E4
          await this.createTone(277, 0.15); // C#4
          await this.createTone(220, 0.25); // A3
          break;

        case 'urgent':
          // Rapid beeping
          for (let i = 0; i < 3; i++) {
            await this.createTone(880, 0.1, 0.15);
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          break;

        case 'info':
        default:
          // Gentle single tone
          await this.createTone(800, 0.2);
          break;
      }
    } catch (error) {
      console.warn('Error playing notification sound:', error);
    }
  }

  async requestPermissionAndPlay() {
    // For some browsers, audio context needs user interaction
    try {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
    } catch (error) {
      console.warn('Could not resume audio context:', error);
    }
  }
}

export default NotificationSoundManager.getInstance();