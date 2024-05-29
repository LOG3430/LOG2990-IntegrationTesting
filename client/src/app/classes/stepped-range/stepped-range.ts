import { Range } from '@app/classes/range/range';

export class SteppedRange extends Range {
    constructor(
        min: number,
        max: number,
        private step: number,
    ) {
        super(min, max);
    }

    override contains(val: number): boolean {
        return super.contains(val) && val % this.step === 0;
    }

    override asArray(): number[] {
        return super.asArray().filter((x) => this.contains(x));
    }
}
