import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppMaterialModule } from '@app/modules/material.module';
import { GameService } from '@app/services/game/game.service';
import { OrganiserService } from '@app/services/organiser/organiser.service';
import { StatsService } from '@app/services/stats/stats.service';
import { Subject } from 'rxjs';
import { EvaluationComponent } from './evaluation.component';

/* eslint-disable @typescript-eslint/no-magic-numbers */

describe('EvaluationComponent', () => {
    let component: EvaluationComponent;
    let fixture: ComponentFixture<EvaluationComponent>;
    let gameService: jasmine.SpyObj<GameService>;
    let organiserService: jasmine.SpyObj<OrganiserService>;
    let statsService: jasmine.SpyObj<StatsService>;

    const onGameOverSubject: Subject<void> = new Subject<void>();

    beforeEach(() => {
        gameService = jasmine.createSpyObj('GameService', ['onGameOver', 'getAnswersToEvaluate']);
        organiserService = jasmine.createSpyObj('OrganiserService', ['sendGrades']);
        statsService = jasmine.createSpyObj('StatsService', ['questionName']);
        gameService.onGameOver.and.returnValue(onGameOverSubject);
        gameService.getAnswersToEvaluate.and.returnValue([
            { username: 'b', answers: 'non' },
            { username: 'a', answers: 'oui' },
        ]);

        TestBed.configureTestingModule({
            imports: [AppMaterialModule],
            declarations: [EvaluationComponent],
            providers: [
                { provide: GameService, useValue: gameService },
                { provide: OrganiserService, useValue: organiserService },
                { provide: StatsService, useValue: statsService },
            ],
        });

        fixture = TestBed.createComponent(EvaluationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should increase answerIndex if there are answers left', () => {
        component.chooseGrade(0);
        component.goToNextAnswer();
        expect(component['answerIndex']).toEqual(1);
        expect(component.selectedGrade).toBeNull();
    });

    it('should not go to next answer if not graded', () => {
        expect(component.isGraded()).toBe(false);
        component.goToNextAnswer();
        expect(component['answerIndex']).toEqual(0);

        component.chooseGrade(0);
        expect(component.isGraded()).toBe(true);
        component.goToNextAnswer();
        expect(component['answerIndex']).toEqual(1);
    });

    it('should call sendGrades from organiser service if there is no answer left', () => {
        component.chooseGrade(0);
        component.goToNextAnswer();
        component.chooseGrade(0);

        expect(organiserService.sendGrades).not.toHaveBeenCalled();
        component.goToNextAnswer();
        expect(organiserService.sendGrades).toHaveBeenCalled();
    });

    it('should set and modify grades', () => {
        component.chooseGrade(50);
        expect(component['grades']).toEqual([{ username: 'a', grade: 50 }]);
        component.chooseGrade(100);
        expect(component['grades']).toEqual([{ username: 'a', grade: 100 }]);

        component.goToNextAnswer();
        component.chooseGrade(0);
        expect(component['grades']).toEqual([
            { username: 'a', grade: 100 },
            { username: 'b', grade: 0 },
        ]);
    });

    it('should return the question name', () => {
        statsService.questionName = 'a';
        expect(component.getQuestionName()).toEqual('a');
    });

    it('should return the current username', () => {
        component['answerIndex'] = 0;
        component['answersList'][0].username = 'b';
        expect(component.getCurrentUsername()).toEqual('b');
    });

    it('should return the current answer', () => {
        component['answerIndex'] = 0;
        component['answersList'][0].answers = 'allo';
        expect(component.getCurrentAnswer()).toEqual('allo');
    });

    it('should sort answers in alphabetical order', () => {
        expect(component.getAnswersToEvaluate()).toEqual([
            { username: 'a', answers: 'oui' },
            { username: 'b', answers: 'non' },
        ]);
    });
});
