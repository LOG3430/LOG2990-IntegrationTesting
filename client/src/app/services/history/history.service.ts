import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { History } from '@common/history';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class HistoryService {
    private readonly baseUrl: string = environment.serverUrl + '/history';

    constructor(private http: HttpClient) {}

    getHistory(): Observable<History[]> {
        return this.http.get<History[]>(this.baseUrl);
    }

    deleteHistory(): Observable<boolean> {
        return this.runPipe(this.http.delete<void>(this.baseUrl));
    }
    private runPipe<T>(request: Observable<T>): Observable<boolean> {
        return request.pipe(
            map(() => true),
            catchError(() => of(false)),
        );
    }
}
