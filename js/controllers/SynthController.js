import * as Tone from 'tone';
import AudioKeys from 'audiokeys';
import { OscillatorModel } from '../models/OscillatorModel.js';
import { OscillatorView } from '../views/OscillatorView.js';

export class SynthController {
    constructor() {
        this.oscillators = [];
        this.oscillatorViews = [];
        this.isInitialized = false;
        this.init();
    }

    async init() {
        try {
            await this.initTone();

            this.createOscillators();
            this.initUI();
            this.initKeyboard();

            this.isInitialized = true;
            console.log('Synth Controller initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Synth Controller:', error);
        }
    }

    initKeyboard() {
        var keyboard = new AudioKeys({
            polyphony: 8,
            rows: 1,
            priority: 'last'
        });

        keyboard.down((note) => {
            this.noteOn(note.note, note.velocity);
        });

        keyboard.up((note) => {
            this.noteOff(note.note, note.velocity);
        });
    }

    createOscillators() {
        for (let i=0; i<8; i++) {
            const oscillatorModel = new OscillatorModel(i, 1.0);
            this.oscillators[i] = oscillatorModel;
        }
        console.log(`Created ${this.oscillators.length} oscillators`);
    }

    initUI() {
        const tabsContainer = document.getElementById('oscillators-tabs');
        const contentContainer = document.getElementById('oscillators-content');

        if (!tabsContainer || !contentContainer) {
            console.error('Oscillators containers not found');
            return;
        }

        this.oscillators.forEach((oscillator, index) => {
            const oscillatorView = new OscillatorView(this, index, tabsContainer, contentContainer, oscillator.isActive);
            this.oscillatorViews[index] = oscillatorView;
        });
        console.log('UI initialized with tab system');

    }

    async initTone() {
        try {

            this.Tone = Tone;
            
            console.log('Tone.js loaded, waiting for user interaction to start audio');
            console.log('Audio context state:', Tone.context.state);
            
        } catch (error) {
            console.error('Failed to initialize Tone.js:', error);
            throw error;
        }
    }

    getOscillator(id) {
        return this.oscillators[id];
    }
    

    getOscillators() {
        return this.oscillators;
    }

    setActiveOscillator(id) {
        this.activeOscillatorId = id;
        console.log(`Active oscillator changed to: ${id}`);
    }

    toggleOscillator(id) {
        const oscillator = this.getOscillator(id);
        if (oscillator) {
            oscillator.isActive = !oscillator.isActive;
            
            if (!oscillator.isActive) {
                oscillator.stopAllVoices();
            }
            
            const oscillatorView = this.oscillatorViews[id];
            if (oscillatorView) {
                oscillatorView.updateDisplay();
            }
            
            console.log(`Oscillator ${id} toggled: ${oscillator.isActive ? 'ON' : 'OFF'}`);
        }
    }

    setWaveform(id, waveform) {
        const oscillator = this.getOscillator(id);
        if (oscillator) {
            oscillator.waveform = waveform;
            
            const oscillatorView = this.oscillatorViews[id];
            if (oscillatorView) {
                oscillatorView.updateDisplay();
            }
            
            console.log(`Oscillator ${id} waveform changed to: ${waveform}`);
        }
    }

    setRatio(id, ratio) {
        const oscillator = this.getOscillator(id);
        if (oscillator && ratio >= 0.1 && ratio <= 64.0) {
            oscillator.ratio = ratio;
            
            const oscillatorView = this.oscillatorViews[id];
            if (oscillatorView) {
                oscillatorView.updateDisplay();
            }
            
            console.log(`Oscillator ${id} ratio changed to: ${ratio}`);
        }
    }

    setAttack(id, attack) {
        const oscillator = this.getOscillator(id);
        if (oscillator && attack >= 0.001 && attack <= 2.0) {
            oscillator.attack = attack;
            
            const oscillatorView = this.oscillatorViews[id];
            if (oscillatorView) {
                oscillatorView.updateDisplay();
            }
            
            console.log(`Oscillator ${id} attack changed to: ${attack}s`);
        }
    }

    setDecay(id, decay) {
        const oscillator = this.getOscillator(id);
        if (oscillator && decay >= 0.001 && decay <= 2.0) {
            oscillator.decay = decay;
            
            const oscillatorView = this.oscillatorViews[id];
            if (oscillatorView) {
                oscillatorView.updateDisplay();
            }
            
            console.log(`Oscillator ${id} decay changed to: ${decay}s`);
        }
    }

    setSustain(id, sustain) {
        const oscillator = this.getOscillator(id);
        if (oscillator && sustain >= 0.0 && sustain <= 1.0) {
            oscillator.sustain = sustain;
            
            const oscillatorView = this.oscillatorViews[id];
            if (oscillatorView) {
                oscillatorView.updateDisplay();
            }
            
            console.log(`Oscillator ${id} sustain changed to: ${sustain}`);
        }
    }

    setRelease(id, release) {
        const oscillator = this.getOscillator(id);
        if (oscillator && release >= 0.001 && release <= 2.0) {
            oscillator.release = release;
            
            const oscillatorView = this.oscillatorViews[id];
            if (oscillatorView) {
                oscillatorView.updateDisplay();
            }
            
            console.log(`Oscillator ${id} release changed to: ${release}s`);
        }
    }

    noteOn(note, velocity) {
        const frequency = this.midiNoteToFrequency(note);
        const normalizedVelocity = velocity / 127;
        
        for (const osc of this.oscillators) {
            if (osc.isActive)
            this.playOscillator(osc, note, frequency, normalizedVelocity);
        }
        
        console.log(`Note On: ${note} (${frequency.toFixed(2)} Hz), Velocity: ${normalizedVelocity}, Active OSC: ${this.activeOscillatorId}`);
    }

    noteOff(note) {
        for (const oscillator of this.oscillators) {
            if (oscillator.isActive) {
                oscillator.removeVoice(note);
            }
        }
        console.log(`Note Off: ${note}`);
    }

    playOscillator(oscillator, note, frequency, velocity) {

        try {
            oscillator.removeVoice(note);
            const realFrequency = frequency * oscillator.ratio;
            const toneOsc = new this.Tone.Oscillator(realFrequency, oscillator.waveform);
            const envelope = new this.Tone.AmplitudeEnvelope({
                attack: oscillator.attack,
                decay: oscillator.decay,
                sustain: oscillator.sustain,
                release: oscillator.release
            });
            
            const gainNode = new this.Tone.Gain(0.5 * velocity);
            toneOsc.connect(envelope);
            envelope.connect(gainNode);
            gainNode.connect(this.Tone.context.destination);
        
        
            toneOsc.start();
            envelope.triggerAttack();
            
            oscillator.addVoice(note, toneOsc, envelope, gainNode);
            
            console.log(`Oscillator ${oscillator.id} started: ${frequency}Hz, ${oscillator.waveform}`);
            
        } catch (error) {
            console.error(`Failed to play oscillator ${oscillator.id}:`, error);
        }
    }

    midiNoteToFrequency(note) {
        return 440 * Math.pow(2, (note - 69) / 12);
    }
}