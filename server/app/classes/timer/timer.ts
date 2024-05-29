import { NORMAL_SPEED, PANIC_SPEED, SECOND, TICK_DELAY } from '@common/constants';

export type TickCallback = (t: Timer) => void;

export class Timer {
    private elapsedTime: number = 0;
    private countdownFrom: number = 0;

    private timeout: NodeJS.Timer = null;
    private speed: number = NORMAL_SPEED;

    private callback: TickCallback;

    start() {
        this.elapsedTime = 0;
        this.startTicking();
    }

    startCountdown(ms: number) {
        this.countdownFrom = ms;
        this.start();
    }

    togglePause(): boolean {
        if (this.isPaused()) {
            this.resume();
        } else {
            this.pause();
        }

        return this.isPaused();
    }

    pause() {
        this.stopTicking();
    }

    resume() {
        this.startTicking();
    }

    isPaused(): boolean {
        return !this.timeout;
    }

    panic() {
        this.speed = PANIC_SPEED;
    }

    stopPanicking() {
        this.speed = NORMAL_SPEED;
    }

    elapsed(): number {
        return this.elapsedTime;
    }

    remaining(): number {
        return Math.max(0, this.countdownFrom - this.elapsed());
    }

    isDone(): boolean {
        return this.remaining() === 0;
    }

    onTick(callback: TickCallback) {
        this.callback = callback;
    }

    private startTicking() {
        this.stopTicking();
        this.setNextTick();
    }

    private stopTicking() {
        clearTimeout(this.timeout);
        this.timeout = null;
    }

    private tick() {
        this.elapsedTime += SECOND;
        this.setNextTick();

        if (this.callback) {
            this.callback(this);
        }
    }

    private setNextTick() {
        this.timeout = setTimeout(() => this.tick(), this.tickDelay());
    }

    private tickDelay(): number {
        return TICK_DELAY / this.speed;
    }
}
