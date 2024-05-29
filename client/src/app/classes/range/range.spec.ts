import { Range } from './range';

/* eslint-disable @typescript-eslint/no-magic-numbers --
 * Explanation: we need to use numbers to test the ranges, putting them inline
 * is easier to read and less bloated than making constants
 */

describe('Range', () => {
    const range = new Range(-1, 1);

    it('should create an instance', () => {
        expect(range).toBeTruthy();
    });

    it('should contain values in its range', () => {
        expect(range.contains(-1)).toBeTruthy();
        expect(range.contains(0)).toBeTruthy();
        expect(range.contains(1)).toBeTruthy();
    });

    it('should contain not values out of its range', () => {
        expect(range.contains(2)).toBeFalsy();
        expect(range.contains(-2)).toBeFalsy();
    });

    it('should contain single value when min == max', () => {
        const inverted = new Range(0, 0);
        expect(inverted.contains(-1)).toBeFalsy();
        expect(inverted.contains(0)).toBeTruthy();
        expect(inverted.contains(1)).toBeFalsy();
    });

    it('should contain no value when min > max', () => {
        const inverted = new Range(1, -1);
        expect(inverted.contains(-1)).toBeFalsy();
        expect(inverted.contains(0)).toBeFalsy();
        expect(inverted.contains(1)).toBeFalsy();
    });

    it('should be able to generate an array', () => {
        expect(range.asArray()).toEqual([-1, 0, 1]);
        expect(new Range(0, 0).asArray()).toEqual([0]);
        expect(new Range(1, -1).asArray()).toEqual([]);
    });
});
