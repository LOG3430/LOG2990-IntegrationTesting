import { GameRoom } from '@app/classes/game-room/game-room';
import { Answering } from '@app/classes/game-states/answering/answering';
import { GameOver } from '@app/classes/game-states/game-over/game-over';
import { GameStateBase } from '@app/classes/game-states/game-state-base/game-state-base';
import { Joining } from '@app/classes/game-states/joining/joining';
import { ShowingAnswers } from '@app/classes/game-states/showing-answers/showing-answers';
import { Presentation } from '@app/classes/game-states/presentation/presentation';
import { Timedout } from '@app/classes/game-states/timedout/timedout';
import { GameState } from '@app/classes/game/game';
import { Evaluation } from '@app/classes/game-states/evaluation/evaluation';

export type StateConstructor = new (game: GameRoom) => GameStateBase;

export type StateTable = Record<GameState, StateConstructor>;

export const gameStateTable: StateTable = {
    [GameState.Joining]: Joining,
    [GameState.Presentation]: Presentation,
    [GameState.Answering]: Answering,
    [GameState.Evaluation]: Evaluation,
    [GameState.TimedOut]: Timedout,
    [GameState.ShowingAnswers]: ShowingAnswers,
    [GameState.Over]: GameOver,
};

export class Factory {
    constructor(private table: StateTable) {}

    getState(state: GameState): StateConstructor {
        return this.table[state];
    }
}
