import { CompositionState, NatureLayerKey, ScaleType } from './types';

// Scale intervals in semitones relative to root
const SCALE_INTERVALS: Record<ScaleType, number[]> = {
  hirajoshi: [0, 2, 3, 7, 8],
  pentatonic_major: [0, 2, 4, 7, 9],
  dorian_dream: [0, 2, 3, 5, 7, 9, 10],
  lydian_float: [0, 2, 4, 6, 7, 9, 11],
  ambient_minor: [0, 2, 3, 5, 7, 8, 10],
};

const NOTE_NAMES: Record<string, number> = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
};

export class SereneSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;
  public analyser: AnalyserNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedbackGain: GainNode | null = null;

  // Track state
  public isPlaying: boolean = false;
  public state: CompositionState;
  private masterVolume: number = 0.8;
  
  // Timer & Loops
  private chordIntervalId: number | null = null;
  private melodyIntervalId: number | null = null;
  private chimeIntervalId: number | null = null;
  private birdTimeoutId: number | null = null;
  private fireTimeoutId: number | null = null;
  private rainDropTimeoutId: number | null = null;
  private sleepTimerId: number | null = null;
  private fadeIntervalId: number | null = null;

  // Active nature nodes & gains
  private natureGains: Record<NatureLayerKey, GainNode | null> = {
    rain: null,
    waves: null,
    stream: null,
    birds: null,
    crickets: null,
    fire: null,
    wind: null,
    vinyl: null,
    singingBowl: null,
  };

  // Binaural nodes
  private binauralLeftGain: GainNode | null = null;
  private binauralRightGain: GainNode | null = null;
  private binauralLeftOsc: OscillatorNode | null = null;
  private binauralRightOsc: OscillatorNode | null = null;

  // Singing bowl continuous drone
  private bowlOscs: OscillatorNode[] = [];
  private bowlMasterGain: GainNode | null = null;

  // Current chord step
  private currentChordIndex: number = 0;
  private activePadVoices: { oscs: OscillatorNode[]; gain: GainNode }[] = [];

  constructor(initialState: CompositionState) {
    this.state = { ...initialState };
  }

  /**
   * Safe AudioContext initialization
   */
  public async initAudio(): Promise<boolean> {
    if (this.ctx && this.ctx.state !== 'closed') {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return true;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      // Master chain: Analyser -> Limiter -> MasterGain -> Destination
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.82;

      this.limiter = this.ctx.createDynamicsCompressor();
      this.limiter.threshold.setValueAtTime(-4, this.ctx.currentTime);
      this.limiter.knee.setValueAtTime(8, this.ctx.currentTime);
      this.limiter.ratio.setValueAtTime(6, this.ctx.currentTime);
      this.limiter.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.limiter.release.setValueAtTime(0.25, this.ctx.currentTime);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);

      // Reverb & Delay creation
      await this.initReverbAndDelay();

      // Connect master chain
      this.analyser.connect(this.limiter);
      this.limiter.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      // Initialize nature soundscape buses
      this.initNatureBuses();

      return true;
    } catch (e) {
      console.error('Failed to initialize AudioContext:', e);
      return false;
    }
  }

  /**
   * Create an ultra-smooth cathedral/ambient convolution reverb
   */
  private async initReverbAndDelay() {
    if (!this.ctx) return;

    // Create algorithmic impulse response for lush ambient reverb
    const duration = 3.6;
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = length - i;
      // Exponential decay
      const decay = Math.pow(n / length, 2.8);
      // Gentle stereo decorrelation
      left[i] = (Math.random() * 2 - 1) * decay;
      right[i] = (Math.random() * 2 - 1) * decay;
    }

    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = impulse;

    // Reverb wet gain
    const reverbGain = this.ctx.createGain();
    reverbGain.gain.value = 0.65;
    this.reverbNode.connect(reverbGain);
    reverbGain.connect(this.analyser!);

    // Delay network (ping-pong space)
    this.delayNode = this.ctx.createDelay();
    this.delayNode.delayTime.value = 0.48; // ~125ms or synced
    this.delayFeedbackGain = this.ctx.createGain();
    this.delayFeedbackGain.gain.value = 0.32;

    const delayFilter = this.ctx.createBiquadFilter();
    delayFilter.type = 'lowpass';
    delayFilter.frequency.value = 1600; // Warm delay repeats

    this.delayNode.connect(delayFilter);
    delayFilter.connect(this.delayFeedbackGain);
    this.delayFeedbackGain.connect(this.delayNode);
    delayFilter.connect(this.reverbNode); // Send delay into reverb for dreamy shimmer
  }

  /**
   * Setup continuous soundscape generator nodes
   */
  private initNatureBuses() {
    if (!this.ctx) return;

    // Create gain nodes for each layer
    (Object.keys(this.natureGains) as NatureLayerKey[]).forEach((key) => {
      const g = this.ctx!.createGain();
      g.gain.setValueAtTime(0, this.ctx!.currentTime);
      g.connect(this.analyser!);
      this.natureGains[key] = g;
    });

    this.startNoiseGenerators();
  }

  /**
   * Synthesize procedural nature soundscapes
   */
  private startNoiseGenerators() {
    if (!this.ctx) return;

    // 1. Pink Noise Buffer for Rain, Waves, Stream, Wind
    const bufferSize = this.ctx.sampleRate * 4;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    // A helper to start looped noise source
    const createNoiseSource = () => {
      const src = this.ctx!.createBufferSource();
      src.buffer = noiseBuffer;
      src.loop = true;
      src.start();
      return src;
    };

    // --- Rain ---
    const rainNoise = createNoiseSource();
    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = 'lowpass';
    rainFilter.frequency.value = 1800;
    const rainHighpass = this.ctx.createBiquadFilter();
    rainHighpass.type = 'highpass';
    rainHighpass.frequency.value = 400;
    rainNoise.connect(rainFilter);
    rainFilter.connect(rainHighpass);
    rainHighpass.connect(this.natureGains.rain!);

    // Rain subtle droplet drops
    this.scheduleRainDrops();

    // --- Waves (Ocean Swell) ---
    const wavesNoise = createNoiseSource();
    const wavesFilter = this.ctx.createBiquadFilter();
    wavesFilter.type = 'lowpass';
    wavesFilter.frequency.value = 650;
    
    // Wave surge LFO (12-second cycle)
    const waveLfo = this.ctx.createOscillator();
    waveLfo.frequency.value = 0.083; // ~12s cycle
    const waveLfoGain = this.ctx.createGain();
    waveLfoGain.gain.value = 0.4;
    waveLfo.connect(waveLfoGain);

    const wavesGainInner = this.ctx.createGain();
    wavesGainInner.gain.value = 0.5;
    waveLfoGain.connect(wavesGainInner.gain);
    waveLfo.start();

    wavesNoise.connect(wavesFilter);
    wavesFilter.connect(wavesGainInner);
    wavesGainInner.connect(this.natureGains.waves!);

    // --- Stream / Brook ---
    const streamNoise = createNoiseSource();
    const streamBand = this.ctx.createBiquadFilter();
    streamBand.type = 'bandpass';
    streamBand.frequency.value = 1100;
    streamBand.Q.value = 1.8;
    streamNoise.connect(streamBand);
    streamBand.connect(this.natureGains.stream!);

    // --- Wind ---
    const windNoise = createNoiseSource();
    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.value = 350;
    const windLfo = this.ctx.createOscillator();
    windLfo.frequency.value = 0.12; // slow sway
    const windLfoGain = this.ctx.createGain();
    windLfoGain.gain.value = 180;
    windLfo.connect(windLfoGain);
    windLfoGain.connect(windFilter.frequency);
    windLfo.start();
    windNoise.connect(windFilter);
    windFilter.connect(this.natureGains.wind!);

    // --- Crickets ---
    this.startCrickets();

    // --- Campfire Crackle ---
    this.scheduleCampfire();

    // --- Forest Birds ---
    this.scheduleForestBirds();

    // --- Vinyl ---
    const vinylNoise = createNoiseSource();
    const vinylFilter = this.ctx.createBiquadFilter();
    vinylFilter.type = 'bandpass';
    vinylFilter.frequency.value = 2400;
    vinylFilter.Q.value = 0.8;
    const vinylVol = this.ctx.createGain();
    vinylVol.gain.value = 0.2;
    vinylNoise.connect(vinylFilter);
    vinylFilter.connect(vinylVol);
    vinylVol.connect(this.natureGains.vinyl!);

    // --- Singing Bowl Drone ---
    this.initSingingBowlDrone();
  }

  /**
   * Continuous warm singing bowl resonance drone
   */
  private initSingingBowlDrone() {
    if (!this.ctx) return;
    this.bowlMasterGain = this.ctx.createGain();
    this.bowlMasterGain.gain.value = 0.35;
    this.bowlMasterGain.connect(this.natureGains.singingBowl!);

    // Root frequency for bowl (e.g., 216Hz or 174Hz)
    const fundamental = 216; // Harmonic of 432
    const harmonics = [1, 2.76, 5.4, 8.2];
    const amplitudes = [0.6, 0.3, 0.15, 0.05];

    harmonics.forEach((h, idx) => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = fundamental * h;

      const g = this.ctx!.createGain();
      g.gain.value = amplitudes[idx];

      // Subtle vibrato
      const lfo = this.ctx!.createOscillator();
      lfo.frequency.value = 0.15 + idx * 0.05;
      const lfoG = this.ctx!.createGain();
      lfoG.gain.value = 0.8;
      lfo.connect(lfoG);
      lfoG.connect(osc.frequency);
      lfo.start();

      osc.connect(g);
      g.connect(this.bowlMasterGain!);
      osc.start();
      this.bowlOscs.push(osc);
    });
  }

  /**
   * Crickets high-frequency pulsed modulation
   */
  private startCrickets() {
    if (!this.ctx) return;
    const carrier = this.ctx.createOscillator();
    carrier.type = 'sine';
    carrier.frequency.value = 4650;

    const modulator = this.ctx.createOscillator();
    modulator.type = 'sine';
    modulator.frequency.value = 34; // cricket chirping rate

    const modGain = this.ctx.createGain();
    modGain.gain.value = 0.5;
    modulator.connect(modGain);

    const cricketPulsing = this.ctx.createGain();
    cricketPulsing.gain.value = 0.2;
    modGain.connect(cricketPulsing.gain);

    carrier.connect(cricketPulsing);
    cricketPulsing.connect(this.natureGains.crickets!);

    carrier.start();
    modulator.start();
  }

  /**
   * Natural occasional campfire crackle and pops
   */
  private scheduleCampfire = () => {
    if (!this.ctx) return;
    if (this.natureGains.fire && this.state.natureLayers.fire > 0.02 && this.isPlaying) {
      // Crackle click
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600 + Math.random() * 800, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.03);

      const g = this.ctx.createGain();
      const popVol = (Math.random() * 0.3 + 0.1) * this.state.natureLayers.fire;
      g.gain.setValueAtTime(popVol, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

      osc.connect(g);
      g.connect(this.natureGains.fire);
      osc.start(now);
      osc.stop(now + 0.04);
    }
    const nextInterval = 80 + Math.random() * 320;
    this.fireTimeoutId = window.setTimeout(this.scheduleCampfire, nextInterval);
  };

  /**
   * Random subtle rain droplets
   */
  private scheduleRainDrops = () => {
    if (!this.ctx) return;
    if (this.natureGains.rain && this.state.natureLayers.rain > 0.05 && this.isPlaying) {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200 + Math.random() * 1600, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.06 * this.state.natureLayers.rain, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

      osc.connect(g);
      g.connect(this.reverbNode || this.masterGain!);
      osc.start(now);
      osc.stop(now + 0.07);
    }
    const next = 200 + Math.random() * 800;
    this.rainDropTimeoutId = window.setTimeout(this.scheduleRainDrops, next);
  };

  /**
   * Occasional soothing forest bird warbles
   */
  private scheduleForestBirds = () => {
    if (!this.ctx) return;
    if (this.natureGains.birds && this.state.natureLayers.birds > 0.03 && this.isPlaying) {
      const now = this.ctx.currentTime;
      const birdGain = this.ctx.createGain();
      birdGain.gain.setValueAtTime(0.12 * this.state.natureLayers.birds, now);
      birdGain.connect(this.reverbNode || this.masterGain!);

      // 2 or 3 graceful chirps
      const chirps = Math.floor(Math.random() * 3) + 2;
      for (let i = 0; i < chirps; i++) {
        const chirpTime = now + i * 0.12;
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        const baseFreq = 2600 + Math.random() * 1400;
        osc.frequency.setValueAtTime(baseFreq, chirpTime);
        osc.frequency.linearRampToValueAtTime(baseFreq + 700, chirpTime + 0.04);
        osc.frequency.linearRampToValueAtTime(baseFreq - 200, chirpTime + 0.09);

        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0, chirpTime);
        g.gain.linearRampToValueAtTime(0.2, chirpTime + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, chirpTime + 0.1);

        osc.connect(g);
        g.connect(birdGain);
        osc.start(chirpTime);
        osc.stop(chirpTime + 0.11);
      }
    }
    const nextInterval = 4000 + Math.random() * 6000;
    this.birdTimeoutId = window.setTimeout(this.scheduleForestBirds, nextInterval);
  };

  /**
   * Binaural Beats generator (Left & Right frequency offset)
   */
  private updateBinauralBeats() {
    if (!this.ctx) return;

    if (this.state.instruments.binauralType === 'none') {
      if (this.binauralLeftGain) this.binauralLeftGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1);
      if (this.binauralRightGain) this.binauralRightGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1);
      return;
    }

    let delta = 4; // theta 4Hz default
    if (this.state.instruments.binauralType === 'alpha_8hz') delta = 8;
    if (this.state.instruments.binauralType === 'delta_2hz') delta = 2;

    const baseFreq = this.state.tuningHz === 528 ? 264 : this.state.tuningHz === 432 ? 216 : 220;

    if (!this.binauralLeftOsc || !this.binauralRightOsc) {
      // Create stereo merger
      const merger = this.ctx.createChannelMerger(2);

      this.binauralLeftOsc = this.ctx.createOscillator();
      this.binauralLeftOsc.type = 'sine';
      this.binauralLeftGain = this.ctx.createGain();

      this.binauralRightOsc = this.ctx.createOscillator();
      this.binauralRightOsc.type = 'sine';
      this.binauralRightGain = this.ctx.createGain();

      this.binauralLeftOsc.connect(this.binauralLeftGain);
      this.binauralLeftGain.connect(merger, 0, 0); // left channel

      this.binauralRightOsc.connect(this.binauralRightGain);
      this.binauralRightGain.connect(merger, 0, 1); // right channel

      merger.connect(this.analyser!);

      this.binauralLeftOsc.start();
      this.binauralRightOsc.start();
    }

    const now = this.ctx.currentTime;
    this.binauralLeftOsc.frequency.setValueAtTime(baseFreq, now);
    this.binauralRightOsc.frequency.setValueAtTime(baseFreq + delta, now);

    const volume = 0.08 * (this.isPlaying ? 1 : 0);
    this.binauralLeftGain!.gain.linearRampToValueAtTime(volume, now + 1.5);
    this.binauralRightGain!.gain.linearRampToValueAtTime(volume, now + 1.5);
  }

  /**
   * Helper: Get frequency from root note name, scale interval, and octave
   */
  public getFrequency(semitonesFromRoot: number, octave: number = 3): number {
    const rootSemitone = NOTE_NAMES[this.state.rootNote] ?? 0;
    // MIDI number for C0 is 12, C4 is 60
    const midi = (octave + 1) * 12 + rootSemitone + semitonesFromRoot;
    // Calculate frequency relative to tuning standard (A4 = 432 / 440 / 528)
    const a4 = this.state.tuningHz;
    return a4 * Math.pow(2, (midi - 69) / 12);
  }

  /**
   * Get notes available in the current scale across octaves for the interactive player
   */
  public getScaleNotes(octaveStart: number = 3, numNotes: number = 10) {
    const intervals = SCALE_INTERVALS[this.state.scale];
    const notes: { name: string; freq: number; octave: number; interval: number }[] = [];
    let currentOctave = octaveStart;
    let idx = 0;

    for (let i = 0; i < numNotes; i++) {
      const interval = intervals[idx % intervals.length];
      const oct = currentOctave + Math.floor(idx / intervals.length);
      const freq = this.getFrequency(interval, oct);
      const semitoneTotal = (NOTE_NAMES[this.state.rootNote] + interval) % 12;
      const noteNamesList = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const noteName = `${noteNamesList[semitoneTotal]}${oct}`;

      notes.push({
        name: noteName,
        freq,
        octave: oct,
        interval,
      });
      idx++;
    }
    return notes;
  }

  /**
   * Generative Ambient Pad chords
   */
  private playNextPadChord() {
    if (!this.ctx || !this.isPlaying) return;

    const intervals = SCALE_INTERVALS[this.state.scale];
    // Progression of 4 soothing steps based on scale
    const rootOffset = intervals[this.currentChordIndex % intervals.length];
    this.currentChordIndex++;

    // Build peaceful triad or 9th chord (Root, 5th, 9th, 3rd)
    const chordSemitones = [
      rootOffset,
      rootOffset + 7, // fifth
      rootOffset + 14, // ninth
      rootOffset + (intervals[2] || 4), // subtle modal color
    ];

    const now = this.ctx.currentTime;
    const chordDuration = (60 / this.state.bpm) * 8; // 8 beats per chord (~8-10 seconds)
    const attack = 2.8;
    const release = 3.8;

    const chordGain = this.ctx.createGain();
    chordGain.gain.setValueAtTime(0.0001, now);
    chordGain.gain.linearRampToValueAtTime(0.18 * this.state.instruments.padWarmth, now + attack);
    chordGain.gain.setValueAtTime(0.18 * this.state.instruments.padWarmth, now + chordDuration - release);
    chordGain.gain.linearRampToValueAtTime(0.0001, now + chordDuration);

    const padFilter = this.ctx.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.setValueAtTime(450, now);
    padFilter.frequency.linearRampToValueAtTime(750, now + attack);
    padFilter.frequency.linearRampToValueAtTime(450, now + chordDuration);

    chordGain.connect(padFilter);
    padFilter.connect(this.reverbNode || this.masterGain!);

    const oscs: OscillatorNode[] = [];

    chordSemitones.forEach((st, idx) => {
      const freq = this.getFrequency(st, idx === 0 ? 2 : 3);

      // Warm Triangle oscillator
      const osc1 = this.ctx!.createOscillator();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, now);
      osc1.connect(chordGain);
      osc1.start(now);
      osc1.stop(now + chordDuration + 0.1);
      oscs.push(osc1);

      // Detuned soft Sine for lush chorus
      const osc2 = this.ctx!.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 1.002, now);
      osc2.connect(chordGain);
      osc2.start(now);
      osc2.stop(now + chordDuration + 0.1);
      oscs.push(osc2);
    });

    this.activePadVoices.push({ oscs, gain: chordGain });

    // Clean up expired voice references
    setTimeout(() => {
      this.activePadVoices = this.activePadVoices.filter((v) => v.gain !== chordGain);
    }, (chordDuration + 0.5) * 1000);
  }

  /**
   * Generative Neo-Classical Piano / Rhodes Melodic droplets
   */
  private playMelodicDroplet() {
    if (!this.ctx || !this.isPlaying) return;
    if (this.state.instruments.pianoPresence < 0.05) return;

    // 40% chance of rest for breathing room
    if (Math.random() < 0.38) return;

    const intervals = SCALE_INTERVALS[this.state.scale];
    const randomInterval = intervals[Math.floor(Math.random() * intervals.length)];
    const octave = Math.random() < 0.65 ? 4 : 5;
    const freq = this.getFrequency(randomInterval, octave);

    this.triggerInstrumentNote(freq, 'piano', (Math.random() * 0.3 + 0.4) * this.state.instruments.pianoPresence);
  }

  /**
   * Periodic crystalline wind chime / singing bowl ping
   */
  private playRandomChime() {
    if (!this.ctx || !this.isPlaying) return;
    if (this.state.instruments.chimeFrequency < 0.05) return;

    if (Math.random() < 0.45) {
      const intervals = SCALE_INTERVALS[this.state.scale];
      const randomInterval = intervals[Math.floor(Math.random() * intervals.length)];
      const freq = this.getFrequency(randomInterval, 5);
      this.triggerInstrumentNote(freq, 'chime', 0.5 * this.state.instruments.chimeFrequency);
    }
  }

  /**
   * Trigger note directly (used by generative engine AND user interactive piano/kalimba)
   */
  public triggerInstrumentNote(
    freq: number,
    type: 'piano' | 'kalimba' | 'chime' | 'bowl' = 'piano',
    velocity: number = 0.6
  ) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    if (type === 'piano') {
      // Soft Felt Piano / Rhodes FM synthesis
      const carrier = this.ctx.createOscillator();
      carrier.type = 'sine';
      carrier.frequency.setValueAtTime(freq, now);

      const modulator = this.ctx.createOscillator();
      modulator.type = 'sine';
      modulator.frequency.setValueAtTime(freq * 2, now); // 2:1 harmonic ratio

      const modGain = this.ctx.createGain();
      modGain.gain.setValueAtTime(freq * 0.9 * velocity, now);
      modGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
      modulator.connect(modGain);
      modGain.connect(carrier.frequency);

      const noteGain = this.ctx.createGain();
      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(0.24 * velocity, now + 0.02); // soft attack
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5); // long warm tail

      carrier.connect(noteGain);
      noteGain.connect(this.delayNode || this.reverbNode || this.masterGain!);
      noteGain.connect(this.reverbNode || this.masterGain!);

      carrier.start(now);
      modulator.start(now);
      carrier.stop(now + 2.6);
      modulator.stop(now + 2.6);

    } else if (type === 'kalimba' || type === 'chime') {
      // High resonance acoustic metal / wooden bell
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      const overtone = this.ctx.createOscillator();
      overtone.type = 'sine';
      overtone.frequency.setValueAtTime(freq * 2.756, now);

      const noteGain = this.ctx.createGain();
      noteGain.gain.setValueAtTime(0.28 * velocity, now);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + (type === 'chime' ? 3.4 : 1.8));

      const overtoneGain = this.ctx.createGain();
      overtoneGain.gain.setValueAtTime(0.09 * velocity, now);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

      osc.connect(noteGain);
      overtone.connect(overtoneGain);
      overtoneGain.connect(noteGain);

      noteGain.connect(this.delayNode || this.reverbNode || this.masterGain!);
      noteGain.connect(this.reverbNode || this.masterGain!);

      osc.start(now);
      overtone.start(now);
      osc.stop(now + 3.5);
      overtone.stop(now + 1.0);

    } else if (type === 'bowl') {
      // Tibetan Singing bowl strike with physical resonance
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      const osc2 = this.ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2.76, now);

      const noteGain = this.ctx.createGain();
      noteGain.gain.setValueAtTime(0.35 * velocity, now);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 4.2);

      osc.connect(noteGain);
      osc2.connect(noteGain);
      noteGain.connect(this.reverbNode || this.masterGain!);

      osc.start(now);
      osc2.start(now);
      osc.stop(now + 4.3);
      osc2.stop(now + 4.3);
    }
  }

  /**
   * Start generative playback
   */
  public async play() {
    const initialized = await this.initAudio();
    if (!initialized || !this.ctx) return;

    this.isPlaying = true;

    // Update nature faders
    this.updateNatureGains();
    this.updateBinauralBeats();

    // Start Pad Loop
    const chordDurationMs = ((60 / this.state.bpm) * 8) * 1000;
    this.playNextPadChord();
    if (this.chordIntervalId) clearInterval(this.chordIntervalId);
    this.chordIntervalId = window.setInterval(() => {
      this.playNextPadChord();
    }, chordDurationMs - 1200); // overlap by 1.2s for silky smooth transition

    // Start Melodic Droplet Loop (quarter/half note ticks)
    const melodyBeatMs = ((60 / this.state.bpm) * 1.5) * 1000;
    if (this.melodyIntervalId) clearInterval(this.melodyIntervalId);
    this.melodyIntervalId = window.setInterval(() => {
      this.playMelodicDroplet();
    }, melodyBeatMs);

    // Start Chime Loop
    if (this.chimeIntervalId) clearInterval(this.chimeIntervalId);
    this.chimeIntervalId = window.setInterval(() => {
      this.playRandomChime();
    }, 4500);
  }

  /**
   * Pause/Stop playback
   */
  public pause() {
    this.isPlaying = false;
    if (this.chordIntervalId) clearInterval(this.chordIntervalId);
    if (this.melodyIntervalId) clearInterval(this.melodyIntervalId);
    if (this.chimeIntervalId) clearInterval(this.chimeIntervalId);

    if (this.ctx) {
      // Fade out nature gains
      (Object.keys(this.natureGains) as NatureLayerKey[]).forEach((key) => {
        const g = this.natureGains[key];
        if (g) g.gain.linearRampToValueAtTime(0, this.ctx!.currentTime + 0.6);
      });
      if (this.binauralLeftGain) this.binauralLeftGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.6);
      if (this.binauralRightGain) this.binauralRightGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.6);
    }
  }

  /**
   * Update state from UI (presets, AI generation, or manual sliders)
   */
  public updateState(newState: Partial<CompositionState>) {
    this.state = {
      ...this.state,
      ...newState,
      instruments: {
        ...this.state.instruments,
        ...(newState.instruments || {}),
      },
      natureLayers: {
        ...this.state.natureLayers,
        ...(newState.natureLayers || {}),
      },
    };

    if (this.isPlaying && this.ctx) {
      this.updateNatureGains();
      this.updateBinauralBeats();
    }
  }

  /**
   * Sync nature sound volume faders
   */
  public updateNatureGains() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    (Object.keys(this.natureGains) as NatureLayerKey[]).forEach((key) => {
      const g = this.natureGains[key];
      if (g) {
        const targetVol = this.isPlaying ? (this.state.natureLayers[key] ?? 0) : 0;
        g.gain.linearRampToValueAtTime(targetVol, now + 0.25);
      }
    });
  }

  /**
   * Set Master Volume (0.0 - 1.0)
   */
  public setMasterVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.linearRampToValueAtTime(this.masterVolume, this.ctx.currentTime + 0.1);
    }
  }

  public getMasterVolume() {
    return this.masterVolume;
  }

  /**
   * Set Sleep Timer (in minutes) with smooth 2-minute fadeout
   */
  public setSleepTimer(minutes: number | null, onFinish?: () => void) {
    if (this.sleepTimerId) {
      clearTimeout(this.sleepTimerId);
      this.sleepTimerId = null;
    }
    if (this.fadeIntervalId) {
      clearInterval(this.fadeIntervalId);
      this.fadeIntervalId = null;
    }

    if (!minutes || minutes <= 0) return;

    const totalMs = minutes * 60 * 1000;
    const fadeStartMs = Math.max(0, totalMs - 120000); // start fading 2 mins before

    // Schedule fadeout
    setTimeout(() => {
      if (!this.isPlaying) return;
      const initialVol = this.masterVolume;
      const steps = 60;
      let currentStep = 0;
      this.fadeIntervalId = window.setInterval(() => {
        currentStep++;
        const factor = Math.max(0, 1 - currentStep / steps);
        this.setMasterVolume(initialVol * factor);
        if (currentStep >= steps) {
          if (this.fadeIntervalId) clearInterval(this.fadeIntervalId);
          this.pause();
          this.setMasterVolume(initialVol); // restore volume
          if (onFinish) onFinish();
        }
      }, 2000);
    }, fadeStartMs);
  }
}
