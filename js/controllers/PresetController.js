class PresetController {
    constructor(synthController) {
        this.synthController = synthController;
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        console.log('PresetController: Binding events...');
        
        const exportBtn = document.getElementById('export-preset');
        const importBtn = document.getElementById('import-preset');
        const fileInput = document.getElementById('preset-file-input');

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

    importPresetFromFile(file) {
        console.log('Import preset - da implementare');
    }
}

export { PresetController };
