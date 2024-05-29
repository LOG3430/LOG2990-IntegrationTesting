import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { AppMaterialModule } from '@app/modules/material.module';
import { DateFormatterPipe } from '@app/pipes/date-formatter/date-formatter.pipe';
import { QuizSortPipe } from '@app/pipes/quiz/quiz-sort.pipe';
import { AdminService } from '@app/services/admin/admin.service';
import { DialogService } from '@app/services/dialog/dialog.service';
import { GlobalService } from '@app/services/global/global.service';
import { QuizService } from '@app/services/quiz/quiz.service';
import { globalMock } from '@app/utils/global-test-helper';
import { Quiz } from '@common/quiz';
import * as FileSaver from 'file-saver';
import { of } from 'rxjs';
import { QuizCatalogComponent } from './quiz-catalog.component';

/* eslint max-classes-per-file: ["off"] */

@Component({ selector: 'app-header' })
class HeaderComponent {}

@Component({ selector: 'app-quiz-panel' })
class QuizPanelComponent {
    @Input() quiz: Quiz;
}

const quizzes: Quiz[] = [{ questions: [] } as unknown as Quiz, { questions: [] } as unknown as Quiz];
const mockEvent = jasmine.createSpyObj('MouseEvent', ['stopPropagation']);

describe('QuizCatalogComponent', () => {
    let component: QuizCatalogComponent;
    let fixture: ComponentFixture<QuizCatalogComponent>;

    let quizSpy: jasmine.SpyObj<QuizService>;
    let dialogSpy: jasmine.SpyObj<DialogService>;
    let routerSpy: jasmine.SpyObj<Router>;
    let adminSpy: jasmine.SpyObj<AdminService>;

    beforeEach(() => {
        let global: GlobalService;
        [global, , dialogSpy, routerSpy] = globalMock();
        quizSpy = jasmine.createSpyObj('GameService', ['getAllQuizzes']);
        adminSpy = jasmine.createSpyObj('AdminService', ['updateQuiz', 'deleteQuiz']);
        quizSpy.getAllQuizzes.and.returnValue(of(quizzes));

        TestBed.configureTestingModule({
            imports: [AppMaterialModule, NoopAnimationsModule, FormsModule, ReactiveFormsModule, HttpClientTestingModule],
            declarations: [QuizCatalogComponent, HeaderComponent, QuizPanelComponent, QuizSortPipe, DateFormatterPipe],
            providers: [
                {
                    provide: QuizService,
                    useValue: quizSpy,
                },
                {
                    provide: AdminService,
                    useValue: adminSpy,
                },

                {
                    provide: GlobalService,
                    useValue: global,
                },
            ],
        });
        fixture = TestBed.createComponent(QuizCatalogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('onInit should query all games', () => {
        it('If no quiz should open dialog', async () => {
            quizSpy.getAllQuizzes.and.returnValue(of([]));
            component.ngOnInit();
            expect(dialogSpy.alert).toHaveBeenCalled();
            expect(component.quizzes).toEqual([]);
        });

        it('Quizzes should be stored in attribute', async () => {
            expect(component.quizzes).toEqual(quizzes);
        });
    });

    it('Export should call FileSaver.saveAs', () => {
        /* eslint-disable-next-line deprecation/deprecation --
        Explication: We are mocking the function, not running it*/
        spyOn(FileSaver, 'saveAs').and.returnValues();
        component.exportQuiz({} as Quiz, mockEvent);
        expect(mockEvent.stopPropagation).toHaveBeenCalled();
        /* eslint-disable-next-line deprecation/deprecation --
        Explication: We are mocking the function, not running it*/
        expect(FileSaver.saveAs).toHaveBeenCalled();
    });

    it('Delete quiz change quizzes attribute', () => {
        dialogSpy.confirmDialog.and.returnValue(of(true));
        const quiz: Quiz = { title: 'a' } as Quiz;
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any --
        Explication: Method is private, any is needed so spyOn doesnt get angry
        */
        const tempSpy = spyOn<any>(component, 'refreshQuizzes');
        adminSpy.deleteQuiz.and.returnValue(of(true));
        quizSpy.getAllQuizzes.and.returnValue(of([quiz]));
        component.deleteQuiz(quiz, mockEvent);
        expect(mockEvent.stopPropagation).toHaveBeenCalled();
        expect(tempSpy).toHaveBeenCalled();
        expect(dialogSpy.alert).toHaveBeenCalledWith(`Le quiz ${quiz.title} a été supprimé avec succès`);
    });

    it('Delete if server fails should show different text', () => {
        dialogSpy.confirmDialog.and.returnValue(of(true));
        const quiz: Quiz = { title: 'a' } as Quiz;
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any --
        Explication: Method is private, any is needed so spyOn doesnt get angry
        */
        const tempSpy = spyOn<any>(component, 'refreshQuizzes');
        adminSpy.deleteQuiz.and.returnValue(of(false));
        quizSpy.getAllQuizzes.and.returnValue(of([quiz]));
        component.deleteQuiz(quiz, mockEvent);
        expect(mockEvent.stopPropagation).toHaveBeenCalled();
        expect(tempSpy).toHaveBeenCalled();
        expect(dialogSpy.alert).toHaveBeenCalledWith("Une erreur s'est produite");
    });

    it('Modify quiz should navigate router', () => {
        component.modifyQuiz({} as Quiz, mockEvent);
        expect(mockEvent.stopPropagation).toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalled();
    });

    it('should toggle visibility successfully when visibility button is clicked ', async () => {
        adminSpy.updateQuiz.and.returnValue(of(true));
        const quiz = { visibility: true } as Quiz;
        await component.toggleVisibility(quiz, mockEvent);
        expect(mockEvent.stopPropagation).toHaveBeenCalled();
        expect(quiz.visibility).toBeFalse();
        expect(adminSpy.updateQuiz).toHaveBeenCalled();
    });
});
