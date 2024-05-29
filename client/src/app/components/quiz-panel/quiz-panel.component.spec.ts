import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuizPanelComponent } from './quiz-panel.component';
import { AppMaterialModule } from '@app/modules/material.module';
import { Component, Input } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Quiz } from '@common/quiz';
import { Question } from '@common/question';

@Component({ selector: 'app-question-panel' })
class QuestionPanelComponent {
    @Input() questions: Question[];
}

describe('QuizPanelComponent', () => {
    let component: QuizPanelComponent;
    let fixture: ComponentFixture<QuizPanelComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [AppMaterialModule, NoopAnimationsModule],
            declarations: [QuizPanelComponent, QuestionPanelComponent],
        });

        fixture = TestBed.createComponent(QuizPanelComponent);
        component = fixture.componentInstance;

        component.quiz = { title: '', questions: [] } as unknown as Quiz;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
