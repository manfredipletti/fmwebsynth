export class CompressorView {
    constructor(controller) {
        this.controller = controller;
        this.bindViewEvents();
    }

    bindViewEvents() {
        const enableToggle = document.getElementById('compressor-enable');
        if (enableToggle) {
            enableToggle.addEventListener('change', (e) => {
                this.controller.setCompressorEnabled(e.target.checked);
            });
        }

        const thresholdSlider = document.getElementById('compressor-threshold');
        if (thresholdSlider) {
            thresholdSlider.addEventListener('input', (e) => {
                const threshold = this.sliderToThreshold(parseInt(e.target.value));
                this.controller.setCompressorThreshold(threshold);
                this.updateThresholdDisplay(threshold);
            });
        }

        const attackSlider = document.getElementById('compressor-attack');
        if (attackSlider) {
            attackSlider.addEventListener('input', (e) => {
                const attack = parseInt(e.target.value) / 1000;
                this.controller.setCompressorAttack(attack);
                this.updateAttackDisplay(attack);
            });
        }

        const releaseSlider = document.getElementById('compressor-release');
        if (releaseSlider) {
            releaseSlider.addEventListener('input', (e) => {
                const release = parseInt(e.target.value) / 1000;
                this.controller.setCompressorRelease(release);
                this.updateReleaseDisplay(release);
            });
        }

        const ratioSlider = document.getElementById('compressor-ratio');
        if (ratioSlider) {
            ratioSlider.addEventListener('input', (e) => {
                const ratio = this.sliderToRatio(parseInt(e.target.value));
                this.controller.setCompressorRatio(ratio);
                this.updateRatioDisplay(ratio);
            });
        }
    }

    sliderToThreshold(sliderValue) {
        const minThreshold = -100;
        const maxThreshold = 0;
        const normalizedValue = sliderValue / 1000;
        const threshold = minThreshold + (maxThreshold - minThreshold) * normalizedValue;
        return threshold;
    }

    thresholdToSlider(threshold) {
        const minThreshold = -100;
        const maxThreshold = 0;
        const clampedThreshold = Math.max(minThreshold, Math.min(maxThreshold, threshold));
        const normalizedValue = (clampedThreshold - minThreshold) / (maxThreshold - minThreshold);
        return Math.round(normalizedValue * 1000);
    }

    sliderToRatio(sliderValue) {
        const minRatio = 1;
        const maxRatio = 20;
        const normalizedValue = sliderValue / 1000;
        const ratio = minRatio + (maxRatio - minRatio) * normalizedValue;
        return ratio;
    }

    ratioToSlider(ratio) {
        const minRatio = 1;
        const maxRatio = 20;
        const clampedRatio = Math.max(minRatio, Math.min(maxRatio, ratio));
        const normalizedValue = (clampedRatio - minRatio) / (maxRatio - minRatio);
        return Math.round(normalizedValue * 1000);
    }

    updateThresholdDisplay(threshold) {
        const display = document.getElementById('compressor-threshold-value');
        if (display) {
            display.textContent = `${threshold.toFixed(1)}dB`;
        }
    }

    updateAttackDisplay(attack) {
        const display = document.getElementById('compressor-attack-value');
        if (display) {
            display.textContent = `${attack.toFixed(3)}s`;
        }
    }

    updateReleaseDisplay(release) {
        const display = document.getElementById('compressor-release-value');
        if (display) {
            display.textContent = `${release.toFixed(3)}s`;
        }
    }

    updateRatioDisplay(ratio) {
        const display = document.getElementById('compressor-ratio-value');
        if (display) {
            display.textContent = `${ratio.toFixed(1)}:1`;
        }
    }

        updateReductionMeter(reduction) {
        const meterBar = document.getElementById('compressor-reduction-bar');
        const reductionValue = document.getElementById('compressor-reduction-value');
        
        if (meterBar) {
            const width = reduction * 100;
            meterBar.style.width = `${width}%`;
            
            if (reduction < 0.3) {
                meterBar.style.backgroundColor = '#00ff00';
            } else if (reduction < 0.7) {
                meterBar.style.backgroundColor = '#ffff00'; 
            } else {
                meterBar.style.backgroundColor = '#ff0000';
            }
        }
        
        if (reductionValue) {
            const reductionDb = -(reduction * 60);
            reductionValue.textContent = `${reductionDb.toFixed(1)}dB`;
        }
    }

    updateAllControls(model) {
        if (!model) return;

        const thresholdSlider = document.getElementById('compressor-threshold');
        if (thresholdSlider) {
            thresholdSlider.value = this.thresholdToSlider(model.getThreshold());
        }

        const attackSlider = document.getElementById('compressor-attack');
        if (attackSlider) {
            attackSlider.value = model.getAttack() * 1000;
        }

        const releaseSlider = document.getElementById('compressor-release');
        if (releaseSlider) {
            releaseSlider.value = model.getRelease() * 1000;
        }

        const ratioSlider = document.getElementById('compressor-ratio');
        if (ratioSlider) {
            ratioSlider.value = this.ratioToSlider(model.getRatio());
        }

        this.updateThresholdDisplay(model.getThreshold());
        this.updateAttackDisplay(model.getAttack());
        this.updateReleaseDisplay(model.getRelease());
        this.updateRatioDisplay(model.getRatio());
        this.updateReductionMeter(model.getReduction());

        const enableToggle = document.getElementById('compressor-enable');
        if (enableToggle) {
            enableToggle.checked = model.getIsEnabled();
        }
    }
}
