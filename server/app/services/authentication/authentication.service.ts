import { SESSION_DURATION } from '@common/constants';
import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';

@Injectable()
export class AuthenticationService {
    private users: Set<string> = new Set();

    login(password: string): string | null {
        return this.isCorrectPassword(password) ? this.createUser() : null;
    }

    isLoggedIn(id: string): boolean {
        return this.users.has(id);
    }

    private isCorrectPassword(password: string) {
        return process.env.ADMIN_PASSWORD === password;
    }

    private createUser(): string {
        const id = uuid();
        this.users.add(id);

        setTimeout(() => {
            this.users.delete(id);
        }, SESSION_DURATION);

        return id;
    }
}
