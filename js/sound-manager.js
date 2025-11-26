class SoundManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.buffers = {};
        this.isInitialized = false;
        this.isMuted = false;
        this.baseVolume = 0.5;
        
        // Background music
        this.backgroundMusic = null;
        this.currentMusicStage = null;
        this.musicVolume = 0.3;
    }

    async initialize() {
        if (this.isInitialized) {
            this.resume();
            return;
        }

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.baseVolume;
            this.masterGain.connect(this.audioContext.destination);

            this.createBuffers();
            this.isInitialized = true;
        } catch (error) {
            console.warn('SoundManager initialization failed:', error);
        }
    }

    createBuffers() {
        this.buffers.crow = this.createCrowCall();
        this.buffers.crash = this.createCrashSound();
        this.buffers.thunder = this.createThunderSound();
        this.buffers.collectStar = this.createCollectStar();
        this.buffers.collectFuel = this.createCollectFuel();
        this.buffers.heat = this.createHeatBurst();
        this.buffers.ui = this.createUiClick();
        this.buffers.victory = this.createVictoryJingle();
        this.buffers.fail = this.createFailTone();
    }

    createCrowCall() {
        const duration = 0.6;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const envelope = Math.min(1, t * 6) * Math.exp(-t * 5);
            const vibrato = Math.sin(t * 18) * 90;
            const baseFreq = 650 + vibrato;
            let sample = 0;
            sample += Math.sin(2 * Math.PI * baseFreq * t) * 0.6;
            sample += Math.sin(2 * Math.PI * baseFreq * 1.5 * t) * 0.3;
            sample += Math.sin(2 * Math.PI * baseFreq * 0.5 * t) * 0.2;
            sample += (Math.random() - 0.5) * 0.2;
            data[i] = Math.tanh(sample * envelope) * 0.8;
        }

        return buffer;
    }

    createCrashSound() {
        const duration = 0.5;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 7);
            const noise = (Math.random() * 2 - 1) * 0.5;
            const rumble = Math.sin(2 * Math.PI * 120 * t) * 0.4;
            data[i] = (noise + rumble) * envelope;
        }

        return buffer;
    }

    createThunderSound() {
        const duration = 1.2;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 2);
            const rumble = Math.sin(2 * Math.PI * 60 * t) * 0.5;
            const crackle = (Math.random() * 2 - 1) * (t < 0.3 ? 0.6 : 0.2);
            data[i] = (rumble + crackle) * envelope;
        }

        return buffer;
    }

    createCollectStar() {
        const duration = 0.35;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const freq = 700 + t * 600;
            const envelope = Math.exp(-t * 4);
            data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.6;
        }

        return buffer;
    }

    createCollectFuel() {
        const duration = 0.3;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const freq = 400 + Math.sin(t * 8) * 40;
            const envelope = Math.exp(-t * 3);
            data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.5;
        }

        return buffer;
    }

    createHeatBurst() {
        const duration = 0.25;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 6);
            const noise = (Math.random() * 2 - 1) * envelope * 0.6;
            data[i] = noise;
        }

        return buffer;
    }

    createUiClick() {
        const duration = 0.1;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 12);
            const freq = 1000;
            data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.4;
        }

        return buffer;
    }

    createVictoryJingle() {
        const duration = 0.8;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        const notes = [523, 659, 784, 1046];
        const noteDuration = duration / notes.length;

        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const noteIndex = Math.floor(t / noteDuration);
            const freq = notes[Math.min(noteIndex, notes.length - 1)];
            const localTime = t % noteDuration;
            const envelope = Math.exp(-localTime * 4);
            data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.5;
        }

        return buffer;
    }

    createFailTone() {
        const duration = 0.5;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const startFreq = 300;
            const endFreq = 120;
            const freq = startFreq + (endFreq - startFreq) * (t / duration);
            const envelope = Math.exp(-t * 4);
            data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.6;
        }

        return buffer;
    }

    play(effect, options = {}) {
        if (!this.isInitialized || this.isMuted) return;
        const buffer = this.buffers[effect];
        if (!buffer) return;

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = options.pitch || 1;

        const gainNode = this.audioContext.createGain();
        const volume = options.volume !== undefined ? options.volume : 1;
        gainNode.gain.value = volume;

        source.connect(gainNode);
        gainNode.connect(this.masterGain);
        source.start();
    }

    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        this.masterGain.gain.value = this.isMuted ? 0 : this.baseVolume;
        this.updateMusicVolume();
        return this.isMuted;
    }

    setMuted(muted) {
        this.isMuted = muted;
        this.masterGain.gain.value = this.isMuted ? 0 : this.baseVolume;
        this.updateMusicVolume();
    }

    // Background music
    playBackgroundMusic(stage) {
        // If same stage, no need to change music
        if (this.currentMusicStage === stage && this.backgroundMusic && !this.backgroundMusic.paused) {
            return;
        }

        // Stop previous music
        this.stopBackgroundMusic();

        // Play new music
        const musicFiles = {
            1: 'music/lvl1.mp3',
            2: 'music/lvl2.mp3',
            3: 'music/lvl3.mp3',
            4: 'music/lvl4.mp3'
        };

        const musicFile = musicFiles[stage];
        if (!musicFile) return;

        try {
            this.backgroundMusic = new Audio(musicFile);
            this.backgroundMusic.loop = true;
            this.backgroundMusic.volume = this.isMuted ? 0 : this.musicVolume;
            
            this.backgroundMusic.play().catch(error => {
                console.warn('Background music play failed:', error);
            });
            
            this.currentMusicStage = stage;
        } catch (error) {
            console.warn('Background music load failed:', error);
        }
    }

    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
            this.backgroundMusic = null;
            this.currentMusicStage = null;
        }
    }

    updateMusicVolume() {
        if (this.backgroundMusic) {
            this.backgroundMusic.volume = this.isMuted ? 0 : this.musicVolume;
        }
    }
}

window.soundManager = new SoundManager();
