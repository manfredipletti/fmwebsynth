export class OscillatorModel {
    constructor(id, ratio = 1.0) {
        this.id = id;
        this.ratio = ratio;
        this.waveform = 'sine';
        this.isActive = id === 0;
        this.attack = 0.1;
        this.decay = 0.2;
        this.sustain = 0.7;
        this.release = 0.3;
        this.onChangeCallbacks = [];
        this.voices = new Map();
        this.maxVoices = 8;
    }

    addVoice(note, toneOsc, envelope, gainNode) {
        if (this.voices.size >= this.maxVoices) {
            constoldestNote = this.voices.keys().next().value;
            this.removeVoice(oldestNote);

        }
        this.voices.set(note, {toneOsc, envelope, gainNode});
    }

    removeVoice(note) {
        const voice = this.voices.get(note);
        if (voice) {
            voice.envelope.triggerRelease();
            this.voices.delete(note);
        }
    }

    stopAllVoices() {
        for (const [note, voice] of this.voices) {
            voice.envelope.triggerRelease();
        }
        this.voices.clear();
    }

}