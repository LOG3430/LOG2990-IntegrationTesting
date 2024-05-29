import { DateFormatterPipe } from './date-formatter.pipe';

/* eslint-disable @typescript-eslint/no-magic-numbers */

describe('DateFormatterPipe', () => {
    it('create an instance', () => {
        const pipe = new DateFormatterPipe();
        expect(pipe).toBeTruthy();
        expect(pipe.transform(new Date(2000, 0, 1, 13, 0, 0).toISOString())).toEqual('2000-01-01 13:00:00');
    });
});
