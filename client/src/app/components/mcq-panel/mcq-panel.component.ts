import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component } from '@angular/core';
import { AbstractControl, FormControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { QuestionCreatorService } from '@app/services/question-creator/question-creator.service';
import { Choice } from '@common/choice';
import { QuestionConstants } from '@common/constants';

@Component({
    selector: 'app-mcq-panel',
    templateUrl: './mcq-panel.component.html',
    styleUrls: ['./mcq-panel.component.scss'],
})
export class McqPanelComponent {
    formControls: { [index: string]: FormControl } = {
        title: new FormControl('', [this.basicInputValidation()]),
    };

    constructor(private serviceQuestionCreator: QuestionCreatorService) {
        this.serviceQuestionCreator.getChoices()?.forEach((choice, i) => {
            this.formControls[`choice_${i + 1}`] = new FormControl('', [this.basicInputValidation()]);
            this.formControls[`choice_${i + 1}`].setValue(choice.text);
        });
    }

    maxChoiceLength(): number {
        return QuestionConstants.MAX_CHOICE_LENGTH;
    }

    getChoices(): Choice[] {
        return this.serviceQuestionCreator.getChoices();
    }

    updateFormControls(): void {
        if (this.serviceQuestionCreator.getChoices()) {
            this.serviceQuestionCreator.getChoices().forEach((choice, i) => {
                this.formControls[`choice_${i + 1}`].setValue(choice.text);
            });
        }
    }

    drop(event: CdkDragDrop<string[]>): void {
        if (this.serviceQuestionCreator.getQuestion().choices) {
            moveItemInArray(this.serviceQuestionCreator.getChoices(), event.previousIndex, event.currentIndex);
            this.updateFormControls();
        }
    }

    onClickValidity(index: number): void {
        if (this.serviceQuestionCreator.getChoices()) {
            this.serviceQuestionCreator.getChoices()[index].isCorrect = !this.serviceQuestionCreator.getChoices()[index].isCorrect;
        }
    }

    onKeyChoice(event: KeyboardEvent, index: number): void {
        if (this.serviceQuestionCreator.getChoices()) {
            this.serviceQuestionCreator.getChoices()[index].text = (event.target as HTMLInputElement).value;
        }
    }

    addChoice(): void {
        if (this.serviceQuestionCreator.addChoice()) {
            this.formControls[`choice_${this.serviceQuestionCreator.getChoices().length}`] = new FormControl('', [this.basicInputValidation()]);
        }
    }

    deleteChoice(index: number): void {
        this.serviceQuestionCreator.deleteChoice(index);
    }

    // adapted from: https://blog.angular-university.io/angular-custom-validators/
    basicInputValidation(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (Validators.required(control) !== null) return { required: true };
            if (control.value.trim().length === 0) return { whitespace: true };
            return null;
        };
    }
}
