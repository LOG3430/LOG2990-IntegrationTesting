import { SteppedRange } from './stepped-range';

/* eslint-disable @typescript-eslint/no-magic-numbers --
 * Explanation: we need to use numbers to test the ranges, putting them inline
 * is easier to read and less bloated than making constants
 */

describe('SteppedRange', () => {
    const range = new SteppedRange(2, 4, 2);

    it('should create an instance', () => {
        expect(range).toBeTruthy();
    });

    it('should only contain values on the steps', () => {
        expect(range.contains(2)).toBeTruthy();
        expect(range.contains(3)).toBeFalsy();
        expect(range.contains(4)).toBeTruthy();
    });

    it('should be able to generate an array', () => {
        expect(new SteppedRange(0, 4, 2).asArray()).toEqual([0, 2, 4]);
        expect(new SteppedRange(1, 5, 2).asArray()).toEqual([2, 4]);
        expect(new SteppedRange(1, 1, 1).asArray()).toEqual([1]);
        expect(new SteppedRange(0, -1, 1).asArray()).toEqual([]);
    });
});
