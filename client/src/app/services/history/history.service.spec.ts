import { HttpStatusCode } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from 'src/environments/environment';
import { HistoryService } from './history.service';

const baseUrl: string = environment.serverUrl + '/history';

describe('HistoryService', () => {
    let service: HistoryService;
    let httpMock: HttpTestingController;

    beforeEach(async () => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
        });
        service = TestBed.inject(HistoryService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('getHistory should send GET request', () => {
        service.getHistory().subscribe();
        const req = httpMock.expectOne(baseUrl);
        expect(req.request.method).toBe('GET');
        req.flush(true);
    });

    it('deleteHistory should send DELETE request and return true if succeeded', () => {
        service.deleteHistory().subscribe((res: boolean) => {
            expect(res).toBeTrue();
        });
        const req = httpMock.expectOne(baseUrl);
        expect(req.request.method).toBe('DELETE');
        req.flush(null);
    });

    it('deleteHistory should send DELETE request and return false if failed', () => {
        service.deleteHistory().subscribe((res: boolean) => {
            expect(res).toBeFalse();
        });
        const req = httpMock.expectOne(baseUrl);
        expect(req.request.method).toBe('DELETE');
        req.flush(null, { status: HttpStatusCode.ImATeapot, statusText: '' });
    });
});
