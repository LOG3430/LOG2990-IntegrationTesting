/**
 * Example:
 * ```ts
 * enum A {
 *     a = 1, b = 2
 * };
 *
 * enumValues(A); // [A.a, A.b] (type A[])
 * ```
 *
 * @param numericEnum An enum with all numerical entries
 * @returns the array of all its values
 */
export const enumValues = <T extends { [key: number]: string | number }>(numericEnum: T) => {
    return Object.keys(numericEnum)
        .filter((e) => isNaN(Number(e)))
        .map((key) => numericEnum[key as keyof T]);
};
