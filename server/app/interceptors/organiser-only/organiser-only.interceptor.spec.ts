import { OrganiserService } from '@app/services/organiser/organiser.service';
import { OrganiserOnlyInterceptor } from './organiser-only.interceptor';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { Socket } from 'socket.io';
import { socketMock } from '@app/utils/socket-mock';
import { InterceptorContextMock } from '@app/utils/interceptor-test-helper';

describe('OrganiserOnlyInterceptor', () => {
    let interceptor: OrganiserOnlyInterceptor;
    let organiserService: SinonStubbedInstance<OrganiserService>;
    let socket: SinonStubbedInstance<Socket>;
    let interceptorContext: InterceptorContextMock;

    beforeEach(() => {
        organiserService = createStubInstance<OrganiserService>(OrganiserService);
        interceptor = new OrganiserOnlyInterceptor(organiserService);

        socket = socketMock('org');
        interceptorContext = new InterceptorContextMock(socket);
    });

    it('should be defined', () => {
        expect(interceptor).toBeDefined();
    });

    it('should not execute call if not organiser', () => {
        organiserService.isOrganiser.returns(false);
        interceptorContext.setEvent('*');

        expect(interceptor.intercept(interceptorContext.context, interceptorContext.callHandler)).toBeDefined();

        expect(organiserService.isOrganiser.calledWith(socket)).toBeTruthy();
        expect(interceptorContext.callHandlerStub.notCalled).toBeTruthy();
    });

    it('should execute call if organiser', () => {
        organiserService.isOrganiser.returns(true);
        interceptorContext.setEvent('*');

        interceptor.intercept(interceptorContext.context, interceptorContext.callHandler);

        expect(organiserService.isOrganiser.calledWith(socket)).toBeTruthy();
        expect(interceptorContext.callHandlerStub.calledOnce).toBeTruthy();
    });
});
