import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppMaterialModule } from '@app/modules/material.module';
import { QuizService } from '@app/services/quiz/quiz.service';
import { Quiz } from '@common/quiz';
import { of } from 'rxjs';
import { CreateGamePageComponent } from './create-game-page.component';

/* eslint max-classes-per-file: ["off"] */

@Component({ selector: 'app-header' })
class HeaderComponent {}

@Component({ selector: 'app-quiz-panel' })
class QuizPanelComponent {}

@Component({ selector: 'app-random-mode-selector' })
class RandomModeSecletorComponent {}

describe('CreateGamePageComponent', () => {
    let component: CreateGamePageComponent;
    let fixture: ComponentFixture<CreateGamePageComponent>;
    let quizSpyService: jasmine.SpyObj<QuizService>;

    const allQuizzes: Quiz[] = [
        {
            id: '0',
            title: 'Quiz 0',
            description: 'Description quiz 0',
            duration: 30,
            lastModification: '01-12-2024',
            questions: [],
            visibility: true,
        },
        {
            id: '1',
            title: 'Quiz 1',
            description: 'Description quiz 1',
            duration: 10,
            lastModification: '02-12-2024',
            questions: [],
            visibility: false,
        },
        {
            id: '3',
            title: 'Quiz 3',
            description: 'Description quiz 3',
            duration: 40,
            lastModification: '02-12-2023',
            questions: [],
            visibility: true,
        },
    ];

    beforeEach(() => {
        quizSpyService = jasmine.createSpyObj('GameService', ['getAllQuizzes']);
        quizSpyService.getAllQuizzes.and.returnValue(of([]));

        TestBed.configureTestingModule({
            imports: [AppMaterialModule, HttpClientTestingModule],
            declarations: [CreateGamePageComponent, HeaderComponent, QuizPanelComponent, RandomModeSecletorComponent],
            providers: [{ provide: QuizService, useValue: quizSpyService }],
        });

        fixture = TestBed.createComponent(CreateGamePageComponent);

        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call getAllGames of service in updateGames', () => {
        expect(quizSpyService.getAllQuizzes).toHaveBeenCalled();
    });

    it('should show the quizzes that has visibility true', () => {
        quizSpyService.getAllQuizzes.and.returnValue(of(allQuizzes));
        component.updateGames();
        expect(component.getGames().length).toBe(2);
        expect(component.getGames()[1].id).toBe('3');
    });

    it('should selected only quizzes when visibility has true', () => {
        component.selectQuiz(allQuizzes[0]);
        expect(component.isSelected(allQuizzes[0])).toBeTrue();
        expect(component.isSelected(allQuizzes[1])).toBeFalse();

        component.selectQuiz(allQuizzes[2]);
        expect(component.isSelected(allQuizzes[2])).toBeTrue();
        expect(component.isSelected(allQuizzes[0])).toBeFalse();
    });
});
