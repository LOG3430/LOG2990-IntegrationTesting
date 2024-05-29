import { GameRoom } from '@app/classes/game-room/game-room';
import { Player } from '@app/classes/player/player';
import { Room } from '@app/classes/room/room';
import { VoteList } from '@app/classes/vote-list/vote-list';
import { GameService } from '@app/services/game/game.service';
import { socketMock } from '@app/utils/socket-mock';
import { BarChartEvent, ChoiceVote, GameQuestion, GradeCategory, Interaction, SelectedChoice } from '@common/events';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { BarChartService } from './bar-chart.service';

describe('BarChartService', () => {
    let gameService: SinonStubbedInstance<GameService>;
    let service: BarChartService;
    let gameroom: SinonStubbedInstance<GameRoom>;
    let votelist: SinonStubbedInstance<VoteList>;
    let room: SinonStubbedInstance<Room<Player>>;

    beforeEach(async () => {
        gameService = createStubInstance(GameService);
        gameroom = createStubInstance(GameRoom);
        votelist = createStubInstance(VoteList);
        room = createStubInstance(Room);
        gameroom.room = room;
        gameroom.getGameQuestion.returns({ index: 0 } as GameQuestion);

        const module: TestingModule = await Test.createTestingModule({
            providers: [BarChartService, { provide: GameService, useValue: gameService }],
        }).compile();

        service = module.get<BarChartService>(BarChartService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('send', () => {
        it('should toggle the game room vote list', () => {
            gameService.getGameRoom.returns(gameroom);
            const socket = socketMock('a');
            const selectedChoice = { index: 0, questionIndex: 0 } as SelectedChoice;
            service.send(socket, selectedChoice);
            expect(gameroom.selectChoice.calledOnceWith(socket, selectedChoice)).toBeTruthy();
        });

        it('should not fail when the game room does not exist', () => {
            gameService.getGameRoom.returns(undefined);
            expect(() => {
                service.send(socketMock(''), {} as SelectedChoice);
            }).not.toThrow();
        });
    });

    describe('send to organiser', () => {
        it('should toggle the game room vote list', () => {
            gameService.getGameRoom.returns(gameroom);
            gameroom.getSelectedVotes.returns(votelist);
            const selected = [{ name: 'a' }] as ChoiceVote[];
            votelist.getVotes.returns(selected);

            service.sendSelectedToOrganiser(socketMock('a'));

            expect(room.toOrganiser.calledOnceWith(BarChartEvent.SendSelectedList, selected)).toBeTruthy();
        });

        it('should not fail when the game room does not exist', () => {
            gameService.getGameRoom.returns(undefined);
            expect(() => {
                service.sendSelectedToOrganiser(socketMock(''));
            }).not.toThrow();
        });

        it('should not fail when there is no votelist', () => {
            gameService.getGameRoom.returns(gameroom);
            gameroom.getSelectedVotes.returns(undefined);
            expect(() => {
                service.sendSelectedToOrganiser(socketMock(''));
            }).not.toThrow();
        });

        it('should not fail when there is no room', () => {
            gameService.getGameRoom.returns(undefined);
            gameroom.getSelectedVotes.returns(votelist);
            expect(() => {
                service['getVoteList'](socketMock(''));
            }).not.toThrow();
        });
    });

    describe('send grades', () => {
        const gradeCount = {
            [GradeCategory.Zero]: 0,
            [GradeCategory.Fifty]: 0,
            [GradeCategory.Hundred]: 0,
        };

        it('should not fail when there is no room', () => {
            gameService.getGameRoom.returns(undefined);
            gameroom.getGradeCounts.returns(gradeCount);
            expect(() => {
                service['getGradeCounts'](socketMock(''));
            }).not.toThrow();
        });
    });

    describe('send interactions', () => {
        const interaction = { isChanged: true } as Interaction;

        it('should call updateInteraction event with hasInteracted', () => {
            gameService.getGameRoom.returns(gameroom);
            const socket = socketMock('a');
            service.sendInteraction(socket, interaction);
            expect(gameroom.updateInteraction.calledOnceWith(socket, interaction)).toBeTruthy();
        });

        it('should not fail when the game room does not exist', () => {
            gameService.getGameRoom.returns(undefined);
            expect(() => {
                service.sendInteraction(socketMock(''), interaction);
            }).not.toThrow();
        });
    });
});
