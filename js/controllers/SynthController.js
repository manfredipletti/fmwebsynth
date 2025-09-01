import * as Tone from 'tone';
import AudioKeys from 'audiokeys';
import { OscillatorModel } from '../models/OscillatorModel.js';
import { OscillatorView } from '../views/OscillatorView.js';
import { ModulationMatrixView } from '../views/ModulationMatrixView.js';
import { FilterModel } from '../models/FilterModel.js';
import { FilterView } from '../views/FilterView.js';
import { PitchEnvelopeModel } from '../models/PitchEnvelopeModel.js';
import { PitchEnvelopeView } from '../views/PitchEnvelopeView.js';
import { FilterEnvelopeModel } from '../models/FilterEnvelopeModel.js';
import { FilterEnvelopeView } from '../views/FilterEnvelopeView.js';
import { DelayModel } from '../models/DelayModel.js';
import { DelayView } from '../views/DelayView.js';
import { ReverbModel } from '../models/ReverbModel.js';
import { ReverbView } from '../views/ReverbView.js';
import { CompressorModel } from '../models/CompressorModel.js';
import { CompressorView } from '../views/CompressorView.js';

export class SynthController {
    constructor() {
        this.oscillators = [];
        this.oscillatorViews = [];
        this.modulationMatrixView = null;
        this.filterModel = null;
        this.filterView = null;
        this.filterEnvelopeModel = null;
        this.filterEnvelopeView = null;
        this.pitchEnvelopeModel = null;
        this.pitchEnvelopeView = null;
        this.delayModel = null;
        this.delayView = null;
        this.globalDelay = null;
        this.reverbModel = null;
        this.reverbView = null;
        this.globalReverb = null;
        this.compressorModel = null;
        this.compressorView = null;
        this.globalCompressor = null;
        this.compressorUpdateTimeout = null;
        this.isInitialized = false;
        this.masterVolume = 0.7; 
        this.delayInputNode = null; 
        this.delayOutputNode = null;
        this.reverbInputNode = null;
        this.reverbOutputNode = null;
        this.compressorInputNode = null;
        this.compressorOutputNode = null;
        this.masterGainNode = null;
        this.masterMeter = null;
        this.midiAccess = null;
        this.midiInputs = [];
        this.init();
    }

    async init() {
        await this.initTone();
        this.createOscillators();
        this.initUI();
        this.initKeyboard();
        this.initMIDI();
        this.initModulationMatrix();
        this.initFilter();
        this.initPitchEnvelope();
        this.isInitialized = true;
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

    initMIDI() {
        if (navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess()
                .then(this.onMIDISuccess.bind(this), this.onMIDIError.bind(this));
        } else {
            this.updateMIDIStatus('Web MIDI API not supported');
        }
    }

    onMIDISuccess(midiAccess) {
        this.midiAccess = midiAccess;
        this.midiInputs = [];
        for (let input of midiAccess.inputs.values()) {
            this.midiInputs.push(input);
            input.onmidimessage = this.onMIDIMessage.bind(this);
        }
        midiAccess.onstatechange = this.onMIDIStateChange.bind(this);
        this.updateMIDIStatus(`Connected: ${this.midiInputs.length} device(s)`);
    }

    onMIDIError(error) {
        this.updateMIDIStatus('Access denied');
    }

    onMIDIStateChange(event) {
        const port = event.port;
        if (port.type === 'input') {
            if (port.state === 'connected') {
                port.onmidimessage = this.onMIDIMessage.bind(this);
                this.midiInputs.push(port);
            } else if (port.state === 'disconnected') {
                this.midiInputs = this.midiInputs.filter(input => input !== port);
            }
            this.updateMIDIStatus(`Connected: ${this.midiInputs.length} device(s)`);
        }
    }

    onMIDIMessage(event) {
        const command = event.data[0];
        const channel = (command & 0x0F) + 1; 
        const note = event.data[1];
        const velocity = event.data[2];
        if (channel !== this.selectedChannel) {
            return;
        }
        switch (command & 0xF0) {
            case 0x90: 
                if (velocity > 0) {
                    this.noteOn(note, velocity);
                } else {
                    this.noteOff(note);
                }
                break;
            case 0x80:
                this.noteOff(note);
                break;
            case 0xE0:
                const pitchBend = ((event.data[2] << 7) | event.data[1]) / 8192 - 1;
                this.onMIDIPitchBend(pitchBend);
                break;
        }
    }

    onMIDIPitchBend(bend) {
        const bendSemitones = bend * 2; 
        
        for (const oscillator of this.oscillators) {
            if (oscillator.isActive) {
                for (const [note, voice] of oscillator.voices) {
                    if (voice.toneOsc && voice.toneOsc.frequency) {
                        const baseFreq = this.midiNoteToFrequency(note);
                        const bentFreq = baseFreq * Math.pow(2, bendSemitones / 12);
                        voice.toneOsc.frequency.value = bentFreq;
                    }
                }
            }
        }
    }

    updateMIDIStatus(status) {
        const midiStatusElement = document.getElementById('midi-status');
        if (midiStatusElement) {
            midiStatusElement.textContent = `MIDI: ${status}`;
        }
    }

    initModulationMatrix() {
        this.modulationMatrixView = new ModulationMatrixView(this);
    }

    initFilter() {
        this.filterModel = new FilterModel();
        this.filterView = new FilterView(this);
        
        this.filterEnvelopeModel = new FilterEnvelopeModel();
        this.filterEnvelopeView = new FilterEnvelopeView(this);
        
        this.delayModel = new DelayModel();
        this.delayView = new DelayView(this);
        
        this.reverbModel = new ReverbModel();
        this.reverbView = new ReverbView(this);
        
        this.compressorModel = new CompressorModel();
        this.compressorView = new CompressorView(this);
        
        this.globalDelay = new this.Tone.FeedbackDelay({
            delayTime: this.delayModel.getDelayTime(),
            feedback: this.delayModel.getFeedback(),
            wet: this.delayModel.getWet()
        });

        this.globalReverb = new this.Tone.Reverb({
            decay: this.reverbModel.getDecay(),
            preDelay: this.reverbModel.getPredelay(),
            wet: this.reverbModel.getDryWet()
        });

        this.globalCompressor = new this.Tone.Compressor({
            threshold: this.compressorModel.getThreshold(),
            attack: this.compressorModel.getAttack(),
            release: this.compressorModel.getRelease(),
            ratio: this.compressorModel.getRatio()
        });
        
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
                if (Array.isArray(voice.gainNodes)) {
                    const mainGainNode = voice.gainNodes[0]; 
                    if (mainGainNode && mainGainNode.gain) {
                        const currentGain = mainGainNode.gain.value;
                        const baseGain = currentGain / (this.getOutputVolume(oscillatorId) || 0.01); 
                        mainGainNode.gain.value = baseGain * newVolume;
                    }
                } else if (voice.gainNode && voice.gainNode.gain) {
                    const currentGain = voice.gainNode.gain.value;
                    const baseGain = currentGain / (this.getOutputVolume(oscillatorId) || 0.01); 
                    voice.gainNode.gain.value = baseGain * newVolume;
                }
            }
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
                        var modulatorEnvelope = null;
                        if (Array.isArray(this.getOscillator(modulatorId).voices.get(note).envelope)) {
                            modulatorEnvelope = this.getOscillator(modulatorId).voices.get(note).envelope[0];
                        } else {
                            modulatorEnvelope = this.getOscillator(modulatorId).voices.get(note).envelope;
                        }     
                        const modulationGain = new this.Tone.Gain(modulationValue * 100);
                        const delay = new this.Tone.Delay(0.0000226);
                        modulatorEnvelope.connect(modulationGain);
                        modulationGain.connect(delay);
                        delay.connect(carrierOsc.frequency);
                        carrier.addModulation(note, delay, modulationGain);
                                         } 
                                         else {
                        const delay = new this.Tone.Delay(0.0000226);
                        const modulationGain = new this.Tone.Gain(modulationValue * 100);
                        // const modulationGain = new this.Tone.Gain(modulationValue);
                        carrierOsc.connect(delay);
                        delay.connect(modulationGain);
                        modulationGain.connect(carrierOsc.frequency);
                        carrier.addModulation(note, delay, modulationGain);
                        //  const selfModulationOsc = new this.Tone.Oscillator(carrierOsc.frequency.value, carrierOsc.waveform);
                        //  selfModulationOsc.phase = carrier.getInitialPhase();
                        // const selfModulationEnvelope = new this.Tone.AmplitudeEnvelope({
                        //     attack: carrier.voices.get(note).envelope.attack,
                        //     decay: carrier.voices.get(note).envelope.decay,
                        //     sustain: carrier.voices.get(note).envelope.sustain,
                        //     release: carrier.voices.get(note).envelope.release
                        // });
                        // const selfModulationGain = new this.Tone.Gain(modulationValue * 100);
                        // selfModulationOsc.connect(selfModulationEnvelope);
                        // selfModulationEnvelope.connect(selfModulationGain);
                        // selfModulationGain.connect(carrierOsc.frequency);
                        // carrier.addSelfModulation(note, selfModulationOsc, selfModulationEnvelope, selfModulationGain);
                    }    
                }
            }
        }
    }


    createOscillators() {
        for (let i=0; i<8; i++) {
            const oscillatorModel = new OscillatorModel(i, 1.0);
            this.oscillators[i] = oscillatorModel;
        }
    }

    initUI() {
        const tabsContainer = document.getElementById('oscillators-tabs');
        const contentContainer = document.getElementById('oscillators-content');

        this.oscillators.forEach((oscillator, index) => {
            const isInitiallySelected = (index === 0);
            const oscillatorView = new OscillatorView(this, index, tabsContainer, contentContainer, isInitiallySelected);
            this.oscillatorViews[index] = oscillatorView;
        });
    }

    async initTone() {

        this.Tone = Tone;
        this.delayInputNode = new this.Tone.Gain(1);
        this.delayOutputNode = new this.Tone.Gain(1);
        this.reverbInputNode = new this.Tone.Gain(1);
        this.reverbOutputNode = new this.Tone.Gain(1);
        this.compressorInputNode = new this.Tone.Gain(1);
        this.compressorOutputNode = new this.Tone.Gain(1);
        this.masterGainNode = new this.Tone.Gain(this.masterVolume * 0.1);
        this.masterMeter = new this.Tone.Meter();            
        this.delayInputNode.connect(this.delayOutputNode);
        this.delayOutputNode.connect(this.reverbInputNode);
        this.reverbInputNode.connect(this.reverbOutputNode);
        this.reverbOutputNode.connect(this.compressorInputNode);
        this.compressorInputNode.connect(this.compressorOutputNode);
        this.compressorOutputNode.connect(this.masterGainNode);
        this.masterGainNode.connect(this.masterMeter);
        this.masterGainNode.connect(this.Tone.context.destination);
    }

    getOscillator(id) {
        return this.oscillators[id];
    }
    

    getOscillators() {
        return this.oscillators;
    }

    setActiveOscillator(id) {
        this.activeOscillatorId = id;
    }

    toggleOscillator(id) {
        const oscillator = this.getOscillator(id);
        if (oscillator) {
            oscillator.isActive = !oscillator.isActive;
            if (!oscillator.isActive) {
                oscillator.forceDisposeAllVoices();
            }
            const oscillatorView = this.oscillatorViews[id];
            oscillatorView.updateDisplay();

        }
    }

    setWaveform(id, waveform) {
        const oscillator = this.getOscillator(id);
        oscillator.waveform = waveform;
        const oscillatorView = this.oscillatorViews[id];
        oscillatorView.updateDisplay();
    }

    setRatio(id, ratio) {
        const oscillator = this.getOscillator(id);
        if (oscillator && ratio >= 0.1 && ratio <= 64.0) {
            oscillator.ratio = ratio;         
            const oscillatorView = this.oscillatorViews[id];
            oscillatorView.updateDisplay();
        }
    }

    setAttack(id, attack) {
        const oscillator = this.getOscillator(id);
        if (oscillator && attack >= 0.001 && attack <= 2.0) {
            oscillator.attack = attack;      
            const oscillatorView = this.oscillatorViews[id];
            oscillatorView.updateDisplay();  
        }
    }

    setDecay(id, decay) {
        const oscillator = this.getOscillator(id);
            oscillator.decay = decay;
            
            const oscillatorView = this.oscillatorViews[id];
            oscillatorView.updateDisplay();
    }

    setSustain(id, sustain) {
        const oscillator = this.getOscillator(id);
        if (oscillator && sustain >= 0.0 && sustain <= 1.0) {
            oscillator.sustain = sustain;         
            const oscillatorView = this.oscillatorViews[id];
            oscillatorView.updateDisplay();
        }
    }

    setRelease(id, release) {
        const oscillator = this.getOscillator(id);
            oscillator.release = release;
            const oscillatorView = this.oscillatorViews[id];
            oscillatorView.updateDisplay();
    }

    setPhase(id, phase) {
        const oscillator = this.getOscillator(id);
        if (oscillator) {
            oscillator.phase = Math.max(0, Math.min(1, phase));         
            const oscillatorView = this.oscillatorViews[id];
            oscillatorView.updateDisplay();
        }
    }

    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        this.masterGainNode.gain.value = this.masterVolume * 0.1; 
    }

    getMasterVolume() {
        return this.masterVolume;
    }

    setFilterType(type) {
        this.filterModel.setType(type)
    }

    setFilterFrequency(frequency) {
        this.filterModel.setFrequency(frequency);
    }
    setFilterResonance(resonance) {
        this.filterModel.setResonance(resonance);
    }

    setFilterRolloff(rolloff) {
        this.filterModel.setRolloff(rolloff)
    }


    setFilterEnvelopeAttack(attack) {
        this.filterEnvelopeModel.setAttack(attack);
    }

    setFilterEnvelopeDecay(decay) {
        this.filterEnvelopeModel.setDecay(decay);
    }

    setFilterEnvelopeSustain(sustain) {
        this.filterEnvelopeModel.setSustain(sustain);
    }

    setFilterEnvelopeRelease(release) {
        const clampedRelease = this.filterEnvelopeModel.setRelease(release);
    }

    setFilterEnvelopeAmount(amount) {
        this.filterEnvelopeModel.setAmount(amount);
    }

    setFilterEnvelopeEnabled(enabled) {
        this.filterEnvelopeModel.setIsEnabled(enabled);
    }


    setDelayTime(time) {
        const clampedTime = this.delayModel.setDelayTime(time);
        this.globalDelay.delayTime.value = clampedTime;
    }

    setDelayFeedback(feedback) {
        const clampedFeedback = this.delayModel.setFeedback(feedback);
        this.globalDelay.feedback.value = clampedFeedback;
    }

    setDelayWet(wet) {
        const clampedWet = this.delayModel.setWet(wet);
        this.globalDelay.wet.value = clampedWet;
    }

    setDelayEnabled(enabled) {
        this.delayModel.setIsEnabled(enabled);      
        if (enabled) {
            this.delayInputNode.disconnect();
            this.delayInputNode.connect(this.globalDelay);
            this.globalDelay.connect(this.delayOutputNode);
        } else {
            this.delayInputNode.disconnect();
            this.delayInputNode.connect(this.delayOutputNode);
        }
    }

    getFilterSettings() {
        return this.filterModel ? this.filterModel.getSettings() : null;
    }

    getDelaySettings() {
        return this.delayModel ? this.delayModel.getSettings() : null;
    }

    setReverbDecay(decay) {
        const clampedDecay = this.reverbModel.setDecay(decay);
        this.globalReverb.decay = clampedDecay;
    }

    setReverbPredelay(predelay) {
        const clampedPredelay = this.reverbModel.setPredelay(predelay);
        this.globalReverb.preDelay = clampedPredelay;
    }

    setReverbDryWet(dryWet) {
        const clampedDryWet = this.reverbModel.setDryWet(dryWet);
        this.globalReverb.wet.value = clampedDryWet;
    }

    setReverbEnabled(enabled) {
        this.reverbModel.setIsEnabled(enabled);     
        if (enabled) {
            this.reverbInputNode.disconnect();
            this.reverbInputNode.connect(this.globalReverb);
            this.globalReverb.connect(this.reverbOutputNode);
        } else {
            this.reverbInputNode.disconnect();
            this.reverbInputNode.connect(this.reverbOutputNode);
        }
    }

    getReverbSettings() {
        return this.reverbModel ? this.reverbModel.getSettings() : null;
    }

    setCompressorThreshold(threshold) {
            this.compressorModel.setThreshold(threshold);
            this.scheduleCompressorUpdate();
    }

    setCompressorAttack(attack) {
        this.compressorModel.setAttack(attack);
        this.scheduleCompressorUpdate();
    }

    setCompressorRelease(release) {
        this.compressorModel.setRelease(release);
        this.scheduleCompressorUpdate();
    }

    setCompressorRatio(ratio) {
        this.compressorModel.setRatio(ratio);
        this.scheduleCompressorUpdate();
    }

    setCompressorEnabled(enabled) {
        this.compressorModel.setIsEnabled(enabled);
            
        if (enabled) {
            this.compressorInputNode.disconnect();
            this.compressorInputNode.connect(this.globalCompressor);
            this.globalCompressor.connect(this.compressorOutputNode);
        } else {
            this.compressorInputNode.disconnect();
            this.compressorInputNode.connect(this.compressorOutputNode);
        }
    }

    getCompressorSettings() {
        return this.compressorModel ? this.compressorModel.getSettings() : null;
    }

    updateCompressorReduction() {
        if (this.globalCompressor && this.compressorView && this.compressorModel.getIsEnabled()) {
            const reductionDb = this.globalCompressor.reduction;
                
            if (reductionDb !== undefined && !isNaN(reductionDb)) {
                const normalizedReduction = Math.max(0, Math.min(1, Math.abs(reductionDb) / 60));
                    
                this.compressorModel.setReduction(normalizedReduction);
                this.compressorView.updateReductionMeter(normalizedReduction);
            }
        } else if (this.compressorView && !this.compressorModel.getIsEnabled()) {
            this.compressorModel.setReduction(0);
            this.compressorView.updateReductionMeter(0);
        }
    }

    scheduleCompressorUpdate() {
        if (this.compressorUpdateTimeout) {
            clearTimeout(this.compressorUpdateTimeout);
        }
        this.compressorUpdateTimeout = setTimeout(() => {
            this.recreateCompressor();
        }, 100);
    }

    recreateCompressor() {
        if (!this.compressorModel || !this.Tone) return;
        const wasEnabled = this.compressorModel.getIsEnabled();
        let inputConnection = null;
        let outputConnection = null;
        if (this.globalCompressor) {
            if (wasEnabled) {
                inputConnection = this.compressorInputNode.connections;
                outputConnection = this.globalCompressor.connections;
            }
            this.globalCompressor.dispose();
        }
        this.globalCompressor = new this.Tone.Compressor({
            threshold: this.compressorModel.getThreshold(),
            attack: this.compressorModel.getAttack(),
            release: this.compressorModel.getRelease(),
            ratio: this.compressorModel.getRatio()
        });

        if (wasEnabled) {
            this.compressorInputNode.disconnect();
            this.compressorInputNode.connect(this.globalCompressor);
            this.globalCompressor.connect(this.compressorOutputNode);
        }
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
        const normalizedVelocity = velocity <= 1 ? velocity : velocity / 127;
        this.playOscillators(note, frequency, normalizedVelocity);
    }

    noteOff(note) {
        for (const oscillator of this.oscillators) {
            oscillator.removeVoice(note);
        }
    }

    playOscillators(note, frequency, velocity) {

        try {
            let pitchEnvelope = null;
            let pitchGain = null;
            if (this.pitchEnvelopeModel && this.pitchEnvelopeModel.getIsEnabled() && this.pitchEnvelopeModel.getAmount() !== 0) {
                pitchEnvelope = new this.Tone.Envelope({
                    attack: this.pitchEnvelopeModel.getAttack(),
                    decay: this.pitchEnvelopeModel.getDecay(),
                    sustain: this.pitchEnvelopeModel.getSustain(),
                    release: this.pitchEnvelopeModel.getRelease()
                });
                
                const pitchAmount = this.pitchEnvelopeModel.getAmount();
                const baseFrequency = frequency; 
                const targetFrequency = baseFrequency * Math.pow(2, pitchAmount / 12);
                const frequencyShift = targetFrequency - baseFrequency;

                pitchGain = new this.Tone.Gain(frequencyShift);
                
                pitchEnvelope.connect(pitchGain);
            }

            for (const osc of this.oscillators) {
                osc.removeVoice(note);
                if (osc.isActive) {
                    const realFrequency = frequency * osc.ratio;
                    const initialPhase = osc.getInitialPhase();
                    const toneOsc = new this.Tone.Oscillator(realFrequency, osc.waveform);
                    toneOsc.phase = initialPhase;
                    if (pitchEnvelope && pitchGain) {
                        pitchGain.connect(toneOsc.frequency);        
                        toneOsc.frequency.value = realFrequency;
                    }
                    const envelope = new this.Tone.AmplitudeEnvelope({
                        attack: osc.attack,
                        decay: osc.decay,
                        sustain: osc.sustain,
                        release: osc.release
                    });
                    const gainNode = new this.Tone.Gain(velocity * this.getOutputVolume(osc.id));                    
                    const noteFilter = new this.Tone.Filter({
                        type: this.filterModel.type,
                        frequency: this.filterModel.frequency,
                        Q: this.filterModel.resonance,
                        rolloff: this.filterModel.rolloff
                    });
                    let filterEnvelope = null;
                    let filterGain = null;
                    if (this.filterEnvelopeModel && this.filterEnvelopeModel.getIsEnabled() && this.filterEnvelopeModel.getAmount() !== 0) {
                        filterEnvelope = new this.Tone.Envelope({
                            attack: this.filterEnvelopeModel.getAttack(),
                            decay: this.filterEnvelopeModel.getDecay(),
                            sustain: this.filterEnvelopeModel.getSustain(),
                            release: this.filterEnvelopeModel.getRelease()
                        });                       
                        const filterAmount = this.filterEnvelopeModel.getAmount();
                        const baseFrequency = this.filterModel.frequency;
                        var frequencyShift;
                        if (filterAmount >= 0) {
                            frequencyShift = (20000 - baseFrequency) * (filterAmount/100);
                        } else {
                            frequencyShift = (baseFrequency - 20) * (filterAmount/100);
                        }                                    
                        filterGain = new this.Tone.Gain(frequencyShift);
                        filterEnvelope.connect(filterGain);
                        filterGain.connect(noteFilter.frequency);
                    }               
                    toneOsc.connect(envelope);
                    envelope.connect(gainNode);
                    gainNode.connect(noteFilter);
                    noteFilter.connect(this.delayInputNode);                   
                    if (pitchEnvelope && pitchGain && filterEnvelope && filterGain) {
                        osc.addVoice(note, toneOsc, [envelope, pitchEnvelope, filterEnvelope], [gainNode, pitchGain, filterGain], noteFilter);
                    } else if (pitchEnvelope && pitchGain) {
                        osc.addVoice(note, toneOsc, [envelope, pitchEnvelope], [gainNode, pitchGain], noteFilter);
                    } else if (filterEnvelope && filterGain) {
                        osc.addVoice(note, toneOsc, [envelope, filterEnvelope], [gainNode, filterGain], noteFilter);
                    } else {
                        osc.addVoice(note, toneOsc, envelope, gainNode, noteFilter);
                    }
    
                    if (pitchEnvelope && pitchGain && filterEnvelope && filterGain) {
                        osc.addVoice(note, toneOsc, [envelope, pitchEnvelope, filterEnvelope], [gainNode, pitchGain, filterGain], noteFilter);
                    } else if (pitchEnvelope && pitchGain) {
                        osc.addVoice(note, toneOsc, [envelope, pitchEnvelope], [gainNode, pitchGain], noteFilter);
                    } else if (filterEnvelope && filterGain) {
                        osc.addVoice(note, toneOsc, [envelope, filterEnvelope], [gainNode, filterGain], noteFilter);
                    } else {
                        osc.addVoice(note, toneOsc, envelope, gainNode, noteFilter);
                    }
                }
            }
            
            // STEP 2: Creare le connessioni FM dalla modulation matrix
            this.createFMConnections(note);
            
            // STEP 3: Suonare gli oscillatori attivi
            for (const osc of this.oscillators) {
                if (osc.isActive) {
                    const voice = osc.voices.get(note);
                    if (voice) {               
                        if (Array.isArray(voice.envelope)) {                
                            voice.toneOsc.start(); 
                            voice.envelope.forEach(envelope => {
                                envelope.triggerAttack();
                            });
                        } else {                    
                            voice.toneOsc.start();
                            voice.envelope.triggerAttack();
                        }
                        
                 
                    }
                }
            }   
        } catch (error) {
            console.error(error);
        }
    }

    midiNoteToFrequency(note) {
        return 440 * Math.pow(2, (note - 69) / 12);
    }

    initPitchEnvelope() {
        this.pitchEnvelopeModel = new PitchEnvelopeModel();
        this.pitchEnvelopeView = new PitchEnvelopeView(this.pitchEnvelopeModel, this);
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
}