export class FilterEnvelopeView {
    constructor(controller) {
        this.controller = controller;
        this.bindViewEvents();
    }

    bindViewEvents() {
        const enableToggle = document.getElementById('filter-env-enable');
        if (enableToggle) {
            enableToggle.addEventListener('change', (e) => {
                this.controller.setFilterEnvelopeEnabled(e.target.checked);
            });
        }

        const attackSlider = document.getElementById('filter-attack');
        if (attackSlider) {
            attackSlider.addEventListener('input', (e) => {
                const time = this.sliderToAttackDecayTime(parseInt(e.target.value));
                this.controller.setFilterEnvelopeAttack(time);
                this.updateAttackDisplay(time);
            });
        }

        const decaySlider = document.getElementById('filter-decay');
        if (decaySlider) {
            decaySlider.addEventListener('input', (e) => {
                const time = this.sliderToAttackDecayTime(parseInt(e.target.value));
                this.controller.setFilterEnvelopeDecay(time);
                this.updateDecayDisplay(time);
            });
        }

        const sustainSlider = document.getElementById('filter-sustain');
        if (sustainSlider) {
            sustainSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value) / 100;
                this.controller.setFilterEnvelopeSustain(value);
                this.updateSustainDisplay(value);
            });
        }

        const releaseSlider = document.getElementById('filter-release');
        if (releaseSlider) {
            releaseSlider.addEventListener('input', (e) => {
                const time = this.sliderToReleaseTime(parseInt(e.target.value));
                this.controller.setFilterEnvelopeRelease(time);
                this.updateReleaseDisplay(time);
            });
        }

        const amountSlider = document.getElementById('filter-amount');
        if (amountSlider) {
            amountSlider.addEventListener('input', (e) => {
                const amount = parseInt(e.target.value);
                this.controller.setFilterEnvelopeAmount(amount);
                this.updateAmountDisplay(amount);
            });
        }
    }

    sliderToAttackDecayTime(sliderValue) {
        const maxTime = 2;
        return Math.pow(sliderValue / 1000, 2) * maxTime;
    }

    timeToAttackDecaySlider(time) {
        const maxTime = 2;
        return Math.sqrt(time / maxTime) * 1000;
    }

    sliderToReleaseTime(sliderValue) {
        const maxTime = 5;
        return Math.pow(sliderValue / 1000, 2) * maxTime;
    }

    timeToReleaseSlider(time) {
        const maxTime = 5;
        return Math.sqrt(time / maxTime) * 1000;
    }

    updateAttackDisplay(time) {
        const display = document.getElementById('filter-attack-value');
        if (display) {
            display.textContent = `${time.toFixed(3)}s`;
        }
    }

    updateDecayDisplay(time) {
        const display = document.getElementById('filter-decay-value');
        if (display) {
            display.textContent = `${time.toFixed(3)}s`;
        }
    }

    updateSustainDisplay(value) {
        const display = document.getElementById('filter-sustain-value');
        if (display) {
            display.textContent = `${(value * 100).toFixed(0)}%`;
        }
    }

    updateReleaseDisplay(time) {
        const display = document.getElementById('filter-release-value');
        if (display) {
            display.textContent = `${time.toFixed(3)}s`;
        }
    }

    updateAmountDisplay(amount) {
        const display = document.getElementById('filter-amount-value');
        if (display) {
            display.textContent = `${amount}%`;
        }
    }

    updateAllControls(model) {
        if (!model) return;

        const attackSlider = document.getElementById('filter-attack');
        if (attackSlider) {
            attackSlider.value = this.timeToAttackDecaySlider(model.getAttack());
        }

        const decaySlider = document.getElementById('filter-decay');
        if (decaySlider) {
            decaySlider.value = this.timeToAttackDecaySlider(model.getDecay());
        }

        const sustainSlider = document.getElementById('filter-sustain');
        if (sustainSlider) {
            sustainSlider.value = model.getSustain() * 100;
        }

        const releaseSlider = document.getElementById('filter-release');
        if (releaseSlider) {
            releaseSlider.value = this.timeToReleaseSlider(model.getRelease());
        }

        const amountSlider = document.getElementById('filter-amount');
        if (amountSlider) {
            amountSlider.value = model.getAmount();
        }

        this.updateAttackDisplay(model.getAttack());
        this.updateDecayDisplay(model.getDecay());
        this.updateSustainDisplay(model.getSustain());
        this.updateReleaseDisplay(model.getRelease());
        this.updateAmountDisplay(model.getAmount());

        const enableToggle = document.getElementById('filter-env-enable');
        if (enableToggle) {
            enableToggle.checked = model.getIsEnabled();
        }
    }
}
