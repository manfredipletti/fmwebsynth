export class ReverbModel {
    constructor() {
        this.decay = 2.0;     
        this.predelay = 0.1;    
        this.dryWet = 0.3;     
        this.isEnabled = false; 
    }

    setDecay(decay) {
        this.decay = Math.max(0.001, Math.min(10, decay));
        return this.decay;
    }

    setPredelay(predelay) {
        this.predelay = Math.max(0, Math.min(1, predelay));
        return this.predelay;
    }

    setDryWet(dryWet) {
        this.dryWet = Math.max(0, Math.min(1, dryWet));
        return this.dryWet;
    }

    setIsEnabled(enabled) {
        this.isEnabled = enabled;
        return this.isEnabled;
    }

    getDecay() { return this.decay; }
    getPredelay() { return this.predelay; }
    getDryWet() { return this.dryWet; }
    getIsEnabled() { return this.isEnabled; }

    getSettings() {
        return {
            decay: this.decay,
            predelay: this.predelay,
            dryWet: this.dryWet,
            isEnabled: this.isEnabled
        };
    }
}
