export class OscillatorModel {
    constructor(id, ratio = 1.0) {
        this.id = id;
        this.ratio = ratio;
        this.waveform = 'sine';
        this.isActive = true;
        this.attack = 0.0;
        this.decay = 0.2;
        this.sustain = 0.7;
        this.release = 0.3;
        this.phase = 0; 
        this.onChangeCallbacks = [];
        this.voices = new Map();
        this.selfModulations = new Map();
        this.maxVoices = 8;
    }

    getInitialPhase() {
        if (this.phase === 0) {
            return 0;
        } else if (this.phase === 1) {
            return Math.random() * 360;
        } else {
            return this.phase * 360;
        }
    }

    addVoice(note, toneOsc, envelopes, gainNodes, filter) {
        if (this.voices.size >= this.maxVoices) {
            const oldestNote = this.voices.keys().next().value;
            this.removeVoice(oldestNote);
        }


            this.voices.set(note, {toneOsc: toneOsc, envelope: envelopes, gainNode: gainNodes, filter: filter});

    }

    addSelfModulation(note, delay, selfModulationGain) {
        if (this.selfModulations.size >= this.maxVoices) {
            const oldestNote = this.selfModulations.keys().next().value;
            this.removeSelfModulation(oldestNote);
        }
        this.selfModulations.set(note, {delay, selfModulationGain});
    }

    removeSelfModulation(note) {
        const selfModulation = this.selfModulations.get(note);
        if (selfModulation) {
            this.disposeSelfModulation(selfModulation);
            this.selfModulations.delete(note);
        }
    }

    disposeSelfModulation(selfModulation) {
        if (selfModulation.delay) {
            selfModulation.delay.dispose();
        }
        if (selfModulation.selfModulationGain) {
            selfModulation.selfModulationGain.dispose();
        }
    }

    removeVoice(note) {
        const voice = this.voices.get(note);
        if (voice) {
    
            if (Array.isArray(voice.envelope)) {
      
                voice.envelope.forEach(env => {

                    env.triggerRelease();
                });
                const releaseTime = voice.envelope[0].release;
                setTimeout(() => {
                    this.disposeVoice(voice);
                }, releaseTime * 1000 + 100);
            } else {
   
                voice.envelope.triggerRelease();
                const releaseTime = voice.envelope.release;
                setTimeout(() => {
                    this.disposeVoice(voice);
                }, releaseTime * 1000 + 100);
            }
            
            this.voices.delete(note);
        }
    }

    disposeVoice(voice) {
        try {
                if (voice.toneOsc) {
                    voice.toneOsc.stop();
                    voice.toneOsc.dispose();
                }
                if (Array.isArray(voice.envelope)) {
                    voice.envelope.forEach(env => {
                        env.dispose();
                    })
                } else {
                    voice.envelope.dispose();
                }
                if (Array.isArray(voice.gainNode)) {
                    voice.gainNode.forEach(gain => {
                        gain.dispose();
                    })
                } else {
                    voice.gainNode.dispose();
                }
                if (voice.filter ) {
                    voice.filter.dispose();
                }
        } catch (error) {
            console.warn('Error disposing voice:', error);
        }
    }


    forceDisposeAllVoices() {
        for (const [note, voice] of this.voices) {
            this.disposeVoice(voice);
        }
        this.voices.clear();
    }

    stopAllVoices() {
        for (const [note, voice] of this.voices) {
            voice.envelope.triggerRelease();

            const releaseTime = voice.envelope.release;
            setTimeout(() => {
                this.disposeVoice(voice);
            }, releaseTime * 1000 + 100);
        }
        this.voices.clear();
    }

}