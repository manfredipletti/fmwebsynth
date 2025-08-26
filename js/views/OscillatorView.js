export class OscillatorView {
    constructor(controller, modelId, tabsContainer, contentContainer, isActive = false) {
        this.controller = controller;
        this.modelId = modelId;
        this.tabsContainer = tabsContainer;
        this.contentContainer = contentContainer;
        this.isActive = isActive;
        this.tabElement = null;
        this.panelElement = null;
        this.init();
    }

    init() {
        this.createTab();
        this.createPanel();
        this.updateDisplay();
        
        if (this.isActive) {
            this.activate();
        }
    }

    createTab() {
        this.tabElement = document.createElement('div');
        this.tabElement.className = 'oscillator-tab';
        this.tabElement.dataset.oscillatorId = this.getModel().id;
        
        this.tabElement.innerHTML = `
            OSC ${this.getModel().id + 1}
            <span class="oscillator-status">${this.getModel().isActive ? 'ON' : 'OFF'}</span>
        `;
        
        this.tabElement.addEventListener('click', () => {
            this.activate();
        });
        
        this.tabsContainer.appendChild(this.tabElement);
    }

    createPanel() {
        this.panelElement = document.createElement('div');
        this.panelElement.className = 'oscillator-panel';
        this.panelElement.dataset.oscillatorId = this.getModel().id;
        
        this.panelElement.innerHTML = `
            <div class="oscillator-header">
                <div class="oscillator-title">OSCILLATOR ${this.getModel().id + 1}</div>
                <button class="oscillator-toggle" data-action="toggle">
                    ${this.getModel().isActive ? 'ON' : 'OFF'}
                </button>
            </div>
            
            <div class="oscillator-controls">
                <div class="control-group">
                    <label class="control-label">Waveform</label>
                    <select class="control-input" data-control="waveform">
                        <option value="sine">SINE</option>
                        <option value="triangle">TRIANGLE</option>
                        <option value="sawtooth">SAW</option>
                        <option value="square">SQUARE</option>
                    </select>
                </div>
                
                <div class="control-group">
                    <label class="control-label">Ratio</label>
                    <input type="number" class="control-input" data-control="ratio" 
                           value="${this.getModel().ratio}" min="0.1" max="64.0" step="0.01">
                </div>
                
                <div class="control-group">
                    <div class="control-header">
                        <label class="control-label">Attack (s)</label>
                        <span class="control-value" data-display="attack">${this.getModel().attack.toFixed(3)}s</span>
                    </div>
                    <input type="range" class="control-input" data-control="attack" 
                           value="${this.getModel().attack * 1000}" min="0" max="2000" step="1">
                </div>
                
                <div class="control-group">
                    <div class="control-header">
                        <label class="control-label">Decay (s)</label>
                        <span class="control-value" data-display="decay">${this.getModel().decay.toFixed(3)}s</span>
                    </div>
                    <input type="range" class="control-input" data-control="decay" 
                           value="${this.getModel().decay * 1000}" min="1" max="2000" step="1">
                </div>
                
                <div class="control-group">
                    <div class="control-header">
                        <label class="control-label">Sustain</label>
                        <span class="control-value" data-display="sustain">${Math.round(this.getModel().sustain * 100)}%</span>
                    </div>
                    <input type="range" class="control-input" data-control="sustain" 
                           value="${this.getModel().sustain * 100}" min="0" max="100" step="1">
                </div>
                
                <div class="control-group">
                    <div class="control-header">
                        <label class="control-label">Release (s)</label>
                        <span class="control-value" data-display="release">${this.getModel().release.toFixed(3)}s</span>
                    </div>
                    <input type="range" class="control-input" data-control="release" 
                           value="${this.getModel().release * 1000}" min="1" max="2000" step="1">
                </div>
                
                <div class="control-group">
                    <div class="control-header">
                        <label class="control-label">Phase</label>
                        <span class="control-value" data-display="phase">${this.getModel().phase === 0 ? 'Fixed' : this.getModel().phase === 1 ? 'Random' : 'Custom'}</span>
                    </div>
                    <input type="range" class="control-input" data-control="phase" 
                           value="${this.getModel().phase * 100}" min="0" max="100" step="1">
                </div>
            </div>
        `;
        
        this.bindViewEvents(this.panelElement);
        this.contentContainer.appendChild(this.panelElement);
    }

    getModel() {
        return this.controller.getOscillator(this.modelId);
    }

    updateDisplay(property = null, value = null) {
        if (!this.panelElement) return;
        
        if (property === null) {
            this.updateAllControls();
        } else {
            this.updateSpecificControl(property, value);
        }
        
        this.updateTabStatus();
    }

    updateAllControls() {

        const toggleBtn = this.panelElement.querySelector('[data-action="toggle"]');
        if (toggleBtn) {
            toggleBtn.textContent = this.getModel().isActive ? 'ON' : 'OFF';
            toggleBtn.classList.toggle('active', this.getModel().isActive);
        }
        
        const waveformSelect = this.panelElement.querySelector('[data-control="waveform"]');
        if (waveformSelect) {
            waveformSelect.value = this.getModel().waveform;
        }
        
        const ratioInput = this.panelElement.querySelector('[data-control="ratio"]');
        if (ratioInput) {
            ratioInput.value = this.getModel().ratio;
        }
        
        const volumeInput = this.panelElement.querySelector('[data-control="volume"]');
        if (volumeInput) {
            volumeInput.value = Math.round(this.getModel().volume * 100);
        }
        
        const modDepthInput = this.panelElement.querySelector('[data-control="modulationDepth"]');
        if (modDepthInput) {
            modDepthInput.value = Math.round(this.getModel().modulationDepth * 100);
        }
        
        const attackInput = this.panelElement.querySelector('[data-control="attack"]');
        if (attackInput) {
            attackInput.value = Math.round(this.getModel().attack * 1000);
            this.updateAttackDisplay(this.getModel().attack);
        }
        
        const decayInput = this.panelElement.querySelector('[data-control="decay"]');
        if (decayInput) {
            decayInput.value = Math.round(this.getModel().decay * 1000);
            this.updateDecayDisplay(this.getModel().decay);
        }
        
        const sustainInput = this.panelElement.querySelector('[data-control="sustain"]');
        if (sustainInput) {
            sustainInput.value = Math.round(this.getModel().sustain * 100);
            this.updateSustainDisplay(this.getModel().sustain);
        }
        
        const releaseInput = this.panelElement.querySelector('[data-control="release"]');
        if (releaseInput) {
            releaseInput.value = Math.round(this.getModel().release * 1000);
            this.updateReleaseDisplay(this.getModel().release);
        }

        const phaseInput = this.panelElement.querySelector('[data-control="phase"]');
        if (phaseInput) {
            phaseInput.value = Math.round(this.getModel().phase * 100);
            this.updatePhaseDisplay(this.getModel().phase);
        }
    } 

    updateTabStatus() {
        if (this.tabElement) {
            const statusElement = this.tabElement.querySelector('.oscillator-status');
            if (statusElement) {
                statusElement.textContent = this.getModel().isActive ? 'ON' : 'OFF';
                statusElement.style.color = this.getModel().isActive ? 'var(--neon-yellow)' : 'var(--neon-cyan)';
            }
        }
    }

    activate() {
        const allTabs = this.tabsContainer.querySelectorAll('.oscillator-tab');
        const allPanels = this.contentContainer.querySelectorAll('.oscillator-panel');
        
        allTabs.forEach(tab => tab.classList.remove('active'));
        allPanels.forEach(panel => panel.classList.remove('active'));

        this.tabElement.classList.add('active');
        this.panelElement.classList.add('active');
        
        if (window.synthController) {
            window.synthController.setActiveOscillator(this.modelId);
        }
    }

    updateAttackDisplay(value) {
        const attackDisplay = this.panelElement.querySelector('[data-display="attack"]');
        if (attackDisplay) {
            attackDisplay.textContent = value.toFixed(3) + 's';
        }
    }

    updateDecayDisplay(value) {
        const decayDisplay = this.panelElement.querySelector('[data-display="decay"]');
        if (decayDisplay) {
            decayDisplay.textContent = value.toFixed(3) + 's';
        }
    }

    updateSustainDisplay(value) {
        const sustainDisplay = this.panelElement.querySelector('[data-display="sustain"]');
        if (sustainDisplay) {
            sustainDisplay.textContent = Math.round(value * 100) + '%';
        }
    }

    updateReleaseDisplay(value) {
        const releaseDisplay = this.panelElement.querySelector('[data-display="release"]');
        if (releaseDisplay) {
            releaseDisplay.textContent = value.toFixed(3) + 's';
        }
    }

    updatePhaseDisplay(value) {
        const phaseDisplay = this.panelElement.querySelector('[data-display="phase"]');
        if (phaseDisplay) {
            if (value === 0) {
                phaseDisplay.textContent = 'Fixed';
            } else if (value === 1) {
                phaseDisplay.textContent = 'Random';
            } else {
                phaseDisplay.textContent = 'Custom';
            }
        }
    }

    bindViewEvents(panelElement) {
        const toggleBtn = panelElement.querySelector('[data-action="toggle"]');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.controller.toggleOscillator(this.modelId);
            });
        }

        const waveformSelect = panelElement.querySelector('[data-control="waveform"]');
        if (waveformSelect) {
            waveformSelect.addEventListener('change', (e) => {
                this.controller.setWaveform(this.modelId, e.target.value);
            });
        }

        const ratioInput = panelElement.querySelector('[data-control="ratio"]');
        if (ratioInput) {
            ratioInput.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                if (value >= 0.1 && value <= 64.0) {
                    this.controller.setRatio(this.modelId, value);
                }
            });
        }

        const attackInput = panelElement.querySelector('[data-control="attack"]');
        if (attackInput) {
            attackInput.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value) / 1000; 
                this.controller.setAttack(this.modelId, value);
                this.updateAttackDisplay(value);
            });
        }

        const decayInput = panelElement.querySelector('[data-control="decay"]');
        if (decayInput) {
            decayInput.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value) / 1000; 
                this.controller.setDecay(this.modelId, value);
                this.updateDecayDisplay(value);
            });
        }

        const sustainInput = panelElement.querySelector('[data-control="sustain"]');
        if (sustainInput) {
            sustainInput.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value) / 100; 
                this.controller.setSustain(this.modelId, value);
                this.updateSustainDisplay(value);
            });
        }

        const releaseInput = panelElement.querySelector('[data-control="release"]');
        if (releaseInput) {
            releaseInput.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value) / 1000; 
                this.controller.setRelease(this.modelId, value);
                this.updateReleaseDisplay(value);
            });
        }

        const phaseInput = panelElement.querySelector('[data-control="phase"]');
        if (phaseInput) {
            phaseInput.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value) / 100; 
                this.controller.setPhase(this.modelId, value);
                this.updatePhaseDisplay(value);
            });
        }
    }
}