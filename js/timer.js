const DEFAULT_TIME = 900;
const MIN_TIME = 0;
const MAX_TIME = 2700;
const STEP_TIME = 300;

export class TimerManager {
    constructor(buttonElement, navElement) {
        this.button = buttonElement;
        this.nav = navElement;
        this.timeRemaining = DEFAULT_TIME;
        this.isRunning = false;
        this.interval = null;
        this.lastClickTime = null;
        this.isHovering = false;
        this.onComplete = null;

        this.init();
    }

    init() {
        this.button.addEventListener('click', () => this.handleClick());

        this.button.addEventListener('dblclick', () => this.handleDoubleClick());

        this.button.addEventListener('mouseenter', () => {
            this.isHovering = true;
        });

        this.button.addEventListener('mouseleave', () => {
            this.isHovering = false;
        });

        this.button.addEventListener('wheel', (e) => this.handleScroll(e), { passive: false });

        this.updateDisplay();
    }

    handleClick() {
        const now = Date.now();

        if (this.lastClickTime && (now - this.lastClickTime) < 300) {
            return;
        }

        this.lastClickTime = now;

        setTimeout(() => {
            if (Date.now() - this.lastClickTime >= 300) {
                this.toggle();
            }
        }, 310);
    }

    handleDoubleClick() {
        this.reset();
    }

    handleScroll(e) {
        if (!this.isHovering) return;

        e.preventDefault();

        const delta = e.deltaY;
        const direction = delta > 0 ? -1 : 1;

        const currentMinutes = Math.floor(this.timeRemaining / 60);
        const newMinutes = currentMinutes + (direction * 5);
        const roundedMinutes = Math.round(newMinutes / 5) * 5;
        const newTime = roundedMinutes * 60;

        this.timeRemaining = Math.max(MIN_TIME, Math.min(MAX_TIME, newTime));

        this.updateDisplay();

        if (navigator.vibrate) {
            navigator.vibrate(10);
        }
    }

    toggle() {
        if (this.isRunning) {
            this.pause();
        } else {
            this.start();
        }
    }

    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.updateDisplay();

        this.fadeNav(false);

        this.interval = setInterval(() => {
            if (this.timeRemaining > 0) {
                this.timeRemaining--;
                this.updateDisplay();
            } else {
                this.complete();
            }
        }, 1000);
    }

    pause() {
        if (!this.isRunning) return;

        this.isRunning = false;
        this.updateDisplay();

        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

        this.fadeNav(true);
    }

    reset() {
        this.pause();
        this.timeRemaining = DEFAULT_TIME;
        this.updateDisplay();
    }

    complete() {
        this.isRunning = false;

        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

        this.fadeNav(true);

        if (this.onComplete) {
            this.onComplete();
        }

        this.updateDisplay();
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        this.button.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    fadeNav(show) {
        if (show) {
            this.nav.classList.remove('fade-out');
        } else {
            setTimeout(() => {
                if (this.isRunning) {
                    this.nav.classList.add('fade-out');
                }
            }, 1000);
        }
    }

    onCompletion(callback) {
        this.onComplete = callback;
    }

    setNavHoverState(isHovering) {
        if (isHovering) {
            this.nav.classList.remove('fade-out');
        } else if (this.isRunning) {
            this.fadeNav(false);
        }
    }

    getTimeRemaining() {
        return this.timeRemaining;
    }

    isTimerRunning() {
        return this.isRunning;
    }
}
