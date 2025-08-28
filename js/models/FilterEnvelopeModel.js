export class FilterEnvelopeModel {
    constructor() {
        this.attack = 0.001; 
        this.decay = 0.3;     
        this.sustain = 1.0;  
        this.release = 1.0;  
        this.amount = 0;     
        this.isEnabled = true;
    }

    setAttack(attack) {
        this.attack = Math.max(0.001, Math.min(2, attack));
        return this.attack;
    }

    setDecay(decay) {
        this.decay = Math.max(0.001, Math.min(2, decay));
        return this.decay;
    }

    setSustain(sustain) {
        this.sustain = Math.max(0, Math.min(1, sustain));
        return this.sustain;
    }

    setRelease(release) {
        this.release = Math.max(0, Math.min(5, release));
        return this.release;
    }

    setAmount(amount) {
        this.amount = Math.max(-100, Math.min(100, amount));
        return this.amount;
    }

    setIsEnabled(enabled) {
        this.isEnabled = enabled;
        return this.isEnabled;
    }

    getAttack() { return this.attack; }
    getDecay() { return this.decay; }
    getSustain() { return this.sustain; }
    getRelease() { return this.release; }
    getAmount() { return this.amount; }
    getIsEnabled() { return this.isEnabled; }

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
}
