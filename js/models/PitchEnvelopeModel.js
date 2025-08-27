export class PitchEnvelopeModel {
    constructor() {
        this.attack = 0.0;      
        this.decay = 0.3;       
        this.sustain = 0.0;    
        this.release = 1.0;     
        this.amount = 0;        
        this.isEnabled = true; 
        
        console.log('PitchEnvelopeModel initialized');
    }
    
    getAttack() { return this.attack; }
    getDecay() { return this.decay; }
    getSustain() { return this.sustain; }
    getRelease() { return this.release; }
    getAmount() { return this.amount; }
    getIsEnabled() { return this.isEnabled; }
    
    setAttack(attack) {
        this.attack = Math.max(0, Math.min(10, attack));
        console.log(`Pitch envelope attack set to: ${this.attack}s`);
    }
    
    setDecay(decay) {
        this.decay = Math.max(0.01, Math.min(10, decay));
        console.log(`Pitch envelope decay set to: ${this.decay}s`);
    }
    
    setSustain(sustain) {
        this.sustain = Math.max(0, Math.min(1, sustain));
        console.log(`Pitch envelope sustain set to: ${this.sustain}`);
    }
    
    setRelease(release) {
        this.release = Math.max(0.01, Math.min(10, release));
        console.log(`Pitch envelope release set to: ${this.release}s`);
    }
    
    setAmount(amount) {
        this.amount = Math.max(-2400, Math.min(2400, amount));
        console.log(`Pitch envelope amount set to: ${this.amount} cents`);
    }
    
    setIsEnabled(enabled) {
        this.isEnabled = enabled;
        console.log(`Pitch envelope ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    getSettings() {
        return {
            attack: this.attack,
            decay: this.decay,
            sustain: this.sustain,
            release: this.release,
            amount: this.amount,
            isEnabled: this.isEnabled
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
