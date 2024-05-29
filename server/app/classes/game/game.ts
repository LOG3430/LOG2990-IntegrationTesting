import { Timer } from '@app/classes/timer/timer';
import { GameQuestion } from '@common/events';
import { Question } from '@common/question';
import { QTypes } from '@common/question-type';
import { Quiz } from '@common/quiz';

export enum GameState {
    Joining = 'join',
    Presentation = 'presentation',
    Answering = 'answering',
    Evaluation = 'evaluation',
    TimedOut = 'timedout',
    ShowingAnswers = 'showing',
    Over = 'gameover',
}

export class Game {
    state: GameState = GameState.Joining;

    receivedStart: boolean = false;
    isReadyForNextQuestion: boolean = false;
    hasNextQuestion: boolean = true;

    timer: Timer = new Timer();
    timerTimedout = null;

    private questionIndex: number = 0;

    constructor(readonly quiz: Quiz) {}

    nQuestions(): number {
        return this.quiz.questions.length;
    }

    getTitle(): string {
        return this.quiz.title;
    }

    goToNextQuestion(): void {
        this.hasNextQuestion = ++this.questionIndex !== this.nQuestions();
    }

    getCurrentQuestion(): Question {
        return this.quiz.questions[this.questionIndex];
    }

    getGameQuestion(): GameQuestion {
        return this.toGameQuestion(this.getCurrentQuestion(), this.questionIndex);
    }

    toGameQuestion(question: Question, index: number): GameQuestion {
        return {
            index,
            text: question.text,
            points: question.points,
            choices: question.type === QTypes.MCQ ? question.choices.map((c) => c.text) : undefined,
            type: question.type,
        };
    }
}
