export class OscillatorModel {
    constructor(id, ratio = 1.0) {
        this.id = id;
        this.ratio = ratio;
        this.waveform = 'sine';
        this.isActive = true;
        this.attack = 0.1;
        this.decay = 0.2;
        this.sustain = 0.7;
        this.release = 0.3;
        this.phase = 0; // 0 = sempre stessa fase, 1 = fase random
        this.onChangeCallbacks = [];
        this.voices = new Map();
        this.selfModulations = new Map();
        this.maxVoices = 8;
    }

    getInitialPhase() {
        if (this.phase === 0) {
            return 0; // Sempre stessa fase (0)
        } else if (this.phase === 1) {
            return Math.random() * 360; // Fase random (0-360 gradi)
        } else {
            // Fase fissa personalizzata (0-360 gradi)
            return this.phase * 360;
        }
    }

    addVoice(note, toneOsc, envelope, gainNode) {
        if (this.voices.size >= this.maxVoices) {
            const oldestNote = this.voices.keys().next().value;
            this.removeVoice(oldestNote);
        }
        this.voices.set(note, {toneOsc, envelope, gainNode});
    }

    addSelfModulation(note, selfModulationOsc, selfModulationEnvelope, selfModulationGain) {
        if (this.selfModulations.size >= this.maxVoices) {
            const oldestNote = this.selfModulations.keys().next().value;
            this.removeSelfModulation(oldestNote);
        }
        this.selfModulations.set(note, {selfModulationOsc, selfModulationEnvelope, selfModulationGain});
    }

    removeSelfModulation(note) {
        const selfModulation = this.selfModulations.get(note);
        if (selfModulation) {
            selfModulation.envelope.triggerRelease();
            // Schedule disposal after release time
            const releaseTime = selfModulation.envelope.release;
            setTimeout(() => {
                this.disposeSelfModulation(selfModulation);
            }, releaseTime * 1000 + 100); // Add 100ms buffer
            this.selfModulations.delete(note);
        }
    }

    disposeSelfModulation(selfModulation) {
        if (selfModulation.selfModulationOsc) {
            selfModulation.selfModulationOsc.stop();
            selfModulation.selfModulationOsc.dispose();
        }
        if (selfModulation.selfModulationEnvelope) {
            selfModulation.selfModulationEnvelope.dispose();
        }
        if (selfModulation.selfModulationGain) {
            selfModulation.selfModulationGain.dispose();
        }
    }

    removeVoice(note) {
        const voice = this.voices.get(note);
        if (voice) {

            voice.envelope.triggerRelease();
            
     
            const releaseTime = voice.envelope.release;
            setTimeout(() => {
                this.disposeVoice(voice);
            }, releaseTime * 1000 + 100); 
            
            this.voices.delete(note);
        }
    }

    disposeVoice(voice) {
        try {
            if (voice.toneOsc) {
                voice.toneOsc.stop();
                voice.toneOsc.dispose();
            }
            if (voice.envelope) {
                voice.envelope.dispose();
            }
            if (voice.gainNode) {
                voice.gainNode.dispose();
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