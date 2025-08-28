export class ReverbView {
    constructor(controller) {
        this.controller = controller;
        this.bindViewEvents();
    }

    bindViewEvents() {
        const enableToggle = document.getElementById('reverb-enable');
        if (enableToggle) {
            enableToggle.addEventListener('change', (e) => {
                this.controller.setReverbEnabled(e.target.checked);
            });
        }

        const decaySlider = document.getElementById('reverb-decay');
        if (decaySlider) {
            decaySlider.addEventListener('input', (e) => {
                const decay = this.sliderToDecay(parseInt(e.target.value));
                this.controller.setReverbDecay(decay);
                this.updateDecayDisplay(decay);
            });
        }

        const predelaySlider = document.getElementById('reverb-predelay');
        if (predelaySlider) {
            predelaySlider.addEventListener('input', (e) => {
                const predelay = parseInt(e.target.value) / 1000;
                this.controller.setReverbPredelay(predelay);
                this.updatePredelayDisplay(predelay);
            });
        }

        const dryWetSlider = document.getElementById('reverb-dry-wet');
        if (dryWetSlider) {
            dryWetSlider.addEventListener('input', (e) => {
                const dryWet = parseInt(e.target.value) / 100;
                this.controller.setReverbDryWet(dryWet);
                this.updateDryWetDisplay(dryWet);
            });
        }
    }

    updateDecayDisplay(decay) {
        const display = document.getElementById('reverb-decay-value');
        if (display) {
            display.textContent = `${decay.toFixed(3)}s`;
        }
    }

    updatePredelayDisplay(predelay) {
        const display = document.getElementById('reverb-predelay-value');
        if (display) {
            display.textContent = `${predelay.toFixed(3)}s`;
        }
    }

    updateDryWetDisplay(dryWet) {
        const display = document.getElementById('reverb-dry-wet-value');
        if (display) {
            display.textContent = `${Math.round(dryWet * 100)}%`;
        }
    }

    sliderToDecay(sliderValue) {
        const minDecay = 0.001;
        const maxDecay = 10;
        const normalizedValue = sliderValue / 1000; // slider 0-1000 -> 0-1
        const decay = minDecay + (maxDecay - minDecay) * normalizedValue;
        return decay;
    }

    decayToSlider(decay) {
        const minDecay = 0.001;
        const maxDecay = 10;
        const clampedDecay = Math.max(minDecay, Math.min(maxDecay, decay));
        const normalizedValue = (clampedDecay - minDecay) / (maxDecay - minDecay);
        return Math.round(normalizedValue * 1000);
    }

    updateAllControls(model) {
        if (!model) return;

        const decaySlider = document.getElementById('reverb-decay');
        if (decaySlider) {
            decaySlider.value = this.decayToSlider(model.getDecay());
        }

        const predelaySlider = document.getElementById('reverb-predelay');
        if (predelaySlider) {
            predelaySlider.value = model.getPredelay() * 1000;
        }

        const dryWetSlider = document.getElementById('reverb-dry-wet');
        if (dryWetSlider) {
            dryWetSlider.value = model.getDryWet() * 100;
        }

        this.updateDecayDisplay(model.getDecay());
        this.updatePredelayDisplay(model.getPredelay());
        this.updateDryWetDisplay(model.getDryWet());

        const enableToggle = document.getElementById('reverb-enable');
        if (enableToggle) {
            enableToggle.checked = model.getIsEnabled();
        }
    }
}
