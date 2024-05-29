import { GameRoom } from '@app/classes/game-room/game-room';
import { GameState } from '@app/classes/game/game';

export abstract class GameStateBase {
    constructor(protected gameroom: GameRoom) {}

    /* eslint-disable-next-line @typescript-eslint/no-empty-function --
     * Explanation: nothing to do, but must implement
     */
    onInit(): void {}

    abstract nextState(): GameState;
}
