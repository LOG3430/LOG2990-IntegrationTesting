import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent } from '@app/components/header/header.component';
import { AppMaterialModule } from '@app/modules/material.module';

import { AdminPageComponent } from './admin-page.component';

describe('AdminPageComponent', () => {
    let component: AdminPageComponent;
    let fixture: ComponentFixture<AdminPageComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [AppMaterialModule],
            declarations: [AdminPageComponent, HeaderComponent],
        });
        fixture = TestBed.createComponent(AdminPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
