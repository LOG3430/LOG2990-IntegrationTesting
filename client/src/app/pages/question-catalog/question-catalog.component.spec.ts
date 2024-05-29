import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { AlertComponent } from '@app/components/alert/alert.component';
import { HeaderComponent } from '@app/components/header/header.component';
import { QuizQuestionComponent } from '@app/components/quiz/quiz-question/quiz-question.component';
import { AppMaterialModule } from '@app/modules/material.module';
import { DateFormatterPipe } from '@app/pipes/date-formatter/date-formatter.pipe';
import { QuestionSortPipe } from '@app/pipes/question/question-sort.pipe';
import { AdminService } from '@app/services/admin/admin.service';
import { DialogService } from '@app/services/dialog/dialog.service';
import { QuestionService } from '@app/services/question/question.service';
import { Question } from '@common/question';
import { QTypes } from '@common/question-type';
import { of } from 'rxjs';
import { QuestionCatalogComponent } from './question-catalog.component';

const mockEvent = jasmine.createSpyObj('MouseEvent', ['stopPropagation']);

describe('QuestionCatalogComponent', () => {
    let component: QuestionCatalogComponent;
    let fixture: ComponentFixture<QuestionCatalogComponent>;
    let questionSpy: jasmine.SpyObj<QuestionService>;
    let dialogSpy: jasmine.SpyObj<DialogService>;
    let adminSpy: jasmine.SpyObj<AdminService>;

    beforeEach(() => {
        questionSpy = jasmine.createSpyObj('QuizService', ['getAllQuestions', 'modifyQuestion', 'deleteQuestion', 'addQuestion']);
        questionSpy.getAllQuestions.and.returnValue(of([]));
        dialogSpy = jasmine.createSpyObj('DialogService', ['openCreateQuestionDialog', 'alert', 'createQuestionDialog', 'confirmDialog']);

        TestBed.configureTestingModule({
            imports: [AppMaterialModule],
            declarations: [QuestionCatalogComponent, HeaderComponent, DateFormatterPipe, QuestionSortPipe],
            providers: [
                {
                    provide: QuestionService,
                    useValue: questionSpy,
                },
                {
                    provide: DialogService,
                    useValue: dialogSpy,
                },
                {
                    provide: AdminService,
                    useValue: adminSpy,
                },
            ],
        });
        fixture = TestBed.createComponent(QuestionCatalogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should remove question when bin button is clicked', () => {
        questionSpy.deleteQuestion.and.returnValue(of(true));
        dialogSpy.confirmDialog.and.returnValue(of(true));
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any --
        Explication: Method is private, any is needed so spyOn doesnt get angry
        */
        spyOn<any>(component, 'refreshQuestions');
        component.removeQuestion({} as Question, mockEvent);
        expect(mockEvent.stopPropagation).toHaveBeenCalled();
        expect(questionSpy.deleteQuestion).toHaveBeenCalled();
        expect(dialogSpy.alert).toHaveBeenCalledWith('La question a été supprimée avec succès');
        expect(component['refreshQuestions']).toHaveBeenCalled();
    });

    it('should show differnt text if remove failed', () => {
        questionSpy.deleteQuestion.and.returnValue(of(false));
        dialogSpy.confirmDialog.and.returnValue(of(true));
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any --
        Explication: Method is private, any is needed so spyOn doesnt get angry
        */
        spyOn<any>(component, 'refreshQuestions');
        component.removeQuestion({} as Question, mockEvent);
        expect(mockEvent.stopPropagation).toHaveBeenCalled();
        expect(questionSpy.deleteQuestion).toHaveBeenCalled();
        expect(dialogSpy.alert).toHaveBeenCalledWith("Une erreur s'est produite");
        expect(component['refreshQuestions']).toHaveBeenCalled();
    });

    it('should open error message dialog if no questions exist', () => {
        component['refreshQuestions']();
        questionSpy.getAllQuestions.and.returnValue(of([]));
        expect(dialogSpy.alert).toHaveBeenCalledTimes(2);
        expect(dialogSpy.alert).toHaveBeenCalledWith('Aucune question trouvée');
    });

    it('should refresh questions successfully', () => {
        const qtest = [{} as Question, {} as Question];
        questionSpy.getAllQuestions.and.returnValue(of(qtest));
        component['refreshQuestions']();
        expect(dialogSpy.alert).toHaveBeenCalledTimes(1);
        expect(component['questions']).toEqual(qtest);
    });

    it('should call modifyQuestion if quesiton is modified', () => {
        questionSpy.modifyQuestion.and.returnValue(of(true));
        dialogSpy.openCreateQuestionDialog.and.returnValue({
            beforeClosed: () => of({} as Question),
        } as unknown as MatDialogRef<QuizQuestionComponent, Question>);
        component.modifyQuestion({} as Question, mockEvent);
        expect(mockEvent.stopPropagation).toHaveBeenCalled();
        expect(questionSpy.modifyQuestion).toHaveBeenCalled();
    });

    it('should not call modifyQuestion if quesiton is not modified', () => {
        dialogSpy.openCreateQuestionDialog.and.returnValue({
            beforeClosed: () => of(undefined),
        } as unknown as MatDialogRef<QuizQuestionComponent, Question>);
        component.modifyQuestion({} as Question, mockEvent);
        expect(mockEvent.stopPropagation).toHaveBeenCalled();
        expect(questionSpy.modifyQuestion).toHaveBeenCalledTimes(0);
    });

    it('should add question to component.quiz successfully', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function
        spyOn<any>(component, 'refreshQuestions').and.callFake(() => {});
        const qtest = {} as Question;
        dialogSpy.createQuestionDialog.and.returnValue(of(qtest));
        questionSpy.addQuestion.and.returnValue(of(true));
        component.addQuestion();
        expect(component['refreshQuestions']).toHaveBeenCalled();
    });

    it('should not add question to component.quiz if no question exists', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any,
        spyOn<any>(component, 'refreshQuestions');
        const qtest = {} as Question;
        dialogSpy.createQuestionDialog.and.returnValue(of(qtest));
        questionSpy.addQuestion.and.returnValue(of(false));
        dialogSpy.alert.and.callFake(() => {
            return {} as unknown as MatDialogRef<AlertComponent, void>;
        });
        component.addQuestion();
        expect(component['refreshQuestions']).toHaveBeenCalled();
        expect(dialogSpy.alert).toHaveBeenCalled();
    });

    it('should filter the array of questions by the type', () => {
        const questionLAQ = { type: QTypes.LAQ } as Question;
        const questionMCQ = { type: QTypes.MCQ } as Question;
        component['questions'] = [questionLAQ, questionMCQ];
        component.filterMCQ();
        expect(component.filterList).toEqual([questionMCQ]);
        component.filterLAQ();
        expect(component.filterList).toEqual([questionLAQ]);
        component.filterAll();
        expect(component.filterList).toEqual(component['questions']);
    });

    it('should return the right color depending of the type of question', () => {
        const questionLAQ = { type: QTypes.LAQ } as Question;
        const questionMCQ = { type: QTypes.MCQ } as Question;
        expect(component.getColorByType(questionLAQ)).toEqual('var(--primary)');
        expect(component.getColorByType(questionMCQ)).toEqual('var(--lightprimary)');
    });
});
