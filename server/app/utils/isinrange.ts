/* eslint-disable-next-line max-params --
Explication: isInRange functino has to have x, min, max and step parameters to work properly,
else it would be useless.
*/
export const isInRange = (x: number, min: number, max: number, step: number = 1): boolean => {
    return min <= x && x <= max && x % step === 0;
};
