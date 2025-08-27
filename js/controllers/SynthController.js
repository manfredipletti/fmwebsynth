import * as Tone from 'tone';
import AudioKeys from 'audiokeys';
import { OscillatorModel } from '../models/OscillatorModel.js';
import { OscillatorView } from '../views/OscillatorView.js';
import { ModulationMatrixView } from '../views/ModulationMatrixView.js';
import { FilterModel } from '../models/FilterModel.js';
import { FilterView } from '../views/FilterView.js';
import { PitchEnvelopeModel } from '../models/PitchEnvelopeModel.js';
import { PitchEnvelopeView } from '../views/PitchEnvelopeView.js';

export class SynthController {
    constructor() {
        this.oscillators = [];
        this.oscillatorViews = [];
        this.modulationMatrixView = null;
        this.filterModel = null;
        this.filterView = null;
        this.globalFilter = null;
        this.pitchEnvelopeModel = null;
        this.pitchEnvelopeView = null;
        this.isInitialized = false;
        this.masterVolume = 0.7; 
        this.masterGainNode = null;
        this.masterMeter = null;
        this.init();
    }

    async init() {
        try {
            await this.initTone();

            this.createOscillators();
            this.initUI();
            this.initKeyboard();
            this.initModulationMatrix();
            this.initFilter();
            this.initPitchEnvelope();

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

    initFilter() {
        this.filterModel = new FilterModel();
        this.filterView = new FilterView(this);
        

        this.globalFilter = new this.Tone.Filter({
            type: this.filterModel.type,
            frequency: this.filterModel.frequency,
            Q: this.filterModel.resonance,
            rolloff: this.filterModel.rolloff
        });
        

        this.masterGainNode.disconnect();
        this.masterGainNode.connect(this.globalFilter);
        this.globalFilter.connect(this.masterMeter);
        this.globalFilter.connect(this.Tone.context.destination);
        
        console.log('Filter initialized and connected to audio chain');
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
                         selfModulationOsc.phase = carrier.getInitialPhase();
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
            const isInitiallySelected = (index === 0);
            const oscillatorView = new OscillatorView(this, index, tabsContainer, contentContainer, isInitiallySelected);
            this.oscillatorViews[index] = oscillatorView;
        });
        console.log('UI initialized with tab system');

    }

    async initTone() {
        try {

            this.Tone = Tone;
            this.masterGainNode = new this.Tone.Gain(this.masterVolume * 0.1);
            this.masterMeter = new this.Tone.Meter();
            

            this.masterGainNode.connect(this.masterMeter);
            this.masterGainNode.connect(this.Tone.context.destination);
            
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

    setPhase(id, phase) {
        const oscillator = this.getOscillator(id);
        if (oscillator) {
            oscillator.phase = Math.max(0, Math.min(1, phase));
            
            const oscillatorView = this.oscillatorViews[id];
            if (oscillatorView) {
                oscillatorView.updateDisplay();
            }
            
            console.log(`Oscillator ${id} phase changed to: ${phase}`);
        }
    }

    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGainNode) {
            this.masterGainNode.gain.value = this.masterVolume * 0.1; 
        }
        console.log(`Master volume changed to: ${Math.round(this.masterVolume * 100)}%`);
    }

    getMasterVolume() {
        return this.masterVolume;
    }


    setFilterType(type) {
        if (this.filterModel && this.globalFilter) {
            if (this.filterModel.setType(type)) {
                this.globalFilter.type = type;
                console.log(`Filter type changed to: ${type}`);
            }
        }
    }

    setFilterFrequency(frequency) {
        if (this.filterModel && this.globalFilter) {
            const clampedFrequency = this.filterModel.setFrequency(frequency);
            this.globalFilter.frequency.value = clampedFrequency;
            console.log(`Filter frequency changed to: ${clampedFrequency} Hz`);
        }
    }

    setFilterResonance(resonance) {
        if (this.filterModel && this.globalFilter) {
            const clampedResonance = this.filterModel.setResonance(resonance);
            this.globalFilter.Q.value = clampedResonance;
            console.log(`Filter resonance changed to: ${clampedResonance}`);
        }
    }

    setFilterRolloff(rolloff) {
        if (this.filterModel && this.globalFilter) {
            if (this.filterModel.setRolloff(rolloff)) {
                this.globalFilter.rolloff = rolloff;
                console.log(`Filter rolloff changed to: ${rolloff} dB/oct`);
            }
        }
    }

    getFilterSettings() {
        return this.filterModel ? this.filterModel.getSettings() : null;
    }

    getMeterLevel() {
        if (this.masterMeter) {

            const dbValue = this.masterMeter.getValue();

            const linearValue = Math.max(0, Math.min(1, (dbValue + 60) / 60));
            return linearValue;
        }
        return 0;
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
                     const initialPhase = osc.getInitialPhase();
                     const toneOsc = new this.Tone.Oscillator(realFrequency, osc.waveform);
                     toneOsc.phase = initialPhase;
                    const envelope = new this.Tone.AmplitudeEnvelope({
                        attack: osc.attack,
                        decay: osc.decay,
                        sustain: osc.sustain,
                        release: osc.release
                    });
                                         const gainNode = new this.Tone.Gain(velocity * this.getOutputVolume(osc.id));
                     toneOsc.connect(envelope);
                     envelope.connect(gainNode);
                     gainNode.connect(this.masterGainNode);

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

    initPitchEnvelope() {
        this.pitchEnvelopeModel = new PitchEnvelopeModel();
        this.pitchEnvelopeView = new PitchEnvelopeView(this.pitchEnvelopeModel, this);
        console.log('Pitch envelope initialized');
    }

    getPitchEnvelopeSettings() {
        return this.pitchEnvelopeModel ? this.pitchEnvelopeModel.getSettings() : null;
    }

    setPitchEnvelopeAttack(attack) {
        if (this.pitchEnvelopeModel) {
            this.pitchEnvelopeModel.setAttack(attack);
        }
    }

    setPitchEnvelopeDecay(decay) {
        if (this.pitchEnvelopeModel) {
            this.pitchEnvelopeModel.setDecay(decay);
        }
    }

    setPitchEnvelopeSustain(sustain) {
        if (this.pitchEnvelopeModel) {
            this.pitchEnvelopeModel.setSustain(sustain);
        }
    }

    setPitchEnvelopeRelease(release) {
        if (this.pitchEnvelopeModel) {
            this.pitchEnvelopeModel.setRelease(release);
        }
    }

    setPitchEnvelopeAmount(amount) {
        if (this.pitchEnvelopeModel) {
            this.pitchEnvelopeModel.setAmount(amount);
        }
    }

    setPitchEnvelopeEnabled(enabled) {
        if (this.pitchEnvelopeModel) {
            this.pitchEnvelopeModel.setIsEnabled(enabled);
        }
    }

    dispose() {
        console.log('Disposing all oscillators...');
        this.oscillators.forEach(oscillator => {
            oscillator.forceDisposeAllVoices();
        });
    }
}