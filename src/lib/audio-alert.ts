'use client';

class SoundAlertManager {
  private audioCtx: AudioContext | null = null;
  private intervalId: any = null;
  private isMuted: boolean = false;
  private isAudioUnlocked: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const savedMute = localStorage.getItem('hotel_eng_sound_muted');
        if (savedMute !== null) {
          this.isMuted = savedMute === 'true';
        }
      } catch {
        // Storage restricted in strict WebKit mode
      }
    }
  }

  /**
   * Unlock Web Audio API context upon user gesture
   */
  public unlockAudio(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      this.isAudioUnlocked = true;
      return true;
    } catch (e) {
      console.warn('AudioContext initialization error:', e);
      return false;
    }
  }

  public isUnlocked(): boolean {
    return this.isAudioUnlocked && this.audioCtx !== null && this.audioCtx.state === 'running';
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('hotel_eng_sound_muted', String(muted));
      } catch {
        // Storage restricted
      }
    }
    if (muted) {
      this.stopAlert();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Play a single pleasant hotel alert chime (2 melodic bells)
   */
  public playChime() {
    if (this.isMuted) return;
    this.unlockAudio();

    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;

      // Note 1: D5 (587.33 Hz)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      // Note 2: A5 (880 Hz) - slightly delayed
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.0, now + 0.18);
      gain2.gain.setValueAtTime(0.25, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.18);
      osc2.stop(now + 0.9);
    } catch (e) {
      console.warn('Could not play synthesized chime:', e);
    }
  }

  /**
   * Start looping the chime alert every 3.5 seconds
   */
  public startLoopingAlert() {
    if (this.intervalId) return; // Already running
    this.playChime();
    this.intervalId = setInterval(() => {
      this.playChime();
    }, 3500);
  }

  /**
   * Stop looping the chime alert
   */
  public stopAlert() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const soundAlert = new SoundAlertManager();
