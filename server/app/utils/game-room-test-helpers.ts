import { GameRoom } from '@app/classes/game-room/game-room';
import { Game, GameState } from '@app/classes/game/game';
import { Player } from '@app/classes/player/player';
import { Room } from '@app/classes/room/room';
import { Choice } from '@common/choice';
import { SECOND } from '@common/constants';
import { GameQuestion } from '@common/events';
import { Question } from '@common/question';
import { Quiz } from '@common/quiz';
import { SinonStubbedInstance, reset } from 'sinon';
import { socketMock } from './socket-mock';
import { QTypes } from '@common/question-type';

export const choice = (isCorrect: boolean): Choice => {
    return { text: '', isCorrect };
};

export const question = (points: number, choices: Choice[]): Question => {
    return { id: '', text: '', points, choices, lastModif: '', type: QTypes.MCQ };
};

export const startDateTime = 1234;

export const POINTS = 10;

export const quiz: Quiz = {
    duration: 5,
    questions: [
        question(POINTS, [choice(true), choice(false)]),
        question(POINTS, [choice(false), choice(true)]),
        question(POINTS, [choice(false), choice(true)]),
        question(POINTS, [choice(false), choice(true)]),
    ],
} as Quiz;

export const msDuration = () => {
    return quiz.duration * SECOND;
};

export const gameQuestion = (index: number): GameQuestion => {
    return {
        index,
        text: quiz.questions[index].text,
        choices: quiz.questions[index].choices.map((c) => c.text),
        points: quiz.questions[index].points,
        type: quiz.questions[index].type,
    };
};

export const inspect = (gameroom: GameRoom): Game => {
    return gameroom['game'];
};

export const spyOnPrivate = (gameroom: GameRoom, method: string) => {
    // eslint-disable-next-line
    return jest.spyOn(gameroom as any, method);
};

export const playerMock = (id: string) => {
    return new Player(socketMock(id), id + 'name');
};

export class GameContext {
    constructor(
        private room: SinonStubbedInstance<Room<Player>>,
        private gameroom: GameRoom,
    ) {}

    runToState(state: GameState, clearMocks = true) {
        switch (state) {
            case GameState.Joining:
                break;
            case GameState.Presentation:
                this.runToState(GameState.Joining, false);
                this.room.getMembers.returns([playerMock('a')]);
                this.room.isOrganiser.returns(true);
                this.room.isUnlocked.returns(false);
                this.gameroom.startGame(socketMock('org'));
                break;
            case GameState.Answering:
                this.runToState(GameState.Presentation, false);
                while (this.gameroom.game.state !== GameState.Answering) {
                    jest.runOnlyPendingTimers();
                }
                break;
            case GameState.ShowingAnswers:
                this.runToState(GameState.Answering, false);
                this.room.getMembers.returns([]); // no player -> all answered
                jest.runOnlyPendingTimers();
                break;
            case GameState.Over:
                while (inspect(this.gameroom).state !== GameState.Over) {
                    this.runToState(GameState.ShowingAnswers, false);
                    this.gameroom.ready(socketMock('org'));
                    jest.runOnlyPendingTimers();
                }
                break;
        }

        if (clearMocks) {
            reset();
        }
    }
}
