import { GameStateBase } from '@app/classes/game-states/game-state-base/game-state-base';
import { GameState } from '@app/classes/game/game';

export class Joining extends GameStateBase {
    nextState(): GameState {
        return this.gameroom.receivedStart() ? GameState.Answering : GameState.Joining;
    }
}
