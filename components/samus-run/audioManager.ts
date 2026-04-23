export interface AudioManager {
  playJump: () => void;
  playScore: () => void;
  playDeath: () => void;
}

export function createAudioManager(): AudioManager {
  const ctx = new AudioContext();

  // iOS Safari requires resume() on user gesture — called automatically
  // since createAudioManager is invoked inside an input handler
  if (ctx.state === "suspended") {
    ctx.resume();
  }

  function playTone(
    frequency: number,
    endFrequency: number,
    duration: number,
    type: OscillatorType = "square",
    volume: number = 0.15
  ) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(endFrequency, ctx.currentTime + duration);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  return {
    playJump() {
      // Short rising tone — square wave, 280Hz to 560Hz over 0.1s
      playTone(280, 560, 0.1, "square", 0.12);
    },
    playScore() {
      // Quick high blip — sine wave, 880Hz to 1100Hz over 0.08s
      playTone(880, 1100, 0.08, "sine", 0.1);
    },
    playDeath() {
      // Descending buzz — sawtooth wave, 440Hz to 110Hz over 0.3s
      playTone(440, 110, 0.3, "sawtooth", 0.15);
    },
  };
}
