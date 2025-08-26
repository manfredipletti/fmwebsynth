import * as Tone from 'tone';
import AudioKeys from 'audiokeys';
import { OscillatorModel } from '../models/OscillatorModel.js';
import { OscillatorView } from '../views/OscillatorView.js';
import { ModulationMatrixView } from '../views/ModulationMatrixView.js';

export class SynthController {
    constructor() {
        this.oscillators = [];
        this.oscillatorViews = [];
        this.modulationMatrixView = null;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        try {
            await this.initTone();

            this.createOscillators();
            this.initUI();
            this.initKeyboard();
            this.initModulationMatrix();

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

    initModulationMatrix() {
        this.modulationMatrixView = new ModulationMatrixView(this);
        console.log('Modulation Matrix initialized');
    }

    getOutputVolume(oscillatorId) {
        if (this.modulationMatrixView) {
            const outputValues = this.modulationMatrixView.getOutputValues();
            return (outputValues[oscillatorId] || 0) / 100; 
        }
        return 1.0; 
    }

    updateOutputVolume(oscillatorId, newVolume) {
        const oscillator = this.getOscillator(oscillatorId);
        if (oscillator) {
            for (const [note, voice] of oscillator.voices) {
                if (voice.gainNode) {
                    const currentGain = voice.gainNode.gain.value;
                    const baseGain = currentGain / (this.getOutputVolume(oscillatorId) || 0.01); 
                    voice.gainNode.gain.value = baseGain * newVolume;
                }
            }
            console.log(`Updated output volume for oscillator ${oscillatorId}: ${Math.round(newVolume * 100)}%`);
        }
    }

    createFMConnections(note) {
        if (!this.modulationMatrixView) return;

        const modulationValues = this.modulationMatrixView.getModulationValues();
        
        
        for (let modulatorId = 0; modulatorId < 8; modulatorId++) {
            const modulator = this.getOscillator(modulatorId);
            if (!modulator || !modulator.isActive) continue;
            
            for (let carrierId = 0; carrierId < 8; carrierId++) {
                const modulationValue = modulationValues[modulatorId] && modulationValues[modulatorId][carrierId] || 0;
                if (modulationValue > 0) {
                    const carrier = this.getOscillator(carrierId);
                    if (!carrier || !carrier.isActive) continue;
                    const carrierOsc = carrier.voices.get(note).toneOsc;
                    if (carrierId != modulatorId) {
                        
                        const modulatorEnvelope = this.getOscillator(modulatorId).voices.get(note).envelope;
                        const modulationGain = new this.Tone.Gain(modulationValue * 100);
                        modulatorEnvelope.connect(modulationGain);
                        modulationGain.connect(carrierOsc.frequency);
                    } else {
                        const selfModulationOsc = new this.Tone.Oscillator(carrierOsc.frequency.value, carrierOsc.waveform);
                        const selfModulationEnvelope = new this.Tone.AmplitudeEnvelope({
                            attack: carrier.voices.get(note).envelope.attack,
                            decay: carrier.voices.get(note).envelope.decay,
                            sustain: carrier.voices.get(note).envelope.sustain,
                            release: carrier.voices.get(note).envelope.release
                        });
                        const selfModulationGain = new this.Tone.Gain(modulationValue * 100);
                        selfModulationOsc.connect(selfModulationEnvelope);
                        selfModulationEnvelope.connect(selfModulationGain);
                        selfModulationGain.connect(carrierOsc.frequency);
                        carrier.addSelfModulation(note, selfModulationOsc, selfModulationEnvelope, selfModulationGain);
                    }    
                    console.log(`FM Connection: OSC ${modulatorId} -> OSC ${carrierId} (${modulationValue}%)`);
                }
            }
        }
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
                // Force immediate disposal when turning off oscillator
                oscillator.forceDisposeAllVoices();
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
        this.playOscillators(note, frequency, normalizedVelocity);
        
        
        console.log(`Note On: ${note} (${frequency.toFixed(2)} Hz), Velocity: ${normalizedVelocity}, Active OSC: ${this.activeOscillatorId}`);
    }

    noteOff(note) {
        for (const oscillator of this.oscillators) {
            oscillator.removeVoice(note);
        }
        console.log(`Note Off: ${note}`);
    }

    playOscillators(note, frequency, velocity) {

        try {
            for (const osc of this.oscillators) {
                osc.removeVoice(note);
                if (osc.isActive) {
                    const realFrequency = frequency * osc.ratio;
                    const toneOsc = new this.Tone.Oscillator(realFrequency, osc.waveform);
                    const envelope = new this.Tone.AmplitudeEnvelope({
                        attack: osc.attack,
                        decay: osc.decay,
                        sustain: osc.sustain,
                        release: osc.release
                    });
                    const gainNode = new this.Tone.Gain(velocity * this.getOutputVolume(osc.id));
                    toneOsc.connect(envelope);
                    envelope.connect(gainNode);
                    gainNode.connect(this.Tone.context.destination);

                    osc.addVoice(note, toneOsc, envelope, gainNode);
                }
            }
            
            // STEP 2: Creare le connessioni FM dalla modulation matrix
            this.createFMConnections(note);
            
            // STEP 2: Suonare gli oscillatori attivi
            for (const osc of this.oscillators) {
                if (osc.isActive) {
                    osc.voices.get(note).toneOsc.start();
                    osc.voices.get(note).envelope.triggerAttack();
                    if (osc.selfModulations.has(note)) {
                        osc.selfModulations.get(note).selfModulationOsc.start();
                        osc.selfModulations.get(note).selfModulationEnvelope.triggerAttack();
                    }
                }
            }
            
        } catch (error) {
            console.error(`Failed to play oscillators:`, error);
        }
    }

    midiNoteToFrequency(note) {
        return 440 * Math.pow(2, (note - 69) / 12);
    }

    dispose() {
        console.log('Disposing all oscillators...');
        this.oscillators.forEach(oscillator => {
            oscillator.forceDisposeAllVoices();
        });
    }
}