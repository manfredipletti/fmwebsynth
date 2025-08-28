export class CompressorModel {
    constructor() {
        this.threshold = -20;    
        this.attack = 0.003;    
        this.release = 0.25;     
        this.ratio = 4;          
        this.reduction = 0;     
        this.isEnabled = false; 
    }

    setThreshold(threshold) {
        this.threshold = Math.max(-100, Math.min(0, threshold));
        return this.threshold;
    }

    setAttack(attack) {
        this.attack = Math.max(0, Math.min(1, attack));
        return this.attack;
    }

    setRelease(release) {
        this.release = Math.max(0, Math.min(1, release));
        return this.release;
    }

    setRatio(ratio) {
        this.ratio = Math.max(1, Math.min(20, ratio));
        return this.ratio;
    }

    setReduction(reduction) {
        this.reduction = Math.max(0, Math.min(1, reduction));
        return this.reduction;
    }

    setIsEnabled(enabled) {
        this.isEnabled = enabled;
        return this.isEnabled;
    }

    getThreshold() { return this.threshold; }
    getAttack() { return this.attack; }
    getRelease() { return this.release; }
    getRatio() { return this.ratio; }
    getReduction() { return this.reduction; }
    getIsEnabled() { return this.isEnabled; }

    getSettings() {
        return {
            threshold: this.threshold,
            attack: this.attack,
            release: this.release,
            ratio: this.ratio,
            reduction: this.reduction,
            isEnabled: this.isEnabled
        };
    }
}
