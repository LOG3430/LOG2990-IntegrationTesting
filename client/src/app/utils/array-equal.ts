export const arrayEqual = <T>(a: T[], b: T[]) => {
    return a.length === b.length && a.every((x, i) => x === b[i]);
};
