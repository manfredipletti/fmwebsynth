document.addEventListener('DOMContentLoaded', async () => {
    console.log('FM Web Synth - Initializing...');
    
    try {
        const { SynthController } = await import('./controllers/SynthController.js');
        
        window.synthController = new SynthController();
        
        addTestButton();

        
        console.log('FM Web Synth - Ready!');
        
    } catch (error) {
        console.error('Failed to initialize application:', error);
        showErrorMessage('Failed to initialize application. Please check the console for details.');
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

window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    showErrorMessage('An error occurred. Check console for details.');
});


window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    showErrorMessage('An unhandled error occurred. Check console for details.');
});


async function testSynth() {
    if (!window.synthController || !window.synthController.isInitialized) {
        showErrorMessage('Synth not ready yet. Please wait...');
        return;
    }
    
    try {
        

        window.synthController.noteOn(60, 100); // Middle C
        

        setTimeout(() => {
            window.synthController.noteOff(60);
        }, 2000);
        
        console.log('Test sound played');
        
    } catch (error) {
        console.error('Error during test:', error);
        showErrorMessage('Failed to play test sound. Check console for details.');
    }
}