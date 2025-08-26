export class ModulationMatrixView {
    constructor(controller) {
        this.controller = controller;
        this.isDragging = false;
        this.dragStartY = 0;
        this.dragStartValue = 0;
        this.dragElement = null;
        this.sensitivity = 2; 
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        const matrixContainer = document.getElementById('modulation-matrix');
        if (!matrixContainer) return;


        const matrixCells = matrixContainer.querySelectorAll('.matrix-cell');
        matrixCells.forEach(cell => {
            this.bindDragEvents(cell);
            cell.addEventListener('input', () => this.updateCellIllumination(cell));
            cell.addEventListener('change', () => this.updateCellIllumination(cell));
        });

        const outputCells = matrixContainer.querySelectorAll('.output-cell');
        outputCells.forEach(cell => {
            this.bindDragEvents(cell);
            cell.addEventListener('input', () => {
                this.updateCellIllumination(cell);
                this.updateOutputVolume(cell);
            });
            cell.addEventListener('change', () => {
                this.updateCellIllumination(cell);
                this.updateOutputVolume(cell);
            });
        });

        this.initializeCellIllumination();
    }

    bindDragEvents(element) {
        element.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.startDrag(e, element);
        });

        element.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startDrag(e, element);
        });

        element.addEventListener('selectstart', (e) => {
            e.preventDefault();
        });
    }

    startDrag(e, element) {
        this.isDragging = true;
        this.dragElement = element;
        this.dragStartY = this.getY(e);
        this.dragStartValue = parseInt(element.value) || 0;
        
        element.classList.add('dragging');
        element.blur(); 


        document.addEventListener('mousemove', this.handleDrag.bind(this));
        document.addEventListener('mouseup', this.endDrag.bind(this));
        document.addEventListener('touchmove', this.handleDrag.bind(this));
        document.addEventListener('touchend', this.endDrag.bind(this));

       
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'ns-resize';
    }

    handleDrag(e) {
        if (!this.isDragging || !this.dragElement) return;

        e.preventDefault();
        
        const currentY = this.getY(e);
        const deltaY = this.dragStartY - currentY; // Inverted: up = increase
        const deltaValue = Math.round(deltaY / this.sensitivity);
        const newValue = Math.max(0, Math.min(100, this.dragStartValue + deltaValue));

        this.dragElement.value = newValue;
        

        this.dragElement.dispatchEvent(new Event('input', { bubbles: true }));
    }

    endDrag(e) {
        if (!this.isDragging) return;

        this.isDragging = false;
        
        if (this.dragElement) {
            this.dragElement.classList.remove('dragging');
            this.dragElement = null;
        }


        document.removeEventListener('mousemove', this.handleDrag.bind(this));
        document.removeEventListener('mouseup', this.endDrag.bind(this));
        document.removeEventListener('touchmove', this.handleDrag.bind(this));
        document.removeEventListener('touchend', this.endDrag.bind(this));


        document.body.style.userSelect = '';
        document.body.style.cursor = '';


        if (this.dragElement) {
            this.dragElement.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    getY(e) {
        if (e.touches && e.touches.length > 0) {
            return e.touches[0].clientY;
        }
        return e.clientY;
    }

    updateMatrixValue(modulator, carrier, value) {
        const cell = document.querySelector(`[data-modulator="${modulator}"][data-carrier="${carrier}"]`);
        if (cell) {
            cell.value = Math.max(0, Math.min(100, value));
        }
    }


    updateOutputValue(oscillator, value) {
        const cell = document.querySelector(`[data-oscillator="${oscillator}"]`);
        if (cell) {
            cell.value = Math.max(0, Math.min(100, value));
        }
    }


    getMatrixValues() {
        const values = {};
        const cells = document.querySelectorAll('.matrix-cell');
        
        cells.forEach(cell => {
            const modulator = parseInt(cell.dataset.modulator);
            const carrier = parseInt(cell.dataset.carrier);
            const value = parseInt(cell.value) || 0;
            
            if (!values[modulator]) values[modulator] = {};
            values[modulator][carrier] = value;
        });
        
        return values;
    }


    getOutputValues() {
        const values = {};
        const cells = document.querySelectorAll('.output-cell');
        
        cells.forEach(cell => {
            const oscillator = parseInt(cell.dataset.oscillator);
            const value = parseInt(cell.value) || 0;
            values[oscillator] = value;
        });
        
        return values;
    }

    initializeCellIllumination() {
        const matrixContainer = document.getElementById('modulation-matrix');
        if (!matrixContainer) return;

        const matrixCells = matrixContainer.querySelectorAll('.matrix-cell');
        matrixCells.forEach(cell => {
            this.updateCellIllumination(cell);
        });

        const outputCells = matrixContainer.querySelectorAll('.output-cell');
        outputCells.forEach(cell => {
            this.updateCellIllumination(cell);
        });
    }

    updateCellIllumination(cell) {
        const value = parseInt(cell.value) || 0;
        
        const valueClasses = [
            'value-1-10', 'value-11-20', 'value-21-30', 'value-31-40', 'value-41-50',
            'value-51-60', 'value-61-70', 'value-71-80', 'value-81-90', 'value-91-100'
        ];
        
        valueClasses.forEach(cls => {
            cell.classList.remove(cls);
        });

        if (value > 0) {
            const opacity = Math.min(value / 100 * 0.6, 0.6);
            const isOutputCell = cell.classList.contains('output-cell');
            
            if (isOutputCell) {
                cell.style.background = `linear-gradient(135deg, rgba(0, 255, 255, ${opacity}) 0%, var(--darker-bg) 100%)`;
                if (value > 50) {
                    cell.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.6)';
                } else {
                    cell.style.boxShadow = 'none';
                }
            } else {
                cell.style.background = `linear-gradient(135deg, rgba(0, 255, 0, ${opacity}) 0%, var(--darker-bg) 100%)`;
                if (value > 50) {
                    cell.style.boxShadow = '0 0 15px rgba(0, 255, 0, 0.6)';
                } else {
                    cell.style.boxShadow = 'none';
                }
            }
        } else {
            cell.style.background = 'var(--darker-bg)';
            cell.style.boxShadow = 'none';
        }
    }

    updateOutputVolume(cell) {
        const oscillatorId = parseInt(cell.dataset.oscillator);
        const value = parseInt(cell.value) || 0;
        const volume = value / 100; 
        
        if (this.controller && this.controller.updateOutputVolume) {
            this.controller.updateOutputVolume(oscillatorId, volume);
        }
    }

    getOutputValues() {
        const matrixContainer = document.getElementById('modulation-matrix');
        if (!matrixContainer) return {};

        const values = {};
        const outputCells = matrixContainer.querySelectorAll('.output-cell');
        
        outputCells.forEach(cell => {
            const oscillatorId = parseInt(cell.dataset.oscillator);
            const value = parseInt(cell.value) || 0;
            values[oscillatorId] = value;
        });
        
        return values;
    }

    getModulationValues() {
        const matrixContainer = document.getElementById('modulation-matrix');
        if (!matrixContainer) return {};

        const values = {};
        const matrixCells = matrixContainer.querySelectorAll('.matrix-cell');
        
        matrixCells.forEach(cell => {
            const modulatorId = parseInt(cell.dataset.modulator);
            const carrierId = parseInt(cell.dataset.carrier);
            const value = parseInt(cell.value) || 0;
            
            if (!values[modulatorId]) {
                values[modulatorId] = {};
            }
            values[modulatorId][carrierId] = value;
        });
        
        return values;
    }
}
