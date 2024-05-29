import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CanActivateFn, UrlTree } from '@angular/router';
import { DialogService } from '@app/services/dialog/dialog.service';
import { SESSION_TOKEN_KEY } from '@common/constants';
import { Quiz } from '@common/quiz';
import { catchError, concatAll, map, Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class AdminService {
    private readonly baseUrl: string = environment.serverUrl + '/admin';

    constructor(
        private http: HttpClient,
        private dialogService: DialogService,
    ) {}

    static isAdminFunc(): CanActivateFn {
        return () => {
            return inject(AdminService)
                .isAdmin()
                .pipe(map((hasAccess: boolean) => (hasAccess ? hasAccess : new UrlTree())));
        };
    }

    verifyDialog(): Observable<boolean> {
        return this.dialogService
            .openPasswordDialog()
            .beforeClosed()
            .pipe(
                map((password: string | undefined) => this.handlePasswordInput(password)),
                concatAll(),
            );
    }

    deleteQuiz(id: string): Observable<boolean> {
        return this.runPipe(this.http.delete(`${this.baseUrl}/quiz/${id}`));
    }

    updateQuiz(quiz: Quiz): Observable<boolean> {
        return this.runPipe(this.http.put(this.baseUrl + '/quiz', quiz));
    }

    submitNewQuiz(quiz: Quiz): Observable<boolean> {
        return this.runPipe(this.http.post(this.baseUrl + '/quiz', quiz));
    }

    private isAdmin(): Observable<boolean> {
        return this.http
            .get<null>(`${this.baseUrl}/verify`, {
                headers: {
                    /* eslint-disable-next-line @typescript-eslint/naming-convention --
                     * Explanation: the Authorization header cannot be written in camelCase :(
                     */
                    Authorization: `Bearer ${sessionStorage[SESSION_TOKEN_KEY]}`,
                },
            })
            .pipe(
                map(() => true),
                catchError(() => of(false)),
            );
    }

    private handlePasswordInput(password: string | undefined) {
        if (password) {
            return this.queryServerForPassword(password).pipe(map((isCorrect: boolean) => this.handlePasswordCheck(isCorrect)));
        }

        return of(false);
    }

    private handlePasswordCheck(passwordOk: boolean) {
        if (!passwordOk) {
            this.dialogService.alert('Mauvais mot de passe');
            return false;
        }
        return true;
    }

    private queryServerForPassword(password: string): Observable<boolean> {
        return this.http.post(`${this.baseUrl}/verify`, { password }, { responseType: 'text' }).pipe(
            map((token) => {
                sessionStorage[SESSION_TOKEN_KEY] = token;
                return true;
            }),
            catchError(() => of(false)),
        );
    }

    private runPipe<T>(request: Observable<T>): Observable<boolean> {
        return request.pipe(
            map(() => true),
            catchError(() => of(false)),
        );
    }
}
