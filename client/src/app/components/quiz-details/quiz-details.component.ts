import { Component, EventEmitter, Input, Output } from '@angular/core';
import { GameService } from '@app/services/game/game.service';
import { GlobalService } from '@app/services/global/global.service';
import { OrganiserService } from '@app/services/organiser/organiser.service';
import { CreateResponse } from '@common/events';
import { Quiz } from '@common/quiz';

@Component({
    selector: 'app-quiz-details',
    templateUrl: './quiz-details.component.html',
    styleUrls: ['./quiz-details.component.scss'],
})
export class QuizDetailsComponent {
    @Input() quiz: Quiz;
    @Input() isSelected: boolean;
    @Output() needsUpdate: EventEmitter<void> = new EventEmitter();

    constructor(
        private gameService: GameService,
        private organiserService: OrganiserService,
        private global: GlobalService,
    ) {}

    testQuiz(event: MouseEvent): void {
        event.stopPropagation();
        this.gameService.testGame(this.quiz).subscribe((res: CreateResponse) => {
            if (res.success) {
                this.global.router.navigate(['/test', { room: res.roomId }]);
                this.organiserService.startGame();
            } else {
                this.needsUpdate.emit();
                this.global.dialog.alert(res.error ?? 'Impossible de tester le jeu, veuillez sélectionner un autre jeu');
            }
        });
    }

    createGame(event: MouseEvent): void {
        event.stopPropagation();
        this.gameService.createGame(this.quiz).subscribe((res: CreateResponse) => {
            if (res.success) {
                this.global.router.navigate(['/game', { room: res.roomId }]);
            } else {
                this.needsUpdate.emit();
                this.global.dialog.alert(res.error ?? 'Impossible de créer une partie, veuillez sélectionner un autre jeu');
            }
        });
    }
}
