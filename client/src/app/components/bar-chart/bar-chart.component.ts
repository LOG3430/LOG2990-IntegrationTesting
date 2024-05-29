import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { StatsService } from '@app/services/stats/stats.service';
import { arrayEqual } from '@app/utils/array-equal';
import { GREEN_BORDER, GREEN_FILLER, MAX_LABEL_LENGTH, RED_BORDER, RED_FILLER } from '@common/constants';
import { ChoiceVote } from '@common/events';
import { QTypes } from '@common/question-type';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-bar-chart',
    templateUrl: './bar-chart.component.html',
    styleUrls: ['./bar-chart.component.scss'],
})
export class BarChartComponent implements OnInit, OnDestroy {
    @ViewChild(BaseChartDirective) chart: BaseChartDirective;

    barChartLegend = false;
    barChartPlugins = [];

    barChartData: ChartConfiguration<'bar'>['data'];

    barChartOptions: ChartConfiguration<'bar'>['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                grid: { display: false },
                ticks: {
                    callback(value) {
                        // @ts-ignore we know that choice is always a string
                        return this.getLabelForValue(value).substring(0, MAX_LABEL_LENGTH);
                    },
                },
            },
        },
    };

    private chartUpdateSubcription: Subscription;

    constructor(private statsService: StatsService) {}

    ngOnInit(): void {
        this.chartUpdateSubcription = this.statsService.onChartUpdate().subscribe(() => {
            this.refreshChart();
        });

        this.statsService.updateGameResultChart();
        this.refreshChart();
    }

    ngOnDestroy(): void {
        this.chartUpdateSubcription?.unsubscribe();
    }

    getLabels(): string[] {
        if (this.statsService.questionType === QTypes.MCQ) {
            return this.statsService.getQuestionChoices();
        } else {
            return this.statsService.getGradeCategories();
        }
    }

    getNChoices(): number {
        return this.getLabels().length;
    }

    getSelectedChoices(): ChoiceVote[] {
        return this.statsService.getSelectedChoices();
    }

    getQuestionName(): string {
        return this.statsService.questionName;
    }

    private getData(): number[] {
        if (this.statsService.questionType === QTypes.MCQ) {
            return this.getSelectedChoices().map((c) => c.votes);
        } else {
            return this.statsService.getLAQData();
        }
    }

    private getColors(): [string[], string[]] {
        if (this.statsService.questionType === QTypes.MCQ) {
            return this.getMCQColors();
        } else {
            return this.getLAQColors();
        }
    }

    private getMCQColors(): [string[], string[]] {
        return [
            this.getChoicesColors(this.getSelectedChoices(), GREEN_FILLER, RED_FILLER),
            this.getChoicesColors(this.getSelectedChoices(), GREEN_BORDER, RED_BORDER),
        ];
    }

    private getLAQColors(): [string[], string[]] {
        return [[GREEN_FILLER], [GREEN_BORDER]];
    }

    private getDataset() {
        const [colors, borders] = this.getColors();
        return [{ data: this.getData(), label: this.getQuestionName(), backgroundColor: colors, borderColor: borders, borderWidth: 1 }];
    }

    private refreshChart(): void {
        if (!this.isChanged()) {
            return;
        }

        this.refreshChartOptions();
        this.refreshData();
    }

    private refreshChartOptions(): void {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.barChartOptions!.plugins = {
            title: {
                display: true,
                text: this.getQuestionName(),
                font: {
                    size: 24,
                },
            },
        };
    }

    private refreshData(): void {
        this.barChartData = {
            labels: this.getLabels(),
            datasets: this.getDataset(),
        };
    }

    private getChoicesColors(choices: ChoiceVote[], okColor: string, wrongColor: string) {
        return choices.map((c) => (c.isCorrect ? okColor : wrongColor));
    }

    private isChanged(): boolean {
        return (
            !this.barChartData ||
            !(
                arrayEqual((this.barChartData.labels ?? []) as string[], this.getLabels()) &&
                arrayEqual(this.barChartData.datasets[0].data, this.getData()) &&
                this.getQuestionName() === this.barChartData.datasets[0].label
            )
        );
    }
}
