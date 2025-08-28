export class DelayView {
    constructor(controller) {
        this.controller = controller;
        this.bindViewEvents();
    }

    bindViewEvents() {
 
        const enableToggle = document.getElementById('delay-enable');
        if (enableToggle) {
            enableToggle.addEventListener('change', (e) => {
                this.controller.setDelayEnabled(e.target.checked);
            });
        }

  
        const timeSlider = document.getElementById('delay-time');
        if (timeSlider) {
            timeSlider.addEventListener('input', (e) => {
                const time = this.sliderToTime(parseInt(e.target.value));
                this.controller.setDelayTime(time);
                this.updateTimeDisplay(time);
            });
        }


        const feedbackSlider = document.getElementById('delay-feedback');
        if (feedbackSlider) {
            feedbackSlider.addEventListener('input', (e) => {
                const feedback = parseInt(e.target.value) / 100;
                this.controller.setDelayFeedback(feedback);
                this.updateFeedbackDisplay(feedback);
            });
        }

  
        const wetSlider = document.getElementById('delay-wet');
        if (wetSlider) {
            wetSlider.addEventListener('input', (e) => {
                const wet = parseInt(e.target.value) / 100;
                this.controller.setDelayWet(wet);
                this.updateWetDisplay(wet);
            });
        }
    }


    sliderToTime(sliderValue) {
        const minTime = 0;
        const maxTime = 1;
        const normalizedValue = sliderValue / 1000; 
        const time = minTime + (maxTime - minTime) * normalizedValue;
        return time;
    }

    timeToSlider(time) {
        const minTime = 0;
        const maxTime = 1;
        const clampedTime = Math.max(minTime, Math.min(maxTime, time));
        const normalizedValue = (clampedTime - minTime) / (maxTime - minTime);
        return Math.round(normalizedValue * 1000);
    }

    updateTimeDisplay(time) {
        const display = document.getElementById('delay-time-value');
        if (display) {
            display.textContent = `${time.toFixed(3)}s`;
        }
    }

    updateFeedbackDisplay(feedback) {
        const display = document.getElementById('delay-feedback-value');
        if (display) {
            display.textContent = `${Math.round(feedback * 100)}%`;
        }
    }

    updateWetDisplay(wet) {
        const display = document.getElementById('delay-wet-value');
        if (display) {
            display.textContent = `${Math.round(wet * 100)}%`;
        }
    }

    updateAllControls(model) {
        if (!model) return;

  
        const timeSlider = document.getElementById('delay-time');
        if (timeSlider) {
            timeSlider.value = this.timeToSlider(model.getDelayTime());
        }

        const feedbackSlider = document.getElementById('delay-feedback');
        if (feedbackSlider) {
            feedbackSlider.value = model.getFeedback() * 100;
        }

        const wetSlider = document.getElementById('delay-wet');
        if (wetSlider) {
            wetSlider.value = model.getWet() * 100;
        }


        this.updateTimeDisplay(model.getDelayTime());
        this.updateFeedbackDisplay(model.getFeedback());
        this.updateWetDisplay(model.getWet());


        const enableToggle = document.getElementById('delay-enable');
        if (enableToggle) {
            enableToggle.checked = model.getIsEnabled();
        }
    }
}
