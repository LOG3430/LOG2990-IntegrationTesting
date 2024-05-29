import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Quiz } from '@common/quiz';
import { environment } from 'src/environments/environment';
import { QuizService } from './quiz.service';

const expectedQuiz: Quiz = {
    id: '120',
    title: 'blala',
    description: 'jeu cool',
    duration: 30,
    visibility: true,
    questions: [],
    lastModification: 'tqt',
};

describe('QuizService', () => {
    let service: QuizService;
    let httpMock: HttpTestingController;
    const baseUrl = environment.serverUrl + '/quiz';

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
        });

        httpMock = TestBed.inject(HttpTestingController);
        service = TestBed.inject(QuizService);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return expected quizzes (HttpClient called once)', () => {
        service.getAllQuizzes().subscribe({
            next: (quizzes: Quiz[]) => {
                expect(quizzes).toEqual([expectedQuiz]);
            },
            error: fail,
        });

        const req = httpMock.expectOne(`${baseUrl}`);
        expect(req.request.method).toBe('GET');
        req.flush([expectedQuiz]);
    });

    it('should return expected quiz (HttpClient called once)', () => {
        service.getQuiz(expectedQuiz.id).subscribe({
            next: (quiz: Quiz) => {
                expect(quiz).toEqual(expectedQuiz);
            },
            error: fail,
        });

        const req = httpMock.expectOne(`${baseUrl}/${expectedQuiz.id}`);
        expect(req.request.method).toBe('GET');
        req.flush(expectedQuiz);
    });
});
