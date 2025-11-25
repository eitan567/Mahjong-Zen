
// Simple Audio Manager using Web Audio API to generate procedural sounds
let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null; // SFX Volume
let musicGain: GainNode | null = null;  // Music Volume

let globalVolume = 0.5;
let musicVolume = 0.5;
let voiceVolume = 1.0; // Voiceover Volume
let isMuted = false;

// TTS State
export type NarratorPersona = 'standard' | 'zen' | 'energetic' | 'grandfather';
let currentVoiceURI: string | null = null;
let currentPersona: NarratorPersona = 'standard';

// Ambient State
let ambientNodes: any[] = [];
let ambientInterval: ReturnType<typeof setInterval> | null = null;
let rainGainNode: GainNode | null = null;

const initAudio = () => {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContext();
    
    // SFX Channel
    masterGain = audioCtx.createGain();
    masterGain.gain.value = isMuted ? 0 : globalVolume; 
    masterGain.connect(audioCtx.destination);

    // Music Channel
    musicGain = audioCtx.createGain();
    musicGain.gain.value = isMuted ? 0 : musicVolume;
    musicGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(e => console.error("Audio resume failed", e));
  }
  return { ctx: audioCtx, master: masterGain, music: musicGain };
};

export const setMasterVolume = (volume: number) => {
  globalVolume = volume;
  if (masterGain && !isMuted) {
    masterGain.gain.setValueAtTime(volume, audioCtx?.currentTime || 0);
  }
};

export const setMusicVolume = (volume: number) => {
  musicVolume = volume;
  if (musicGain && !isMuted) {
    musicGain.gain.setValueAtTime(volume, audioCtx?.currentTime || 0);
  }
};

export const setVoiceVolume = (volume: number) => {
  voiceVolume = volume;
};

export const setMuted = (muted: boolean) => {
  isMuted = muted;
  const t = audioCtx?.currentTime || 0;
  
  if (masterGain) {
     masterGain.gain.setValueAtTime(muted ? 0 : globalVolume, t);
  }
  if (musicGain) {
     musicGain.gain.setValueAtTime(muted ? 0 : musicVolume, t);
  }
};

// --- TEXT TO SPEECH (HEBREW NARRATOR) ---

export const getHebrewVoices = (): SpeechSynthesisVoice[] => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return [];
    const voices = window.speechSynthesis.getVoices();
    return voices.filter(v => v.lang.includes('he'));
};

export const setNarratorVoice = (voiceURI: string) => {
    currentVoiceURI = voiceURI;
};

export const setNarratorPersona = (persona: NarratorPersona) => {
    currentPersona = persona;
};

export const speakHebrew = (text: string) => {
  if (isMuted || voiceVolume <= 0.05 || typeof window === 'undefined' || !window.speechSynthesis) return;

  // Cancel previous speech to prevent overlapping
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.volume = voiceVolume; 

  // Apply Persona Settings
  switch (currentPersona) {
      case 'zen':
          utterance.rate = 0.85; // Slower, calmer
          utterance.pitch = 0.9; // Slightly deeper
          break;
      case 'grandfather':
          utterance.rate = 0.8;  // Slow
          utterance.pitch = 0.7; // Deep
          break;
      case 'energetic':
          utterance.rate = 1.1;  // Faster
          utterance.pitch = 1.1; // Higher
          break;
      case 'standard':
      default:
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          break;
  }

  // Apply Voice Selection
  const voices = window.speechSynthesis.getVoices();
  let selectedVoice = null;

  if (currentVoiceURI) {
      selectedVoice = voices.find(v => v.voiceURI === currentVoiceURI);
  }
  
  // Fallback to any Hebrew voice if specific one not found/set
  if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.includes('he'));
  }

  if (selectedVoice) {
    utterance.voice = selectedVoice;
    utterance.lang = selectedVoice.lang;
  } else {
    // OS default fallback
    utterance.lang = 'he-IL';
  }

  window.speechSynthesis.speak(utterance);
};

// --- PROCEDURAL NATURE ENGINE (Ocean, Birds, Rain) ---

const createPinkNoise = (ctx: AudioContext) => {
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
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
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11; 
        b6 = white * 0.115926;
    }
    return noiseBuffer;
};

const playBirdChirp = (ctx: AudioContext, dest: AudioNode) => {
    if (isMuted) return;
    
    const t = ctx.currentTime;
    const startFreq = 2000 + Math.random() * 1500;
    const duration = 0.1 + Math.random() * 0.05;
    
    const count = Math.floor(Math.random() * 2) + 2;
    
    for(let i = 0; i < count; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(dest);
        
        const startTime = t + (i * (duration + 0.05));
        
        osc.frequency.setValueAtTime(startFreq, startTime);
        osc.frequency.exponentialRampToValueAtTime(startFreq * 0.6, startTime + duration);
        
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.1, startTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        osc.start(startTime);
        osc.stop(startTime + duration + 0.05);
    }
};

export const startAmbientMusic = () => {
    try {
        const { ctx, music } = initAudio();
        if (!ctx || !music || ambientNodes.length > 0) return;

        const t = ctx.currentTime;
        const noiseBuffer = createPinkNoise(ctx);

        const waveSrc = ctx.createBufferSource();
        waveSrc.buffer = noiseBuffer;
        waveSrc.loop = true;

        const waveFilter = ctx.createBiquadFilter();
        waveFilter.type = 'lowpass';
        waveFilter.frequency.value = 400; 
        
        const waveGain = ctx.createGain();
        waveGain.gain.value = 0.2; 

        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.1; 
        
        const lfoFilterGain = ctx.createGain();
        lfoFilterGain.gain.value = 600; 
        
        const lfoVolGain = ctx.createGain();
        lfoVolGain.gain.value = 0.15; 
        
        lfo.connect(lfoFilterGain);
        lfoFilterGain.connect(waveFilter.frequency);
        
        lfo.connect(lfoVolGain);
        lfoVolGain.connect(waveGain.gain);

        waveSrc.connect(waveFilter);
        waveFilter.connect(waveGain);
        waveGain.connect(music);

        waveSrc.start(t);
        lfo.start(t);
        ambientNodes.push(waveSrc, waveFilter, waveGain, lfo, lfoFilterGain, lfoVolGain);

        const rainSrc = ctx.createBufferSource();
        rainSrc.buffer = noiseBuffer;
        rainSrc.loop = true;
        
        const rainFilter = ctx.createBiquadFilter();
        rainFilter.type = 'highpass'; 
        rainFilter.frequency.value = 800; 

        rainGainNode = ctx.createGain();
        rainGainNode.gain.value = 0; 
        
        rainSrc.connect(rainFilter);
        rainFilter.connect(rainGainNode);
        rainGainNode.connect(music);
        
        rainSrc.start(t);
        ambientNodes.push(rainSrc, rainFilter, rainGainNode);

        let isRaining = false;
        
        ambientInterval = setInterval(() => {
             const rainChance = isRaining ? 0.2 : 0.1;
             if (Math.random() < rainChance) {
                 isRaining = !isRaining;
                 const now = ctx.currentTime;
                 const targetVol = isRaining ? 0.08 : 0;
                 rainGainNode?.gain.setTargetAtTime(targetVol, now, 2);
             }

             const birdChance = isRaining ? 0.1 : 0.4;
             if (Math.random() < birdChance) {
                 playBirdChirp(ctx, music);
             }

        }, 3000); 

    } catch (e) {
        console.warn("Ambient music failed", e);
    }
};

export const stopAmbientMusic = () => {
    ambientNodes.forEach(node => {
        try {
            if (node.stop) node.stop();
            node.disconnect();
        } catch(e) {}
    });
    ambientNodes = [];
    if (ambientInterval) clearInterval(ambientInterval);
};

const playTone = (ctx: AudioContext, dest: AudioNode, freq: number, type: OscillatorType, duration: number, vol: number = 0.5) => {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(dest);
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    
    osc.start(t);
    osc.stop(t + duration + 0.05);
};

const playNoiseBurst = (ctx: AudioContext, dest: AudioNode, duration: number, vol: number = 0.5) => {
    const t = ctx.currentTime;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;

    src.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    
    src.start(t);
};

const playSelectVariant = (ctx: AudioContext, dest: AudioNode) => {
    const r = Math.random();
    if (r < 0.25) {
        playTone(ctx, dest, 800 + Math.random() * 100, 'triangle', 0.05, 0.1);
    } else if (r < 0.5) {
        playTone(ctx, dest, 300 + Math.random() * 50, 'sine', 0.1, 0.3);
    } else if (r < 0.75) {
        playTone(ctx, dest, 1200, 'sine', 0.03, 0.05);
    } else {
        playNoiseBurst(ctx, dest, 0.08, 0.2);
    }
};

const playMatchVariant = (ctx: AudioContext, dest: AudioNode) => {
    const r = Math.random();
    const t = ctx.currentTime;

    if (r < 0.2) {
        playTone(ctx, dest, 400, 'sine', 0.1, 0.3); 
        setTimeout(() => playTone(ctx, dest, 1200, 'sine', 0.2, 0.1), 50); 
    } 
    else if (r < 0.4) {
        playTone(ctx, dest, 523.25, 'triangle', 0.4, 0.1); 
        setTimeout(() => playTone(ctx, dest, 659.25, 'triangle', 0.4, 0.1), 50); 
        setTimeout(() => playTone(ctx, dest, 783.99, 'triangle', 0.4, 0.1), 100); 
    } 
    else if (r < 0.6) {
        playTone(ctx, dest, 1100, 'sine', 1.5, 0.15);
        playTone(ctx, dest, 3300, 'sine', 0.8, 0.02);
    } 
    else if (r < 0.8) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(dest);
        
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(1200, t + 0.15); 
        
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        
        osc.start(t);
        osc.stop(t + 0.15);
    } 
    else {
        for(let i = 0; i < 5; i++) {
             setTimeout(() => {
                 playTone(ctx, dest, 1000 + (i * 300), 'sine', 0.1, 0.05);
             }, i * 30);
        }
    }
};

export const playSound = (type: 'hover' | 'select' | 'match' | 'shuffle' | 'undo' | 'win' | 'hint') => {
  if (isMuted) return;

  try {
    const { ctx, master } = initAudio();
    if (!ctx || !master) return;

    if (type === 'hover') {
        playTone(ctx, master, 800, 'sine', 0.03, 0.02);
    } 
    else if (type === 'select') {
        playSelectVariant(ctx, master);
    }
    else if (type === 'match') {
        playMatchVariant(ctx, master);
    }
    else if (type === 'win') {
         const count = 12;
         const t = ctx.currentTime;
         for(let i=0; i<count; i++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(master);

            osc.type = 'triangle';
            const freq = 261.63 * Math.pow(1.05946, i * 2); 
            
            const start = t + (i * 0.1);
            osc.frequency.value = freq;
            
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.15, start + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6);
            
            osc.start(start);
            osc.stop(start + 0.6);
         }
    }
    else if (type === 'shuffle') {
        const t = ctx.currentTime;
        for(let i=0; i<6; i++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(master);
            
            const start = t + (i * 0.04);
            osc.frequency.setValueAtTime(300 + Math.random()*200, start);
            gain.gain.setValueAtTime(0.3, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.03);
            
            osc.start(start);
            osc.stop(start + 0.03);
        }
    }
    else if (type === 'hint' || type === 'undo') {
        playTone(ctx, master, type === 'hint' ? 880 : 300, 'sine', 0.2, 0.2);
    }

  } catch (e) {
    console.warn("Audio playback failed", e);
  }
};
