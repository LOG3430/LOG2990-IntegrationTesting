import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { AdminService } from '@app/services/admin/admin.service';
import { of } from 'rxjs';

describe('MainPageComponent', () => {
    let component: MainPageComponent;
    let fixture: ComponentFixture<MainPageComponent>;
    let adminSpy: jasmine.SpyObj<AdminService>;
    let routerSpy: jasmine.SpyObj<Router>;

    beforeEach(async () => {
        adminSpy = jasmine.createSpyObj('AdminService', ['verifyDialog']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        await TestBed.configureTestingModule({
            declarations: [MainPageComponent],
            providers: [
                {
                    provide: AdminService,
                    useValue: adminSpy,
                },
                {
                    provide: Router,
                    useValue: routerSpy,
                },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(MainPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('if verify dialog returns true router should navigate', () => {
        adminSpy.verifyDialog.and.returnValue(of(true));
        component.verifyAdmin();
        expect(routerSpy.navigate).toHaveBeenCalled();
    });

    it('if verify dialog returns false router should not navigate', () => {
        adminSpy.verifyDialog.and.returnValue(of(false));
        component.verifyAdmin();
        expect(routerSpy.navigate).toHaveBeenCalledTimes(0);
    });
});
