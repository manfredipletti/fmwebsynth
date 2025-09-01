document.addEventListener('DOMContentLoaded', async () => {
    try {
        const { SynthController } = await import('./controllers/SynthController.js');    
        window.synthController = new SynthController();
        const { PresetController } = await import('./controllers/PresetController.js');
        window.presetController = new PresetController(window.synthController);
        addTestButton();
        initMasterVolume();
        initEnvelopeTabs();
        setInterval(() => {
            if (window.synthController && window.synthController.updateCompressorReduction) {
                window.synthController.updateCompressorReduction();
            }
        }, 16);

        
    } catch (error) {
        console.error('Failed to initialize application:', error);
        showErrorMessage('Failed to initialize application.');
    }
});


function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff4444;
        color: white;
        padding: 15px;
        border-radius: 5px;
        font-family: 'Share Tech Mono', monospace;
        z-index: 1000;
        max-width: 300px;
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

function addTestButton() {
    const header = document.querySelector('.synth-header');
    if (!header) return;
    
    const testButton = document.createElement('button');
    testButton.textContent = 'TEST SOUND';
    testButton.className = 'test-button';
    testButton.style.cssText = `
        background: var(--neon-yellow);
        color: var(--darker-bg);
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        font-family: 'Share Tech Mono', monospace;
        font-weight: bold;
        cursor: pointer;
        margin-top: 15px;
        text-transform: uppercase;
        letter-spacing: 1px;
        transition: all 0.3s ease;
    `;
    testButton.addEventListener('click', () => {
        testSynth();
    });
    
    header.appendChild(testButton);
}

function initMasterVolume() {
    const volumeKnob = document.getElementById('master-volume-knob');
    const volumeDisplay = document.getElementById('volume-display');
    const volumeBar = document.getElementById('volume-bar');
    const knobIndicator = document.getElementById('knob-indicator');
    

    const initialVolume = window.synthController ? window.synthController.getMasterVolume() : 0.7;
    volumeKnob.value = Math.round(initialVolume * 100);
    updateVolumeDisplay(initialVolume);
    updateKnobIndicator(initialVolume);
    

    volumeKnob.addEventListener('input', (e) => {
        const volume = parseFloat(e.target.value) / 100;
        if (window.synthController) {
            window.synthController.setMasterVolume(volume);
        }
        updateVolumeDisplay(volume);
        updateKnobIndicator(volume);
    });

    let isDragging = false;
    let startY = 0;
    let startValue = 0;

    volumeKnob.addEventListener('mousedown', (e) => {
        isDragging = true;
        startY = e.clientY;
        startValue = parseFloat(volumeKnob.value);
        document.body.style.cursor = 'ns-resize';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const deltaY = startY - e.clientY; 
        const sensitivity = 0.5; 
        const newValue = Math.max(0, Math.min(100, startValue + (deltaY * sensitivity)));  
        volumeKnob.value = newValue;
        const inputEvent = new Event('input');
        volumeKnob.dispatchEvent(inputEvent);
        e.preventDefault();
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            document.body.style.cursor = '';
        }
    });

    volumeKnob.addEventListener('touchstart', (e) => {
        isDragging = true;
        startY = e.touches[0].clientY;
        startValue = parseFloat(volumeKnob.value);
        e.preventDefault();
    });
    
    setInterval(() => {
        if (window.synthController && window.synthController.isInitialized) {
            const meterLevel = window.synthController.getMeterLevel();
            updateVolumeMeter(meterLevel);
        }
    }, 50); 
}

function updateVolumeDisplay(volume) {
    const volumeDisplay = document.getElementById('volume-display');
    if (volumeDisplay) {
        volumeDisplay.textContent = Math.round(volume * 100) + '%';
    }
}

function updateVolumeMeter(level) {
    const volumeBar = document.getElementById('volume-bar');
    if (volumeBar) {
        if (level < 0.001) {
            const currentHeight = parseFloat(volumeBar.style.height) || 0;
            const targetHeight = currentHeight * 0.85; 
            volumeBar.style.height = targetHeight + '%';
            volumeBar.classList.remove('active');
            return;
        }
        const percentage = Math.min(100, Math.max(0, level * 100));
        
        const currentHeight = parseFloat(volumeBar.style.height) || 0;
        const targetHeight = Math.max(percentage, currentHeight * 0.92);
        volumeBar.style.height = targetHeight + '%';
        updateMeterColor(volumeBar, targetHeight);
        
        if (targetHeight > 85) {
            volumeBar.classList.add('active');
        } else {
            volumeBar.classList.remove('active');
        }
    }
}

function updateMeterColor(volumeBar, percentage) {
    let color;
    if (percentage > 90) {

        color = '#ff0040';
    } else if (percentage > 75) {

        color = '#ffaa00';
    } else if (percentage > 50) {

        color = '#ffff00';
    } else if (percentage > 25) {

        color = '#88ff00';
    } else {

        color = '#00ff00';
    }
    volumeBar.style.background = color;
}

function updateKnobIndicator(volume) {
    const knobIndicator = document.getElementById('knob-indicator');
    if (knobIndicator) {
        const angle = (volume * 270) - 135;
        knobIndicator.style.transform = `translateX(-50%) rotate(${angle}deg)`;
        knobIndicator.style.transformOrigin = 'center 22px'; 
    }
}

window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    showErrorMessage('An error occurred.');
});


window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    showErrorMessage('An unhandled error occurred.');
});


async function testSynth() {    

    window.synthController.noteOn(60, 100); // Middle C
    setTimeout(() => {
        window.synthController.noteOff(60);
    }, 2000);
}


function initEnvelopeTabs() {
    const tabs = document.querySelectorAll('.envelope-tab');
    const panels = document.querySelectorAll('.envelope-panel');
    
    
    const pitchTab = document.querySelector('[data-envelope="pitch"]');
    const pitchPanel = document.querySelector('[data-envelope="pitch"].envelope-panel');
    if (pitchTab && pitchPanel) {
        pitchTab.classList.add('active');
        pitchPanel.classList.add('active');
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetEnvelope = tab.dataset.envelope;
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            
            const targetPanel = document.querySelector(`[data-envelope="${targetEnvelope}"].envelope-panel`);
            if (targetPanel) {
                targetPanel.classList.add('active');
                if (targetEnvelope === 'filter' && window.synthController && window.synthController.filterEnvelopeView) {
                    window.synthController.filterEnvelopeView.updateAllControls(window.synthController.filterEnvelopeModel);
                } else if (targetEnvelope === 'pitch' && window.synthController && window.synthController.pitchEnvelopeView) {
                    window.synthController.pitchEnvelopeView.updateAllControls(window.synthController.pitchEnvelopeModel);
                }
            }
        });
    });
    
    initEnvelopeDisplays();
    
}

function initEnvelopeDisplays() {
    updateEnvelopeDisplay('pitch-amount-value', 0, ' cents');
    updateEnvelopeDisplay('pitch-attack-value', 0.0, 's');
    updateEnvelopeDisplay('pitch-decay-value', 0.3, 's');
    updateEnvelopeDisplay('pitch-sustain-value', 0.0, '');
    updateEnvelopeDisplay('pitch-release-value', 1.0, 's');
    
    updateEnvelopeDisplay('filter-amount-value', 0, ' %');
    updateEnvelopeDisplay('filter-attack-value', 0.001, 's');
    updateEnvelopeDisplay('filter-decay-value', 0.3, 's');
    updateEnvelopeDisplay('filter-sustain-value', 1.0, '%');
    updateEnvelopeDisplay('filter-release-value', 1.0, 's');
}

function updateEnvelopeDisplay(elementId, value, unit) {
    const element = document.getElementById(elementId);
    if (element) {
        if (unit === 's') {
            element.textContent = value.toFixed(3) + unit;
        } else if (unit === ' cents') {
            element.textContent = value + unit;
        } else if (unit === ' Hz') {
            element.textContent = value + unit;
        } else if (unit === ' st') {
            element.textContent = value + unit;
        } else if (unit === '%') {
            element.textContent = value + unit;
        } else {
            element.textContent = value.toFixed(1);
        }
    }
}

function initMIDIChannelSelector() {
    const channelSelect = document.getElementById('midi-channel');
    if (channelSelect && window.synthController) {
        if (!window.synthController.selectedChannel) {
            window.synthController.selectedChannel = 1;
        }
        channelSelect.value = window.synthController.selectedChannel;
        channelSelect.addEventListener('change', (e) => {
            window.synthController.selectedChannel = parseInt(e.target.value);
        });
    }
}

setTimeout(() => {
    initMIDIChannelSelector();
}, 200);