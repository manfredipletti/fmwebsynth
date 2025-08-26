export class FilterView {
    constructor(controller) {
        this.controller = controller;
        this.initElements();
        this.bindEvents();
        this.updateDisplay();
    }
    
    initElements() {
        this.typeSelect = document.getElementById('filter-type');
        this.frequencySlider = document.getElementById('filter-frequency');
        this.frequencyValue = document.getElementById('filter-frequency-value');
        this.resonanceSlider = document.getElementById('filter-resonance');
        this.resonanceValue = document.getElementById('filter-resonance-value');
        this.rolloffSelect = document.getElementById('filter-rolloff');
        
        if (!this.typeSelect || !this.frequencySlider || !this.resonanceSlider || !this.rolloffSelect) {
            console.warn('Filter elements not found in DOM');
        }
    }
    
    bindEvents() {
        if (this.typeSelect) {
            this.typeSelect.addEventListener('change', (e) => {
                this.controller.setFilterType(e.target.value);
            });
        }
        
        if (this.frequencySlider) {
            this.frequencySlider.addEventListener('input', (e) => {
                const sliderValue = parseFloat(e.target.value);
                const frequency = this.sliderToFrequency(sliderValue);
                this.controller.setFilterFrequency(frequency);
                this.updateFrequencyDisplay(frequency);
            });
        }
        
        if (this.resonanceSlider) {
            this.resonanceSlider.addEventListener('input', (e) => {
                const resonance = parseFloat(e.target.value);
                this.controller.setFilterResonance(resonance);
                this.updateResonanceDisplay(resonance);
            });
        }
        
        if (this.rolloffSelect) {
            this.rolloffSelect.addEventListener('change', (e) => {
                const rolloff = parseInt(e.target.value);
                this.controller.setFilterRolloff(rolloff);
            });
        }
    }
    
    updateDisplay() {
        const settings = this.controller.getFilterSettings();
        
        if (this.typeSelect) {
            this.typeSelect.value = settings.type;
        }
        
        if (this.frequencySlider) {
            this.frequencySlider.value = this.frequencyToSlider(settings.frequency);
            this.updateFrequencyDisplay(settings.frequency);
        }
        
        if (this.resonanceSlider) {
            this.resonanceSlider.value = settings.resonance;
            this.updateResonanceDisplay(settings.resonance);
        }
        
        if (this.rolloffSelect) {
            this.rolloffSelect.value = settings.rolloff;
        }
    }
    
    updateFrequencyDisplay(frequency) {
        if (this.frequencyValue) {
            if (frequency >= 1000) {
                const kHz = (frequency / 1000).toFixed(1);
                this.frequencyValue.textContent = `${kHz} kHz`;
            } else {
                this.frequencyValue.textContent = `${Math.round(frequency)} Hz`;
            }
        }
    }
    
    updateResonanceDisplay(resonance) {
        if (this.resonanceValue) {
            this.resonanceValue.textContent = resonance.toFixed(1);
        }
    }
    

    updateControl(controlName, value) {
        switch (controlName) {
            case 'type':
                if (this.typeSelect) this.typeSelect.value = value;
                break;
            case 'frequency':
                if (this.frequencySlider) this.frequencySlider.value = this.frequencyToSlider(value);
                this.updateFrequencyDisplay(value);
                break;
            case 'resonance':
                if (this.resonanceSlider) this.resonanceSlider.value = value;
                this.updateResonanceDisplay(value);
                break;
            case 'rolloff':
                if (this.rolloffSelect) this.rolloffSelect.value = value;
                break;
        }
    }
    

    sliderToFrequency(sliderValue) {
        const minFreq = 20;
        const maxFreq = 20000;
        const normalizedValue = sliderValue / 1000; 
        const frequency = minFreq * Math.pow(maxFreq / minFreq, normalizedValue);
        return Math.round(frequency);
    }
    
    frequencyToSlider(frequency) {
        const minFreq = 20;
        const maxFreq = 20000;
        const clampedFreq = Math.max(minFreq, Math.min(maxFreq, frequency));
        const normalizedValue = Math.log(clampedFreq / minFreq) / Math.log(maxFreq / minFreq);
        return Math.round(normalizedValue * 1000);
    }
}
