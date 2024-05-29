import { HttpStatusCode } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Choice } from '@common/choice';
import { Question } from '@common/question';
import { QTypes } from '@common/question-type';
import { environment } from 'src/environments/environment';
import { QuestionService } from './question.service';

const shortAnswer: Choice[] = [
    { text: 'a', isCorrect: false },
    { text: 'b', isCorrect: true },
    { text: 'c', isCorrect: false },
];

const expectedQuestions: Question[] = [
    {
        text: 'titre',
        points: 2,
        choices: shortAnswer,
        type: QTypes.MCQ,
        id: '4',
        lastModif: `${new Date('20-01-2024').toUTCString()}`,
    },
];

describe('QuestionService', () => {
    let service: QuestionService;
    let httpMock: HttpTestingController;
    let baseUrl: string;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [QuestionService],
        });
        service = TestBed.inject(QuestionService);
        httpMock = TestBed.inject(HttpTestingController);
        baseUrl = environment.serverUrl;
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return expected questions (HttpClient called once)', () => {
        service.getAllQuestions().subscribe({
            next: (questions: Question[]) => {
                expect(questions).toEqual(expectedQuestions);
            },
            error: fail,
        });

        const req = httpMock.expectOne(`${baseUrl}/question`);
        expect(req.request.method).toBe('GET');
        req.flush(expectedQuestions);
    });

    it('should return the body when the question is added', () => {
        service.addQuestion(expectedQuestions[0]).subscribe({
            next: (response: boolean | null) => {
                expect(response).toEqual(true);
            },
        });

        const req = httpMock.expectOne(`${baseUrl}/question`);
        expect(req.request.method).toBe('POST');
        req.flush(true, { status: HttpStatusCode.Created, statusText: 'CREATED OK' });
    });

    it('should return false when the question is not added', () => {
        service.addQuestion(expectedQuestions[0]).subscribe({
            next: (response: boolean | null) => {
                expect(response).toEqual(false);
            },
        });

        const req = httpMock.expectOne(`${baseUrl}/question`);
        expect(req.request.method).toBe('POST');
        req.flush(true, { status: HttpStatusCode.ImATeapot, statusText: 'CREATED NOT OK' });
    });

    it('should return the null if it fails', () => {
        service.addQuestion(expectedQuestions[0]).subscribe({
            next: (response: boolean | null) => {
                expect(response).toBe(true);
            },
        });

        const req = httpMock.expectOne(`${baseUrl}/question`);
        expect(req.request.method).toBe('POST');
        req.flush(true);
    });

    it('getQuestion should send GET request', () => {
        service.getQuestion(expectedQuestions[0].id).subscribe();
        const req = httpMock.expectOne(`${baseUrl}/question/${expectedQuestions[0].id}`);
        expect(req.request.method).toBe('GET');
        req.flush(null);
    });

    it('deleteQuestion should send DELETE request and return true passed', () => {
        service.deleteQuestion(expectedQuestions[0].id).subscribe(() => expect(true));
        const req = httpMock.expectOne(`${baseUrl}/question/${expectedQuestions[0].id}`);
        expect(req.request.method).toBe('DELETE');
        req.flush(null, { status: HttpStatusCode.Ok, statusText: '' });
    });

    it('deleteQuestion should send DELETE request and return false passed', () => {
        service.deleteQuestion(expectedQuestions[0].id).subscribe(() => expect(false));
        const req = httpMock.expectOne(`${baseUrl}/question/${expectedQuestions[0].id}`);
        expect(req.request.method).toBe('DELETE');
        req.flush(null, { status: HttpStatusCode.NotFound, statusText: '' });
    });

    it('modifyQuestion should return true if PUT passed', () => {
        const newTitle = 'nouveau titre';
        service.modifyQuestion(expectedQuestions[0].id, { ...expectedQuestions[0], text: newTitle }).subscribe(() => expect(true));
        const req = httpMock.expectOne(`${baseUrl}/question/${expectedQuestions[0].id}`);
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual({ ...expectedQuestions[0], text: newTitle });
        req.flush(null, { status: HttpStatusCode.Ok, statusText: '' });
    });

    it('modifyQuestion should return false if PUT didnt passed', () => {
        const newTitle = 'nouveau titre';
        service.modifyQuestion(expectedQuestions[0].id, { ...expectedQuestions[0], text: newTitle }).subscribe(() => expect(false));
        const req = httpMock.expectOne(`${baseUrl}/question/${expectedQuestions[0].id}`);
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual({ ...expectedQuestions[0], text: newTitle });
        req.flush(null, { status: HttpStatusCode.NotFound, statusText: '' });
    });
});
