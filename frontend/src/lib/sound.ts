// Hospital chime sound and Speech Synthesis announcement

class AudioAlertService {
  private audioCtx: AudioContext | null = null;

  private initAudio() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
  }

  // Play realistic hospital three-tone chime (C5 -> E5 -> G5)
  public playChime(): Promise<void> {
    return new Promise((resolve) => {
      try {
        this.initAudio();
        if (!this.audioCtx) {
          resolve();
          return;
        }

        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }

        const tones = [523.25, 659.25, 783.99]; // C5, E5, G5
        const now = this.audioCtx.currentTime;

        tones.forEach((freq, idx) => {
          if (!this.audioCtx) return;
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.22);

          gain.gain.setValueAtTime(0, now + idx * 0.22);
          gain.gain.linearRampToValueAtTime(0.35, now + idx * 0.22 + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.22 + 0.35);

          osc.connect(gain);
          gain.connect(this.audioCtx.destination);

          osc.start(now + idx * 0.22);
          osc.stop(now + idx * 0.22 + 0.4);
        });

        setTimeout(resolve, 1000);
      } catch (err) {
        console.warn('Audio chime playback was restricted or not supported:', err);
        resolve();
      }
    });
  }

  // Speak announcement via browser SpeechSynthesis
  public announceToken(tokenNumber: string, roomNumber: string, patientName?: string): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    // Play chime first, then voice
    this.playChime().then(() => {
      window.speechSynthesis.cancel(); // Cancel any existing speech

      // Spell out token code clearly (e.g., "C A R D 1 0 2")
      const formattedToken = tokenNumber.replace('-', ' ');
      const namePart = patientName ? `Patient ${patientName}. ` : '';
      const message = `Attention please. ${namePart}Token ${formattedToken}, please proceed to ${roomNumber}.`;

      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 0.95; // Clear and deliberate pace
      utterance.pitch = 1.05;
      utterance.volume = 1.0;

      // Try selecting an English natural voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      window.speechSynthesis.speak(utterance);
    });
  }
}

export const audioAlert = new AudioAlertService();
