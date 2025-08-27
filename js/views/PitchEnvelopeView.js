export class PitchEnvelopeView {
    constructor(model, controller) {
        this.model = model;
        this.controller = controller;
        
        this.enableToggle = document.getElementById('pitch-env-enable');
        this.amountSlider = document.getElementById('pitch-amount');
        this.amountValue = document.getElementById('pitch-amount-value');
        this.attackSlider = document.getElementById('pitch-attack');
        this.attackValue = document.getElementById('pitch-attack-value');
        this.decaySlider = document.getElementById('pitch-decay');
        this.decayValue = document.getElementById('pitch-decay-value');
        this.sustainSlider = document.getElementById('pitch-sustain');
        this.sustainValue = document.getElementById('pitch-sustain-value');
        this.releaseSlider = document.getElementById('pitch-release');
        this.releaseValue = document.getElementById('pitch-release-value');
        
        this.bindEvents();
        this.updateDisplay();
        
        console.log('PitchEnvelopeView initialized');
        console.log('Enable toggle found:', !!this.enableToggle);
        console.log('Amount slider found:', !!this.amountSlider);
        console.log('Attack slider found:', !!this.attackSlider);
    }
    
    bindEvents() {
        if (this.enableToggle) {
            this.enableToggle.addEventListener('change', (e) => {
                this.model.setIsEnabled(e.target.checked);
                this.updateDisplay();
            });
        }
        
        if (this.amountSlider) {
            this.amountSlider.addEventListener('input', (e) => {
                const amount = parseInt(e.target.value);
                this.model.setAmount(amount);
                this.updateAmountDisplay();
            });
        }
        
        if (this.attackSlider) {
            this.attackSlider.addEventListener('input', (e) => {
                const attack = parseFloat(e.target.value);
                this.model.setAttack(attack);
                this.updateAttackDisplay();
            });
        }
        
        if (this.decaySlider) {
            this.decaySlider.addEventListener('input', (e) => {
                const decay = parseFloat(e.target.value);
                this.model.setDecay(decay);
                this.updateDecayDisplay();
            });
        }
        
        if (this.sustainSlider) {
            this.sustainSlider.addEventListener('input', (e) => {
                const sustain = parseFloat(e.target.value);
                this.model.setSustain(sustain);
                this.updateSustainDisplay();
            });
        }
        
        if (this.releaseSlider) {
            this.releaseSlider.addEventListener('input', (e) => {
                const release = parseFloat(e.target.value);
                this.model.setRelease(release);
                this.updateReleaseDisplay();
            });
        }
    }
    
    updateDisplay() {
        if (this.enableToggle) {
            this.enableToggle.checked = this.model.getIsEnabled();
        }
        
        this.updateAmountDisplay();
        this.updateAttackDisplay();
        this.updateDecayDisplay();
        this.updateSustainDisplay();
        this.updateReleaseDisplay();
        
        this.updateEnabledState();
    }
    
    updateAmountDisplay() {
        if (this.amountSlider && this.amountValue) {
            const amount = this.model.getAmount();
            this.amountSlider.value = amount;
            this.amountValue.textContent = `${amount} cents`;
        }
    }
    
    updateAttackDisplay() {
        if (this.attackSlider && this.attackValue) {
            const attack = this.model.getAttack();
            this.attackSlider.value = attack;
            this.attackValue.textContent = `${attack.toFixed(1)}s`;
        }
    }
    
    updateDecayDisplay() {
        if (this.decaySlider && this.decayValue) {
            const decay = this.model.getDecay();
            this.decaySlider.value = decay;
            this.decayValue.textContent = `${decay.toFixed(1)}s`;
        }
    }
    
    updateSustainDisplay() {
        if (this.sustainSlider && this.sustainValue) {
            const sustain = this.model.getSustain();
            this.sustainSlider.value = sustain;
            this.sustainValue.textContent = `${Math.round(sustain * 100)}%`;
        }
    }
    
    updateReleaseDisplay() {
        if (this.releaseSlider && this.releaseValue) {
            const release = this.model.getRelease();
            this.releaseSlider.value = release;
            this.releaseValue.textContent = `${release.toFixed(1)}s`;
        }
    }
    
    updateEnabledState() {
        const isEnabled = this.model.getIsEnabled();
        const panel = document.getElementById('pitch-env-panel');
        
        if (panel) {
            if (isEnabled) {
                panel.classList.remove('disabled');
                panel.style.opacity = '1';
            } else {
                panel.classList.add('disabled');
                panel.style.opacity = '0.6';
            }
        }
        
        const controls = [
            this.amountSlider,
            this.attackSlider,
            this.decaySlider,
            this.sustainSlider,
            this.releaseSlider
        ];
        
        controls.forEach(control => {
            if (control) {
                control.disabled = !isEnabled;
            }
        });
    }
    
    getSettings() {
        return this.model.getSettings();
    }
    
    applySettings(settings) {
        this.model.applySettings(settings);
        this.updateDisplay();
    }
}
