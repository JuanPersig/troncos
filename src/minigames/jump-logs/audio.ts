interface ExtendedWindow extends Window {
    webkitAudioContext?: typeof AudioContext;
}

export const JumpLogsAudio = {
    ctx: null as AudioContext | null,
    bufferCache: {} as Record<string, AudioBuffer>,
    
    init: () => {
        if (!JumpLogsAudio.ctx) {
            const Win = window as ExtendedWindow;
            JumpLogsAudio.ctx = new (window.AudioContext || Win.webkitAudioContext)();
        }
        if (JumpLogsAudio.ctx.state === 'suspended') {
            JumpLogsAudio.ctx.resume();
        }

        if (!JumpLogsAudio.bufferCache['step']) {
            JumpLogsAudio.bufferCache['step'] = JumpLogsAudio.createNoiseBuffer(0.04);
        }
        if (!JumpLogsAudio.bufferCache['hit']) {
            JumpLogsAudio.bufferCache['hit'] = JumpLogsAudio.createNoiseBuffer(0.3);
        }
    },

    createNoiseBuffer: (duration: number): AudioBuffer => {
        const ctx = JumpLogsAudio.ctx!;
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    },

    playJump: () => {
        const ctx = JumpLogsAudio.ctx;
        if (!ctx) return;
        
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(160, t);
        osc.frequency.exponentialRampToValueAtTime(680, t + 0.12);
        
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
        
        osc.start(t);
        osc.stop(t + 0.12);
    },

    playStep: () => {
        const ctx = JumpLogsAudio.ctx;
        if (!ctx || !JumpLogsAudio.bufferCache['step']) return;
        
        const t = ctx.currentTime;
        const noise = ctx.createBufferSource();
        noise.buffer = JumpLogsAudio.bufferCache['step'];
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, t);
        filter.frequency.exponentialRampToValueAtTime(100, t + 0.04);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.15, t); 
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.04);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        noise.start(t);
    },

    playHit: () => {
        const ctx = JumpLogsAudio.ctx;
        if (!ctx || !JumpLogsAudio.bufferCache['hit']) return;
        
        const t = ctx.currentTime;
        const noise = ctx.createBufferSource();
        noise.buffer = JumpLogsAudio.bufferCache['hit'];
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(400, t);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.linearRampToValueAtTime(40, t + 0.3);

        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.2, t);
        oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

        osc.connect(oscGain);
        oscGain.connect(ctx.destination);

        noise.start(t);
        osc.start(t);
        noise.stop(t + 0.3);
        osc.stop(t + 0.3);
    }
};
