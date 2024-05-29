export class Range {
    constructor(
        private min: number,
        private max: number,
    ) {}

    contains(val: number): boolean {
        return this.min <= val && val <= this.max;
    }

    asArray(): number[] {
        return this.basicArray().map((x) => x + this.min);
    }

    private basicArray(): number[] {
        return Array.from(Array(Math.max(0, this.max - this.min + 1)).keys());
    }
}
