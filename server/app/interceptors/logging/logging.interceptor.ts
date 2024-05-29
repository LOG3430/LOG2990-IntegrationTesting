import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { WsArgumentsHost } from '@nestjs/common/interfaces';
import { Socket } from 'socket.io';
import { Observable, tap } from 'rxjs';
import { LOGGER_PRETTY_PRINT_INDENT } from '@common/constants';

/* eslint-disable @typescript-eslint/no-explicit-any --
 * Observale<any> is the expected/recommended type for interceptors in nestjs:
 * https://docs.nestjs.com/interceptors#aspect-interception
 */

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    constructor(private logger: Logger) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        if (context.getType() === 'ws') {
            return this.logWebsocket(context.switchToWs(), next);
        }

        return next.handle();
    }

    private logWebsocket(context: WsArgumentsHost, next: CallHandler): Observable<any> {
        const event = context.getPattern();
        const client = (context.getClient() as Socket).id;
        this.logger.log(
            `Received event [ ${event} ] from client ${client}\n
             \twith data ${this.prettyPrint(context.getData())}`,
        );

        return next.handle().pipe(
            tap((resp) => {
                this.logger.log(`Answered to event [ ${event} ] from client ${client}\n
                                 \twith data ${this.prettyPrint(resp)}`);
            }),
        );
    }

    private prettyPrint<T>(data?: T): string {
        return data ? JSON.stringify(data, undefined, LOGGER_PRETTY_PRINT_INDENT) : '""';
    }
}
