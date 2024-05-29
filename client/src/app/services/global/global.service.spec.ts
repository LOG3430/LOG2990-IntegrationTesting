import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { DialogService } from '@app/services/dialog/dialog.service';

import { GlobalService } from './global.service';

describe('GlobalService', () => {
    let service: GlobalService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                { provide: ActivatedRoute, useValue: {} as unknown as ActivatedRoute },
                { provide: DialogService, useValue: {} as unknown as DialogService },
            ],
        });
        service = TestBed.inject(GlobalService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return the current route', () => {
        const route = { url: 'blabla' } as unknown as ActivatedRoute;
        spyOnProperty(service['router'].routerState.root, 'firstChild').and.returnValue(route);
        expect(service.getRoute()).toEqual(route);
    });

    it('should return the root if there is no first child', () => {
        const root = service['router'].routerState.root;
        spyOnProperty(root, 'firstChild').and.returnValue(null);
        expect(service.getRoute()).toEqual(root);
    });

    it('should return last child', () => {
        const route = { url: 'blabla', firstChild: { url: 'blablachild' } } as unknown as ActivatedRoute;
        spyOnProperty(service['router'].routerState.root, 'firstChild').and.returnValue(route);
        expect(service.getRoute()).toEqual(route.firstChild as ActivatedRoute);
    });
});
