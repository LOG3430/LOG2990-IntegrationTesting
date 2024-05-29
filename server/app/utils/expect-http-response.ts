import { Response } from 'express';

export const expectHttpResponse = <T>(status: number, body?: T): Response => {
    const res = {} as unknown as Response;
    res.status = (code) => {
        expect(code).toEqual(status);
        return res;
    };

    if (body !== undefined) {
        res.json = (obj) => {
            expect(obj).toEqual(body);
            return res;
        };
        res.send = res.json;
    } else {
        res.send = () => res;
    }

    return res;
};
