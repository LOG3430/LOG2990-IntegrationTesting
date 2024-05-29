/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable max-len */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatsService } from '@app/services/stats/stats.service';

import { ChoiceVote, GradeCategory } from '@common/events';
import { QTypes } from '@common/question-type';
import { CoreScaleOptions, Scale } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { of } from 'rxjs';
import { BarChartComponent } from './bar-chart.component';

describe('BarChartComponent', () => {
    let component: BarChartComponent;
    let statsSpy: jasmine.SpyObj<StatsService>;
    let fixture: ComponentFixture<BarChartComponent>;
    beforeEach(() => {
        statsSpy = jasmine.createSpyObj<StatsService>('StatsService', [
            'getQuestionChoices',
            'getSelectedChoices',
            'onChartUpdate',
            'getGradeCategories',
            'isGameOver',
            'getLAQData',
            'getFinalGradeCount',
            'getQuestionIndex',
            'updateGameResultChart',
        ]);

        statsSpy.onChartUpdate.and.returnValue(of(undefined));
    });

    describe('qcm', () => {
        const dummyData = {
            choices: 4,
            nPlayers: 20,
            questionName: 'allo',
            selectedChoices: [
                {
                    name: 'c1',
                    votes: 4,
                    isCorrect: true,
                } as ChoiceVote,
                {
                    name: 'c2',
                    votes: 2,
                    isCorrect: true,
                } as ChoiceVote,
                {
                    name: 'c3',
                    votes: 10,
                    isCorrect: false,
                } as ChoiceVote,
                {
                    name: 'c4',
                    votes: 1,
                    isCorrect: true,
                } as ChoiceVote,
            ],
            gradeCount: {
                [GradeCategory.Zero]: 0,
                [GradeCategory.Fifty]: 0,
                [GradeCategory.Hundred]: 0,
            },
            hasInteracted: true,
        };

        beforeEach(() => {
            statsSpy.getQuestionChoices.and.returnValue([]);
            statsSpy.getSelectedChoices.and.returnValue(dummyData.selectedChoices);
            statsSpy.questionType = QTypes.MCQ;

            TestBed.configureTestingModule({
                declarations: [BarChartComponent],
                imports: [NgChartsModule],
                providers: [{ provide: StatsService, useValue: statsSpy }],
            });

            fixture = TestBed.createComponent(BarChartComponent);
            component = fixture.componentInstance;

            spyOn<any>(component, 'refreshData').and.callThrough();
            spyOn<any>(component, 'refreshChartOptions').and.callThrough();

            fixture.detectChanges();
        });

        it('should create', () => {
            expect(component).toBeTruthy();
        });

        it('should call getQuestionChoices method from StatsService', () => {
            statsSpy.questionType = QTypes.MCQ;
            component.getLabels();
            expect(statsSpy.getQuestionChoices).toHaveBeenCalled();
        });

        it('should give proper array length', () => {
            statsSpy.questionType = QTypes.MCQ;
            const length = component.getNChoices();
            expect(length).toEqual(0);
        });

        it('should call getSelectedChoices method from StatsService', () => {
            statsSpy.questionType = QTypes.MCQ;
            component.getSelectedChoices();
            expect(statsSpy.getSelectedChoices).toHaveBeenCalled();
        });

        it('should call getFinalGradeCount method from StatsService', () => {
            statsSpy.questionType = QTypes.LAQ;
            statsSpy.isGameOver.and.returnValue(true);
            statsSpy.getLAQData.and.returnValue([0, 1, 0]);
            statsSpy.getQuestionIndex.and.returnValue(0);
            expect(component['getData']()).toEqual([0, 1, 0]);
        });

        it('should call getQuestionName method from StatsService', () => {
            statsSpy.questionType = QTypes.MCQ;
            statsSpy.questionName = 'allo';
            expect(component.getQuestionName()).toBe('allo');
        });

        it('getData should return list of votes in order', () => {
            statsSpy.questionType = QTypes.MCQ;
            expect(component['getData']()).toEqual([4, 2, 10, 1]);
        });

        it('getColors should return red for wrong and green for good choices', () => {
            statsSpy.questionType = QTypes.MCQ;
            const GREEN_FILLER = 'rgba(75, 192, 192, 0.5)';
            const GREEN_BORDER = 'rgb(75, 192, 192)';
            const RED_FILLER = 'rgba(255, 99, 132, 0.5)';
            const RED_BORDER = 'rgb(255, 99, 132)';
            const [colors, borders] = component['getColors']();
            expect(colors).toEqual([GREEN_FILLER, GREEN_FILLER, RED_FILLER, GREEN_FILLER]);
            expect(borders).toEqual([GREEN_BORDER, GREEN_BORDER, RED_BORDER, GREEN_BORDER]);
        });

        it('refreshChart should call getData if data is changed', () => {
            expect(component['refreshData']).toHaveBeenCalledTimes(1);
            expect(component['refreshChartOptions']).toHaveBeenCalledTimes(1);

            component['refreshChart']();

            expect(component['refreshData']).toHaveBeenCalledTimes(1);
            expect(component['refreshChartOptions']).toHaveBeenCalledTimes(1);
        });

        it('callback function should truncate string', () => {
            const fct = component.barChartOptions!.scales!.x!.ticks!.callback;
            const longStr = 'This is a very long label that should be truncated';
            const truncatedStr = 'This is a very long label that';
            const fakeScaleObj = {
                getLabelForValue: () => {
                    return longStr;
                },
            } as unknown as Scale<CoreScaleOptions>;
            fct!.bind(fakeScaleObj);
            expect(fct!.call(fakeScaleObj, longStr, 0, [])).toEqual(truncatedStr);
        });
    });

    describe('laq', () => {
        beforeEach(() => {
            statsSpy.getGradeCategories.and.returnValue([]);
            statsSpy.getLAQData.and.returnValue([]);
            statsSpy.questionType = QTypes.LAQ;

            TestBed.configureTestingModule({
                declarations: [BarChartComponent],
                imports: [NgChartsModule],
                providers: [{ provide: StatsService, useValue: statsSpy }],
            });

            fixture = TestBed.createComponent(BarChartComponent);
            component = fixture.componentInstance;

            spyOn<any>(component, 'refreshData').and.callThrough();
            spyOn<any>(component, 'refreshChartOptions').and.callThrough();

            fixture.detectChanges();
        });

        it('should create', () => {
            expect(component).toBeDefined();
        });
    });
});
