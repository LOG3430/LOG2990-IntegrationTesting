import { LoggingInterceptor } from './logging.interceptor';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { Logger } from '@nestjs/common';
import { socketMock } from '@app/utils/socket-mock';
import { InterceptorContextMock } from '@app/utils/interceptor-test-helper';
import { LOGGER_PRETTY_PRINT_INDENT } from '@common/constants';

const socket = socketMock('s');

describe('LoggingInterceptor', () => {
    let interceptor: LoggingInterceptor;
    let logger: SinonStubbedInstance<Logger>;
    const interceptorContext = new InterceptorContextMock(socket);

    beforeEach(async () => {
        logger = createStubInstance(Logger);
        interceptor = new LoggingInterceptor(logger);
    });

    it('should be defined', () => {
        expect(interceptor).toBeDefined();
    });

    it('should not fail if context is not websocket', () => {
        interceptorContext.setEvent('');
        interceptorContext.context.getType.returns('http');
        expect(() => {
            interceptor.intercept(interceptorContext.context, interceptorContext.callHandler);
        }).not.toThrow();
    });

    describe('websocket context', () => {
        it('should be able to log a received event with no data', () => {
            const event = 'toserver';
            interceptorContext.setEvent(event);

            logger.log.onFirstCall().callsFake((str: string) => {
                expect(str).toContain(event);
            });
            logger.log.onSecondCall().callsFake((str: string) => {
                expect(str).toContain(event);
            });

            interceptor.intercept(interceptorContext.context, interceptorContext.callHandler).subscribe();
            expect(logger.log.calledTwice).toBeTruthy();
        });

        it('should be able to log a received event with data', () => {
            const event = 'toserver';
            const data = 1;
            interceptorContext.setEvent(event, data);

            logger.log.onFirstCall().callsFake((str: string) => {
                expect(str).toContain(event);
                expect(str).toContain(data + '');
            });
            logger.log.onSecondCall().callsFake((str: string) => {
                expect(str).toContain(event);
            });

            interceptor.intercept(interceptorContext.context, interceptorContext.callHandler).subscribe();
            expect(logger.log.calledTwice).toBeTruthy();
        });

        it('should be able to log a received event with data and the response', () => {
            const event = 'toserver';
            const data = 1;
            const response = { foo: 1 };
            interceptorContext.setEvent(event, data, response);

            logger.log.onFirstCall().callsFake((str: string) => {
                expect(str).toContain(event);
                expect(str).toContain(data + '');
            });
            logger.log.onSecondCall().callsFake((str: string) => {
                expect(str).toContain(event);
                expect(str).toContain(JSON.stringify(response, undefined, LOGGER_PRETTY_PRINT_INDENT));
            });

            interceptor.intercept(interceptorContext.context, interceptorContext.callHandler).subscribe();
            expect(logger.log.calledTwice).toBeTruthy();
        });
    });
});
