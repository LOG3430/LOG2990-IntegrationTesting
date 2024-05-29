import { BarChartService } from '@app/services/bar-chart/bar-chart.service';
import { socketMock } from '@app/utils/socket-mock';
import { Interaction, SelectedChoice } from '@common/events';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { BarChartGateway } from './bar-chart.gateway';

describe('BarChartGateway', () => {
    let gateway: BarChartGateway;
    let chartService: SinonStubbedInstance<BarChartService>;
    let logger: SinonStubbedInstance<Logger>;

    beforeEach(async () => {
        logger = createStubInstance(Logger);
        chartService = createStubInstance(BarChartService);

        const module: TestingModule = await Test.createTestingModule({
            providers: [BarChartGateway, { provide: BarChartService, useValue: chartService }, { provide: Logger, useValue: logger }],
        }).compile();

        gateway = module.get<BarChartGateway>(BarChartGateway);
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    it('should send selected choice and update organiser', () => {
        const selectedChoice = { index: 0 } as SelectedChoice;
        const socket = socketMock('');
        gateway.send(socket, selectedChoice);
        expect(chartService.send.calledOnceWith(socket, selectedChoice)).toBeTruthy();
        expect(chartService.sendSelectedToOrganiser.calledOnceWith(socket)).toBeTruthy();
    });

    it('should send interaction', () => {
        const interaction = { isChanged: true } as Interaction;
        const socket = socketMock('');
        gateway.sendInteraction(socket, interaction);
        expect(chartService.sendInteraction.calledOnceWith(socket, interaction)).toBeTruthy();
    });
});
