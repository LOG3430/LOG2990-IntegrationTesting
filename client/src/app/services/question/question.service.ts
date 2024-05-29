import { HttpClient, HttpResponse, HttpStatusCode } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Question } from '@common/question';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class QuestionService {
    constructor(private readonly http: HttpClient) {}

    getAllQuestions(): Observable<Question[]> {
        return this.http.get<Question[]>(`${this.getURI()}`);
    }

    getQuestion(questionId: string): Observable<Question> {
        return this.http.get<Question>(`${this.getURI()}/${questionId}`);
    }

    addQuestion(question: Question): Observable<boolean> {
        return this.http.post<void>(`${this.getURI()}`, question).pipe(
            map(() => true),
            catchError(() => of(false)),
        );
    }

    deleteQuestion(questionId: string): Observable<boolean> {
        return this.http.delete<null>(`${this.getURI()}/${questionId}`, { observe: 'response' }).pipe(
            map((response: HttpResponse<null>) => {
                return response.status === HttpStatusCode.Ok;
            }),
            catchError(() => of(false)),
        );
    }

    modifyQuestion(questionId: string, newQuestion: Question): Observable<boolean> {
        return this.http.put<HttpResponse<null>>(`${this.getURI()}/${questionId}`, newQuestion).pipe(
            map((response: HttpResponse<null>) => {
                return response.status === HttpStatusCode.Ok;
            }),
            catchError(() => of(false)),
        );
    }

    private getURI(): string {
        return environment.serverUrl + '/question';
    }
}
