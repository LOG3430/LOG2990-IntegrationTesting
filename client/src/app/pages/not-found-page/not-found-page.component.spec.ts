import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotFoundPageComponent } from './not-found-page.component';
import { Component } from '@angular/core';
import { AppMaterialModule } from '@app/modules/material.module';

/* eslint max-classes-per-file: ["off"] */
@Component({
    selector: 'app-error',
})
class ErrorComponent {}
@Component({
    selector: 'app-header',
})
class HeaderComponent {}

describe('NotFoundPageComponent', () => {
    let component: NotFoundPageComponent;
    let fixture: ComponentFixture<NotFoundPageComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [AppMaterialModule],
            declarations: [NotFoundPageComponent, ErrorComponent, HeaderComponent],
        });
        fixture = TestBed.createComponent(NotFoundPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
