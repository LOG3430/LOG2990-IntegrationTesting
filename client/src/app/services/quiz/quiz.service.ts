import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Quiz } from '@common/quiz';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class QuizService {
    private readonly baseUrl: string = environment.serverUrl + '/quiz';

    constructor(private http: HttpClient) {}

    getAllQuizzes(): Observable<Quiz[]> {
        return this.http.get<Quiz[]>(this.baseUrl);
    }

    getQuiz(id: string): Observable<Quiz> {
        return this.http.get<Quiz>(`${this.baseUrl}/${id}`);
    }
}
