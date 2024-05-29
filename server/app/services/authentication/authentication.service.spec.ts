import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationService } from './authentication.service';

jest.useFakeTimers();

describe('AuthenticationService', () => {
    let service: AuthenticationService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [AuthenticationService],
        }).compile();

        service = module.get<AuthenticationService>(AuthenticationService);
    });

    afterEach(() => {
        jest.clearAllTimers();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('log in', () => {
        it('should accept a user with correct password', () => {
            expect(service.login(process.env.ADMIN_PASSWORD)).toBeTruthy();
        });

        it('should refuse a user with wrong password', () => {
            expect(service.login('password123')).toBeNull();
        });
    });

    describe('is logged in', () => {
        it('should recognize a user with valid token', () => {
            const id = service.login(process.env.ADMIN_PASSWORD);
            expect(id.length).toBeGreaterThan(0);
            expect(service.isLoggedIn(id)).toBeTruthy();
        });

        it('should not recognize a user with invalid token', () => {
            expect(service.isLoggedIn('secret-token')).toBeFalsy();
        });
    });

    it('should kill user session after some delay and prevent connexions', () => {
        const id = service.login(process.env.ADMIN_PASSWORD);

        expect(jest.getTimerCount()).toBe(1);
        jest.runOnlyPendingTimers();

        expect(service.isLoggedIn(id)).toBeFalsy();
    });
});
