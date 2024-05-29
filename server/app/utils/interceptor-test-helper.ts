import { ExecutionContext } from '@nestjs/common';
import { CallHandler, WsArgumentsHost } from '@nestjs/common/interfaces';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { SinonStubbedInstance, createStubInstance, SinonStub, stub } from 'sinon';
import { Socket } from 'socket.io';
import { of } from 'rxjs';

export interface InterceptorInput {}

export class InterceptorContextMock {
    context: SinonStubbedInstance<ExecutionContext>;
    callHandler: CallHandler;
    callHandlerStub: SinonStub;
    private wsContext: WsArgumentsHost;

    constructor(public socket: Socket) {}

    setEvent<T, U>(event: string, data?: T, response?: U) {
        this.wsContext = {
            getData: <S>() => data as unknown as S,
            getPattern: () => event,
            getClient: <S>() => this.socket as S,
        };

        this.callHandlerStub = stub().returns(of(response));
        this.callHandler = { handle: this.callHandlerStub };

        this.context = createStubInstance(ExecutionContextHost);
        this.context.switchToWs.returns(this.wsContext);
        this.context.getType.returns('ws');
    }
}
