import { PANIC_SPEED, SECOND } from '@common/constants';
import { Timer } from './timer';

/* eslint-disable @typescript-eslint/no-magic-numbers */

describe('Timer', () => {
    let timer: Timer;

    jest.useFakeTimers();

    beforeEach(() => {
        timer = new Timer();
    });

    afterEach(() => {
        jest.clearAllTimers();
    });

    it('should be defined', () => {
        expect(timer).toBeDefined();
    });

    describe('start / pause', () => {
        beforeEach(() => {
            timer.start();
        });

        it('should tick every second', () => {
            expect(jest.getTimerCount()).toEqual(1);
            jest.runOnlyPendingTimers();
            expect(jest.getTimerCount()).toEqual(1);
            expect(timer.elapsed()).toEqual(SECOND);
        });

        it('should be stoppable with pause and keep elapsed time', () => {
            jest.runOnlyPendingTimers();
            timer.pause();
            expect(timer.isPaused()).toBe(true);
            expect(jest.getTimerCount()).toEqual(0);
            expect(timer.elapsed()).toEqual(SECOND);
        });

        it('should be resumable', () => {
            jest.runOnlyPendingTimers();
            timer.pause();
            expect(timer.isPaused()).toBe(true);
            expect(jest.getTimerCount()).toEqual(0);
            expect(timer.elapsed()).toEqual(SECOND);

            timer.resume();
            jest.runOnlyPendingTimers();
            expect(timer.elapsed()).toEqual(2 * SECOND);
            expect(timer.isPaused()).toBe(false);
        });

        it('should have a toggle', () => {
            timer.start();
            expect(jest.getTimerCount()).toEqual(1);

            expect(timer.togglePause()).toBe(true);
            expect(jest.getTimerCount()).toEqual(0);

            expect(timer.togglePause()).toBe(false);
            expect(jest.getTimerCount()).toEqual(1);
        });
    });

    describe('countdown', () => {
        const countFrom = 3 * SECOND;

        beforeEach(() => {
            timer.startCountdown(countFrom);
        });

        it('should countdown and stay at 0', () => {
            expect(timer.remaining()).toEqual(countFrom);

            jest.runOnlyPendingTimers();
            expect(timer.remaining()).toEqual(countFrom - SECOND);

            jest.runOnlyPendingTimers();
            expect(timer.remaining()).toEqual(countFrom - 2 * SECOND);

            jest.runOnlyPendingTimers();
            expect(timer.remaining()).toEqual(0);

            jest.runOnlyPendingTimers();
            expect(timer.remaining()).toEqual(0);

            expect(timer.isDone()).toBe(true);
        });

        it('should be stoppable with pause and keep remaining time', () => {
            jest.runOnlyPendingTimers();
            timer.pause();
            expect(jest.getTimerCount()).toEqual(0);
            expect(timer.remaining()).toEqual(countFrom - SECOND);
        });
    });

    describe('panic', () => {
        const countFrom = 8 * SECOND;

        beforeEach(() => {
            timer.startCountdown(countFrom);
        });

        it('should tick PANIC_SPEED times faster when panicking and stop when told', () => {
            timer.panic();
            jest.runOnlyPendingTimers();
            jest.advanceTimersByTime(SECOND);
            expect(timer.remaining()).toEqual(countFrom - SECOND - PANIC_SPEED * SECOND);

            timer.stopPanicking();
            jest.advanceTimersByTime(SECOND);
            expect(timer.remaining()).toEqual(countFrom - PANIC_SPEED * SECOND - 2 * SECOND);
        });
    });

    describe('on tick', () => {
        let onTick: jest.Mock;
        const countFrom = 8 * SECOND;

        beforeEach(() => {
            timer.startCountdown(countFrom);

            onTick = jest.fn();
            timer.onTick(onTick);
        });

        it('should be called on every tick', () => {
            timer.panic();
            jest.runOnlyPendingTimers();
            expect(onTick).toHaveBeenCalledTimes(1);

            jest.advanceTimersByTime(SECOND);
            expect(onTick).toHaveBeenCalledTimes(5);
        });

        it('should be able to stop the timer', () => {
            onTick.mockImplementation((t: Timer) => t.pause());
            jest.runOnlyPendingTimers();
            expect(timer.elapsed()).toEqual(SECOND);
            expect(jest.getTimerCount()).toEqual(0);
        });
    });
});
