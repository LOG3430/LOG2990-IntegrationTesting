import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'dateFormatter',
})
export class DateFormatterPipe implements PipeTransform {
    private date: Date;

    transform(date: string): string {
        this.date = new Date(date);
        return `${this.year()}-${this.month()}-${this.day()} ${this.hours()}:${this.minutes()}:${this.seconds()}`;
    }

    private year(): number {
        return this.date.getFullYear();
    }

    private month(): string {
        return this.padded(this.date.getMonth() + 1);
    }

    private day(): string {
        return this.padded(this.date.getDate());
    }

    private hours(): string {
        return this.padded(this.date.getHours());
    }

    private minutes(): string {
        return this.padded(this.date.getMinutes());
    }

    private seconds(): string {
        return this.padded(this.date.getSeconds());
    }

    private padded(num: number): string {
        return num.toString().padStart(2, '0');
    }
}
