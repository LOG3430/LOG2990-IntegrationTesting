import { BarChartService } from '@app/services/bar-chart/bar-chart.service';
import { OrganiserService } from '@app/services/organiser/organiser.service';
import { socketMock } from '@app/utils/socket-mock';
import { Grade } from '@common/events';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { OrganiserGateway } from './organiser.gateway';

const socket = socketMock('org');

describe('OrganiserGateway', () => {
    let gateway: OrganiserGateway;
    let logger: SinonStubbedInstance<Logger>;
    let organiserService: SinonStubbedInstance<OrganiserService>;
    let barChartService: SinonStubbedInstance<BarChartService>;

    beforeEach(async () => {
        logger = createStubInstance(Logger);
        organiserService = createStubInstance(OrganiserService);
        barChartService = createStubInstance(BarChartService);

        // enables the OrganiserOnlyInterceptor
        organiserService.isOrganiser.returns(true);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OrganiserGateway,
                { provide: OrganiserService, useValue: organiserService },
                { provide: Logger, useValue: logger },
                { provide: BarChartService, useValue: barChartService },
            ],
        }).compile();

        gateway = module.get<OrganiserGateway>(OrganiserGateway);
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    it('should ask user service to lock room', () => {
        [true, false].forEach((toggleState) => {
            organiserService.toggleRoomLock.returns(toggleState);
            expect(gateway.toggleLock(socket)).toBe(toggleState);
            expect(organiserService.toggleRoomLock.calledOnceWith(socket));
        });
    });

    it('start should forward call', () => {
        gateway.start(socket);
        expect(organiserService.start.calledOnceWith(socket)).toBeTruthy();
    });

    it('kickout should forward call', () => {
        [socketMock('a'), socketMock('b')].forEach((s) => {
            ['foo', 'bar'].forEach((n) => {
                gateway.kickout(s, n);
                expect(organiserService.kickout.calledOnceWith(n));
                organiserService.kickout.resetHistory();
            });
        });
    });

    it('should go to next question on RequestNewQuestion event', () => {
        gateway.nextQuestion(socket);
        expect(organiserService.nextQuestion.calledOnceWith(socket)).toBeTruthy();
    });

    it('should go to forward call on GoToGameResult event', () => {
        gateway.goToGameResults(socket);
        expect(organiserService.goToGameResults.calledOnceWith(socket)).toBeTruthy();
    });

    it('should go to next question on NewQuestion event', () => {
        gateway.nextQuestion(socket);
        expect(organiserService.nextQuestion.calledOnceWith(socket)).toBeTruthy();
    });

    it('should send correction to room on sendResults event', () => {
        const grades: Grade[] = [];
        gateway.goToLAQResults(socket, grades);
        expect(organiserService.sendCorrectionToRoom.calledOnceWith(socket, grades)).toBeTruthy();
    });

    describe('timer', () => {
        it('should pause', () => {
            gateway.pause(socket);
            expect(organiserService.pause.calledOnceWith(socket));
        });

        it('should panic', () => {
            gateway.panic(socket);
            expect(organiserService.panic.calledOnceWith(socket));
        });
    });

    it('should mute player', () => {
        gateway.mutePlayer(socket, 'bla');
        expect(organiserService.mutePlayer.calledOnceWith(socket, 'bla')).toBeTruthy();
    });
});
