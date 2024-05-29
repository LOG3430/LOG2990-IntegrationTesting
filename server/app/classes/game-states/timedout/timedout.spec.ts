import { Timedout } from './timedout';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { GameRoom } from '@app/classes/game-room/game-room';
import { Room } from '@app/classes/room/room';
import { Player } from '@app/classes/player/player';
import { GameState } from '@app/classes/game/game';
import { playerMock } from '@app/utils/game-room-test-helpers';
import { QTypes } from '@common/question-type';
import { Question } from '@common/question';

describe('Timedout', () => {
    let state: Timedout;
    let game: SinonStubbedInstance<GameRoom>;
    let room: SinonStubbedInstance<Room<Player>>;

    beforeEach(() => {
        room = createStubInstance(Room);
        game = createStubInstance(GameRoom);
        game.room = room;
        state = new Timedout(game);
    });

    it('should be defined', () => {
        expect(state).toBeDefined();
    });

    describe('qcm', () => {
        beforeEach(() => {
            game.getCurrentQuestion.returns({ type: QTypes.MCQ } as Question);
        });

        it('should setup gameroom when reaching this state', () => {
            const p = playerMock('p');
            p.selected = [0, 1];
            const p2 = playerMock('p2');
            p2.infos = { time: Date.now(), answers: [0] };
            game.getPlayers.returns([p, p2]);

            state.onInit();

            expect(game.tick.calledOnce).toBeTruthy();
            expect(p.infos.answers).toEqual([0, 1]);
            expect(p2.infos.answers).toEqual([0]);
            expect(game.update.calledOnce).toBeTruthy();
        });

        describe('states', () => {
            it('should go to showing answers', () => {
                expect(state.nextState()).toBe(GameState.ShowingAnswers);
            });
        });
    });

    describe('qrl', () => {
        beforeEach(() => {
            game.getCurrentQuestion.returns({ type: QTypes.LAQ } as Question);
        });

        it('should setup gameroom when reaching this state', () => {
            const p = playerMock('p');
            p.unconfirmedText = 'hmm';
            const p2 = playerMock('p2');
            p2.infos = { time: Date.now(), answers: 'bla' };
            game.getPlayers.returns([p, p2]);

            state.onInit();

            expect(game.tick.calledOnce).toBeTruthy();
            expect(p.infos.answers).toEqual('hmm');
            expect(p2.infos.answers).toEqual('bla');
            expect(game.update.calledOnce).toBeTruthy();
        });

        describe('states', () => {
            it('should go to evaluation', () => {
                expect(state.nextState()).toBe(GameState.Evaluation);
            });
        });
    });
});
