import { SinonStubbedInstance, createStubInstance, match } from 'sinon';
import { Presentation } from './presentation';
import { GameRoom } from '@app/classes/game-room/game-room';
import { GameState } from '@app/classes/game/game';
import { Timer } from '@app/classes/timer/timer';
import { GAME_PRESENTATION_DELAY } from '@common/constants';
import { Room } from '@app/classes/room/room';
import { Player } from '@app/classes/player/player';
import { GameEvent } from '@common/events';

describe('Presentation', () => {
    let state: Presentation;
    let game: SinonStubbedInstance<GameRoom>;
    let room: SinonStubbedInstance<Room<Player>>;
    let timer: SinonStubbedInstance<Timer>;

    beforeEach(() => {
        game = createStubInstance(GameRoom);
        game.room = room = createStubInstance(Room);
        timer = createStubInstance(Timer);
        state = new Presentation(game);
        state['timer'] = timer;
    });

    it('should be defined', () => {
        expect(state).toBeDefined();
    });

    describe('init', () => {
        it('should start a timer for presentation', () => {
            timer.remaining.returns(1);
            state.onInit();
            expect(timer.startCountdown.calledOnceWith(GAME_PRESENTATION_DELAY)).toBeTruthy();
            expect(timer.onTick.calledWith(match.func)).toBeTruthy();
            expect(room.toAll.calledWith(GameEvent.ShowPresentation)).toBeTruthy();
            expect(room.toAll.calledWith(GameEvent.Tick, 1)).toBeTruthy();
        });

        describe('timer', () => {
            beforeEach(() => {
                timer.onTick.callsFake((c) => (timer['callback'] = c));
                state.onInit();
            });

            it('should tick if timer is not done', () => {
                timer.isDone.returns(false);
                timer.remaining.returns(1);
                timer['callback'](timer);
                expect(room.toAll.calledWith(GameEvent.Tick, 1)).toBeTruthy();
            });

            it('should update game room and pause timer if timer is done', () => {
                timer.isDone.returns(true);
                timer['callback'](timer);
                expect(timer.pause.calledOnce).toBeTruthy();
                expect(game.update.calledOnce).toBeTruthy();
            });
        });
    });

    describe('next state', () => {
        it('should go to answering if timer is done', () => {
            timer.isDone.returns(true);
            expect(state.nextState()).toBe(GameState.Answering);
        });

        it('should stay in this state if timer is not done', () => {
            timer.isDone.returns(false);
            expect(state.nextState()).toBe(GameState.Presentation);
        });
    });
});
