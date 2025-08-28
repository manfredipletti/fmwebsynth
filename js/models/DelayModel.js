export class DelayModel {
    constructor() {
        this.delayTime = 0.3;    
        this.feedback = 0.3;    
        this.wet = 0.3;          
        this.isEnabled = false; 
    }

    setDelayTime(time) {
        this.delayTime = Math.max(0.1, Math.min(2, time));
        return this.delayTime;
    }

    setFeedback(feedback) {
        this.feedback = Math.max(0, Math.min(0.9, feedback));
        return this.feedback;
    }

    setWet(wet) {
        this.wet = Math.max(0, Math.min(1, wet));
        return this.wet;
    }

    setIsEnabled(enabled) {
        this.isEnabled = enabled;
        return this.isEnabled;
    }

    getDelayTime() { return this.delayTime; }
    getFeedback() { return this.feedback; }
    getWet() { return this.wet; }
    getIsEnabled() { return this.isEnabled; }
}
