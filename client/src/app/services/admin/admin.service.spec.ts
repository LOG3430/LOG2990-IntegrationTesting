import { HttpStatusCode } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { PasswordDialogComponent } from '@app/components/password-dialog/password-dialog.component';
import { DialogService } from '@app/services/dialog/dialog.service';
import { Quiz } from '@common/quiz';
import { Observable, of } from 'rxjs';
import { AdminService } from './admin.service';

describe('AdminService', () => {
    let service: AdminService;
    let httpMock: HttpTestingController;
    let dialogSpy: jasmine.SpyObj<DialogService>;

    beforeEach(() => {
        dialogSpy = jasmine.createSpyObj<DialogService>('DialogService', [
            'alert',
            'openPasswordDialog',
            'openCreateQuestionDialog',
            'openPickQuestionDialog',
        ]);

        TestBed.configureTestingModule({
            imports: [MatDialogModule, HttpClientTestingModule],
            providers: [
                {
                    provide: DialogService,
                    useValue: dialogSpy,
                },
            ],
        });

        httpMock = TestBed.inject(HttpTestingController);
        service = TestBed.inject(AdminService);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('Route guards function', () => {
        const runAdminFunc = () => {
            return TestBed.runInInjectionContext(
                () => AdminService.isAdminFunc()({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot) as Observable<boolean | UrlTree>,
            );
        };

        it('should check with server that user is admin before navigating to admin', () => {
            runAdminFunc().subscribe((resp) => {
                expect(resp).toBeTrue();
            });

            const req = httpMock.expectOne(`${service['baseUrl']}/verify`);
            expect(req.request.method).toBe('GET');
            req.flush(null, { status: HttpStatusCode.Ok, statusText: '' });
        });

        it('should check with server that user is admin before navigating to admin, return to home if not', () => {
            runAdminFunc().subscribe((resp) => {
                expect(resp).toEqual(new UrlTree());
            });

            const req = httpMock.expectOne(`${service['baseUrl']}/verify`);
            expect(req.request.method).toBe('GET');
            req.flush(null, { status: HttpStatusCode.Unauthorized, statusText: '' });
        });
    });

    describe('Password Dialog Verification', () => {
        let passwordSpy: jasmine.SpyObj<MatDialogRef<PasswordDialogComponent, string>>;

        beforeEach(() => {
            passwordSpy = jasmine.createSpyObj<MatDialogRef<PasswordDialogComponent, string>>('MatDialogRef', ['beforeClosed']);
            dialogSpy.openPasswordDialog.and.returnValue(passwordSpy);
        });

        it('When password is not given and dialog is closed, should return false and not alert', () => {
            passwordSpy.beforeClosed.and.returnValue(of(undefined));
            service.verifyDialog().subscribe((val: boolean) => expect(val).toBeFalsy());
            expect(dialogSpy.alert).toHaveBeenCalledTimes(0);
        });

        it('When empty password is given, should return false and not alert', () => {
            passwordSpy.beforeClosed.and.returnValue(of(''));
            service.verifyDialog().subscribe((val: boolean) => expect(val).toBeFalsy());
            expect(dialogSpy.alert).toHaveBeenCalledTimes(0);
        });

        it('When password is false, should return observer of false and open dialog alert', () => {
            passwordSpy.beforeClosed.and.returnValue(of('mdp'));
            service.verifyDialog().subscribe((val: boolean) => expect(val).toBeFalsy());
            const req = httpMock.expectOne(`${service['baseUrl']}/verify`);
            expect(req.request.method).toBe('POST');
            req.flush(null, { status: HttpStatusCode.ImATeapot, statusText: 'sip' });
            expect(dialogSpy.alert).toHaveBeenCalled();
        });

        it('When password is good, should return observer of true and not open dialog alert', () => {
            passwordSpy.beforeClosed.and.returnValue(of('bon mdp'));
            service.verifyDialog().subscribe((val: boolean) => expect(val).toBeTruthy());
            const req = httpMock.expectOne(`${service['baseUrl']}/verify`);
            expect(req.request.method).toBe('POST');
            req.flush(null, { status: HttpStatusCode.Ok, statusText: 'nice' });
            expect(dialogSpy.alert).toHaveBeenCalledTimes(0);
        });
    });

    describe('Quiz requests', () => {
        it('Delete quiz should return true', () => {
            const id = 'id';
            const result = false;
            service.deleteQuiz(id).subscribe((val: boolean) => expect(val).toBe(true));
            const req = httpMock.expectOne(`${service['baseUrl']}/quiz/${id}`);
            expect(req.request.method).toBe('DELETE');
            req.flush(result, { status: HttpStatusCode.Ok, statusText: 'nice' });
        });

        it('Delete quiz should return false', () => {
            const id = 'id';
            const result = false;
            service.deleteQuiz(id).subscribe((val: boolean) => expect(val).toBe(false));
            const req = httpMock.expectOne(`${service['baseUrl']}/quiz/${id}`);
            expect(req.request.method).toBe('DELETE');
            req.flush(result, { status: HttpStatusCode.BadRequest, statusText: 'bad' });
        });

        it('UpdateQuiz should return true', () => {
            const quizUpdate: Quiz = {} as Quiz;
            service.updateQuiz(quizUpdate).subscribe((val: boolean) => expect(val).toBe(true));
            const req = httpMock.expectOne(`${service['baseUrl']}/quiz`);
            expect(req.request.body).toEqual(quizUpdate);
            expect(req.request.method).toBe('PUT');
            req.flush(null, { status: HttpStatusCode.Ok, statusText: 'nice' });
        });

        it('UpdateQuiz should return false', () => {
            const quizUpdate: Quiz = {} as Quiz;
            service.updateQuiz(quizUpdate).subscribe((val: boolean) => expect(val).toBe(false));
            const req = httpMock.expectOne(`${service['baseUrl']}/quiz`);
            expect(req.request.body).toEqual(quizUpdate);
            expect(req.request.method).toBe('PUT');
            req.flush(null, { status: HttpStatusCode.BadRequest, statusText: 'bad' });
        });

        it('submitNewQuiz should return observable of true if successful', () => {
            const newQuiz: Quiz = {} as Quiz;
            service.submitNewQuiz(newQuiz).subscribe((val: boolean) => expect(val).toBe(true));
            const req = httpMock.expectOne(`${service['baseUrl']}/quiz`);
            expect(req.request.body).toEqual(newQuiz);
            expect(req.request.method).toBe('POST');
            req.flush(null, { status: HttpStatusCode.Ok, statusText: 'nice' });
        });

        it('submitNewQuiz should return observable of false if unsuccessful', () => {
            const newQuiz: Quiz = {} as Quiz;
            service.submitNewQuiz(newQuiz).subscribe((val: boolean) => expect(val).toEqual(false));
            const req = httpMock.expectOne(`${service['baseUrl']}/quiz`);
            expect(req.request.body).toEqual(newQuiz);
            expect(req.request.method).toBe('POST');
            req.flush(null, { status: HttpStatusCode.BadRequest, statusText: 'bad' });
        });
    });
});
