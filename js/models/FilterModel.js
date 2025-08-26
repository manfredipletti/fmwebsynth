export class FilterModel {
    constructor() {
        this.type = 'lowpass';
        this.frequency = 1000; // Hz
        this.resonance = 1.0; // Q factor
        this.rolloff = -24; // dB/oct
        this.isEnabled = true;
        
 
        this.toneFilter = null;
    }
    
    setType(type) {
        const validTypes = ['lowpass', 'highpass', 'bandpass', 'notch'];
        if (validTypes.includes(type)) {
            this.type = type;
            return true;
        }
        return false;
    }
    
    setFrequency(frequency) {
  
        this.frequency = Math.max(20, Math.min(20000, frequency));
        return this.frequency;
    }
    
    setResonance(resonance) {
    
        this.resonance = Math.max(0.1, Math.min(30, resonance));
        return this.resonance;
    }
    
    setRolloff(rolloff) {
        const validRolloffs = [-12, -24, -48, -96];
        if (validRolloffs.includes(rolloff)) {
            this.rolloff = rolloff;
            return true;
        }
        return false;
    }
    
    setEnabled(enabled) {
        this.isEnabled = Boolean(enabled);
    }
    

    getSettings() {
        return {
            type: this.type,
            frequency: this.frequency,
            resonance: this.resonance,
            rolloff: this.rolloff,
            isEnabled: this.isEnabled
        };
    }
    
 
    applySettings(settings) {
        if (settings.type !== undefined) this.setType(settings.type);
        if (settings.frequency !== undefined) this.setFrequency(settings.frequency);
        if (settings.resonance !== undefined) this.setResonance(settings.resonance);
        if (settings.rolloff !== undefined) this.setRolloff(settings.rolloff);
        if (settings.isEnabled !== undefined) this.setEnabled(settings.isEnabled);
    }
}
