export class PitchEnvelopeModel {
    constructor() {
        this.attack = 0.0;      
        this.decay = 0.3;       
        this.sustain = 0.0;    
        this.release = 1.0;     
        this.amount = 0;       
        this.isEnabled = true; 
    }
    
    getAttack() { return this.attack; }
    getDecay() { return this.decay; }
    getSustain() { return this.sustain; }
    getRelease() { return this.release; }
    getAmount() { return this.amount; }
    getIsEnabled() { return this.isEnabled; }
    
    setAttack(attack) {
        this.attack = Math.max(0, Math.min(10, attack));
    }
    
    setDecay(decay) {
        this.decay = Math.max(0.001, Math.min(10, decay));
    }
    
    setSustain(sustain) {
        this.sustain = Math.max(0, Math.min(1, sustain));
    }
    
    setRelease(release) {
        this.release = Math.max(0, Math.min(5, release));
    }
    
    setAmount(amount) {
        this.amount = Math.max(-48, Math.min(48, amount));
    }
    
    setIsEnabled(enabled) {
        this.isEnabled = enabled;
    }
    
    getSettings() {
        return {
            enabled: this.isEnabled,
            amount: this.amount,
            attack: this.attack,
            decay: this.decay,
            sustain: this.sustain,
            release: this.release
        };
    }
    
    applySettings(settings) {
        if (settings.attack !== undefined) this.setAttack(settings.attack);
        if (settings.decay !== undefined) this.setDecay(settings.decay);
        if (settings.sustain !== undefined) this.setSustain(settings.sustain);
        if (settings.release !== undefined) this.setRelease(settings.release);
        if (settings.amount !== undefined) this.setAmount(settings.amount);
        if (settings.isEnabled !== undefined) this.setIsEnabled(settings.isEnabled);
    }
}
