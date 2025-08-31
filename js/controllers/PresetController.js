class PresetController {
    constructor(synthController) {
        this.synthController = synthController;
        this.presets = [];
        this.init();
    }

    async init() {
        await this.loadPresets();
        this.bindEvents();
    }

    async loadPresets() {
        try {
            console.log('PresetController: Caricamento preset...');
            const response = await fetch('presets.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.presets = data.presets || [];
            console.log('PresetController: Preset caricati:', this.presets.length);
            this.populatePresetSelector();
            
            if (this.presets.length > 0) {
                console.log('PresetController: Caricamento automatico del primo preset:', this.presets[0].name);
                this.loadPresetByName(this.presets[0].name);
            }
        } catch (error) {
            console.error('PresetController: Errore nel caricamento dei preset:', error);
            this.presets = [];
        }
    }

    populatePresetSelector() {
        const presetSelector = document.getElementById('preset-select');
        if (!presetSelector) {
            console.error('PresetController: Elemento preset-select non trovato!');
            return;
        }

        presetSelector.innerHTML = '';
        
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = 'Seleziona un preset...';
        presetSelector.appendChild(emptyOption);
        
        this.presets.forEach(preset => {
            const option = document.createElement('option');
            option.value = preset.name;
            option.textContent = preset.name;
            presetSelector.appendChild(option);
        });
        
        console.log('PresetController: Selettore preset popolato');
    }

    bindEvents() {
        console.log('PresetController: Binding events...');
        
        const exportBtn = document.getElementById('export-preset');
        const importBtn = document.getElementById('import-preset');
        const fileInput = document.getElementById('preset-file-input');
        const presetSelector = document.getElementById('preset-select');

        if (!exportBtn) {
            console.error('PresetController: Elemento export-preset non trovato!');
            return;
        }
        if (!importBtn) {
            console.error('PresetController: Elemento import-preset non trovato!');
            return;
        }
        if (!fileInput) {
            console.error('PresetController: Elemento preset-file-input non trovato!');
            return;
        }

        console.log('PresetController: Elementi trovati, aggiungendo event listeners...');

        exportBtn.addEventListener('click', () => {
            console.log('PresetController: Pulsante export cliccato');
            this.exportCurrentPreset();
        });

        importBtn.addEventListener('click', () => {
            console.log('PresetController: Pulsante import cliccato');
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.importPresetFromFile(e.target.files[0]);
            }
        });

        if (presetSelector) {
            presetSelector.addEventListener('change', (e) => {
                const selectedPresetName = e.target.value;
                if (selectedPresetName) {
                    this.loadPresetByName(selectedPresetName);
                }
            });
        } else {
            console.error('PresetController: Elemento preset-select non trovato!');
        }

        console.log('PresetController: Event listeners aggiunti con successo');
    }

    exportCurrentPreset() {
        console.log('PresetController: Iniziando export...');
        
        try {
            const preset = this.getCurrentSynthState();
            if (!preset) {
                console.error('PresetController: Impossibile ottenere lo stato del synth');
                return;
            }
            
            console.log('PresetController: Stato del synth ottenuto:', preset);
            
            const presetData = JSON.stringify(preset, null, 2);
            console.log('PresetController: JSON generato:', presetData);
            
            const blob = new Blob([presetData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `fm-synth-preset-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('Preset esportato con successo');
        } catch (error) {
            console.error('PresetController: Errore durante l\'export:', error);
        }
    }

    getCurrentSynthState() {
        if (!this.synthController) {
            console.error('PresetController: SynthController non disponibile');
            return null;
        }

        try {
            return {
                name: "Preset Corrente",
            oscillators: this.synthController.oscillators.map(osc => ({
                id: osc.id,
                ...osc.getSettings()
            })),
            filter: this.synthController.filterModel.getSettings(),
            filterEnvelope: this.synthController.filterEnvelopeModel.getSettings(),
            pitchEnvelope: this.synthController.pitchEnvelopeModel.getSettings(),
            delay: this.synthController.delayModel.getSettings(),
            reverb: this.synthController.reverbModel.getSettings(),
            compressor: this.synthController.compressorModel.getSettings(),
            modulationMatrix: this.synthController.modulationMatrixView.getMatrixValues(),
            outputValues: this.synthController.modulationMatrixView.getOutputValues()
            };
        } catch (error) {
            console.error('PresetController: Errore nel recupero dello stato del synth:', error);
            return null;
        }
    }

    loadPresetByName(presetName) {
        console.log('PresetController: Caricamento preset:', presetName);
        
        const preset = this.presets.find(p => p.name === presetName);
        if (!preset) {
            console.error('PresetController: Preset non trovato:', presetName);
            return;
        }
        
        console.log('PresetController: Preset trovato, applicazione...');
        this.applyPreset(preset);
        
        const presetSelector = document.getElementById('preset-select');
        if (presetSelector) {
            presetSelector.value = presetName;
        }
    }

    async importPresetFromFile(file) {
        try {
            console.log('PresetController: Iniziando import...');
            
            const text = await file.text();
            const preset = JSON.parse(text);
            
            if (!preset.oscillators || !preset.filter) {
                console.error('PresetController: File non valido - formato preset non riconosciuto');
                return;
            }
            
            console.log('PresetController: Preset caricato:', preset);
            
            // Applica il preset
            this.applyPreset(preset);
            
            console.log('PresetController: Preset importato con successo');
            
        } catch (error) {
            console.error('PresetController: Errore nell\'importazione del preset:', error);
        }
    }

    applyPreset(preset) {
        console.log('PresetController: Applicando preset...');
        
        try {
            if (preset.oscillators) {
                preset.oscillators.forEach(osc => {
                    if (this.synthController.oscillators[osc.id]) {
                        const oscillator = this.synthController.oscillators[osc.id];
                        oscillator.applySettings(osc);
                    }
                });
            }

            if (preset.filter) {
                this.synthController.filterModel.applySettings(preset.filter);
            }

            if (preset.filterEnvelope) {
                this.synthController.filterEnvelopeModel.applySettings(preset.filterEnvelope);
            }

            if (preset.pitchEnvelope) {
                this.synthController.pitchEnvelopeModel.applySettings(preset.pitchEnvelope);
            }

            if (preset.delay) {
                if (preset.delay.delayTime !== undefined) {
                    this.synthController.setDelayTime(preset.delay.delayTime);
                }
                if (preset.delay.feedback !== undefined) {
                    this.synthController.setDelayFeedback(preset.delay.feedback);
                }
                if (preset.delay.wet !== undefined) {
                    this.synthController.setDelayWet(preset.delay.wet);
                }
                if (preset.delay.isEnabled !== undefined) {
                    this.synthController.setDelayEnabled(preset.delay.isEnabled);
                }
            }

            if (preset.reverb) {
                if (preset.reverb.decay !== undefined) {
                    this.synthController.setReverbDecay(preset.reverb.decay);
                }
                if (preset.reverb.predelay !== undefined) {
                    this.synthController.setReverbPredelay(preset.reverb.predelay);
                }
                if (preset.reverb.dryWet !== undefined) {
                    this.synthController.setReverbDryWet(preset.reverb.dryWet);
                }
                if (preset.reverb.isEnabled !== undefined) {
                    this.synthController.setReverbEnabled(preset.reverb.isEnabled);
                }
            }

            if (preset.compressor) {
                if (preset.compressor.threshold !== undefined) {
                    this.synthController.setCompressorThreshold(preset.compressor.threshold);
                }
                if (preset.compressor.attack !== undefined) {
                    this.synthController.setCompressorAttack(preset.compressor.attack);
                }
                if (preset.compressor.release !== undefined) {
                    this.synthController.setCompressorRelease(preset.compressor.release);
                }
                if (preset.compressor.ratio !== undefined) {
                    this.synthController.setCompressorRatio(preset.compressor.ratio);
                }
                if (preset.compressor.isEnabled !== undefined) {
                    this.synthController.setCompressorEnabled(preset.compressor.isEnabled);
                }
            }

            if (preset.modulationMatrix) {
                this.synthController.modulationMatrixView.setMatrixValues(preset.modulationMatrix);
            }

            if (preset.outputValues) {
                this.synthController.modulationMatrixView.setOutputValues(preset.outputValues);
            }

            this.updateAllViews();
            
            console.log('PresetController: Preset applicato con successo');
            
        } catch (error) {
            console.error('PresetController: Errore nell\'applicazione del preset:', error);
        }
    }

    updateAllViews() {
        console.log('PresetController: Aggiornando tutte le viste...');
        
        try {
            if (this.synthController.oscillatorViews) {
                this.synthController.oscillatorViews.forEach((view, index) => {
                    if (view && view.updateDisplay) {
                        view.updateDisplay();
                    }
                });
            }


            if (this.synthController.filterView && this.synthController.filterView.updateDisplay) {
                this.synthController.filterView.updateDisplay();
            }
            if (this.synthController.filterEnvelopeView && this.synthController.filterEnvelopeView.updateAllControls) {
                this.synthController.filterEnvelopeView.updateAllControls(this.synthController.filterEnvelopeModel);
            }
            if (this.synthController.pitchEnvelopeView && this.synthController.pitchEnvelopeView.updateAllControls) {
                this.synthController.pitchEnvelopeView.updateAllControls(this.synthController.pitchEnvelopeModel);
            }
            if (this.synthController.delayView && this.synthController.delayView.updateAllControls) {
                this.synthController.delayView.updateAllControls(this.synthController.delayModel);
            }
            if (this.synthController.reverbView && this.synthController.reverbView.updateAllControls) {
                this.synthController.reverbView.updateAllControls(this.synthController.reverbModel);
            }
            if (this.synthController.compressorView && this.synthController.compressorView.updateAllControls) {
                this.synthController.compressorView.updateAllControls(this.synthController.compressorModel);
            }

            console.log('PresetController: Tutte le viste aggiornate');
        } catch (error) {
            console.error('PresetController: Errore nell\'aggiornamento delle viste:', error);
        }
    }
}

export { PresetController };
