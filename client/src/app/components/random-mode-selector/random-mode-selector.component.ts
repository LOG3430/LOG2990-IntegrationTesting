import { Component } from '@angular/core';
import { GameService } from '@app/services/game/game.service';
import { GlobalService } from '@app/services/global/global.service';
import { N_QUESTIONS_RANDOM_MODE, RANDOM_MODE_DURATION } from '@common/constants';
import { CreateResponse } from '@common/events';

@Component({
    selector: 'app-random-mode-selector',
    templateUrl: './random-mode-selector.component.html',
    styleUrls: ['./random-mode-selector.component.scss'],
})
export class RandomModeSelectorComponent {
    constructor(
        private gameService: GameService,
        private global: GlobalService,
    ) {}

    getDuration() {
        return RANDOM_MODE_DURATION;
    }

    play(event: MouseEvent): void {
        event.stopPropagation();
        this.gameService.playRandomGame(N_QUESTIONS_RANDOM_MODE).subscribe((res: CreateResponse) => {
            if (res.success) {
                this.global.router.navigate(['/game', { room: res.roomId }]);
            } else {
                this.global.dialog.alert(res.error ?? "Une erreur s'est produite");
            }
        });
    }
}
