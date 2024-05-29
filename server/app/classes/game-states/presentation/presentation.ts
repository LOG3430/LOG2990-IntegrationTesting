import { GameState } from '@app/classes/game/game';
import { GameStateBase } from '@app/classes/game-states/game-state-base/game-state-base';
import { Timer } from '@app/classes/timer/timer';
import { GAME_PRESENTATION_DELAY } from '@common/constants';
import { GameEvent } from '@common/events';

export class Presentation extends GameStateBase {
    private timer = new Timer();

    onInit(): void {
        this.startPresentationCountdown();
    }

    nextState(): GameState {
        return this.timer.isDone() ? GameState.Answering : GameState.Presentation;
    }

    private startPresentationCountdown() {
        this.timer.startCountdown(GAME_PRESENTATION_DELAY);
        this.timer.onTick(this.presentationTick.bind(this));

        this.gameroom.room.toAll(GameEvent.ShowPresentation);
        this.gameroom.room.toAll(GameEvent.Tick, this.timer.remaining());
    }

    private presentationTick() {
        if (this.timer.isDone()) {
            this.timer.pause();
            this.gameroom.update();
        } else {
            this.gameroom.room.toAll(GameEvent.Tick, this.timer.remaining());
        }
    }
}
