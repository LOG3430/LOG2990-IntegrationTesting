import { OrganiserService } from '@app/services/organiser/organiser.service';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { Socket } from 'socket.io';

/* eslint-disable @typescript-eslint/no-explicit-any --
 * Observale<any> is the expected/recommended type for interceptors in nestjs:
 * https://docs.nestjs.com/interceptors#aspect-interception
 */

@Injectable()
export class OrganiserOnlyInterceptor implements NestInterceptor {
    constructor(private organiserService: OrganiserService) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        if (this.isOrganiser(context.switchToWs().getClient() as Socket)) {
            return next.handle();
        }

        return of(undefined);
    }

    private isOrganiser(socket: Socket): boolean {
        return this.organiserService.isOrganiser(socket);
    }
}
