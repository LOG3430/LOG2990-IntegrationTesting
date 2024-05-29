export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const TICK_DELAY = SECOND;

export const NORMAL_SPEED = 1;
export const PANIC_SPEED = 4;

export const SCORE_BONUS = 1.2;

export const SHOW_ANSWERS_DELAY = 3 * SECOND;
export const GAME_PRESENTATION_DELAY = 5 * SECOND;

export const INTERACTION_DELAY = 5 * SECOND;

export const GAME_ROOM_ID_LEN = 4;
export const GAME_ROOM_ID_MAX_DIGIT = 9;
export const ROOM_DEATH_TIMEOUT_DELAY = 5 * SECOND;

export const RANDOM_MODE_DURATION = 20;
export const N_QUESTIONS_RANDOM_MODE = 5;

export const LAQ_DURATION = MINUTE;

export const SESSION_DURATION = 60 * MINUTE;
export const SESSION_TOKEN_KEY = 'KALIKO-TOKEN';

export const MAX_MESSAGE_LENGTH = 200;
export const MAX_USERNAME_LENGTH = 50;

export const ONE_HUNDRED = 100;

export const ORGANISER_NAME = 'Organisateur';
export const SYSTEM_NAME = 'SYSTÈME';

export const PANIC_QRL_CUTOFF = 20;
export const PANIC_QCM_CUTOFF = 10;

export const PERCENTAGE = 100;

export const LOGGER_PRETTY_PRINT_INDENT = 4;

export enum Swipe {
    Left = -1,
    Right = 1,
}

export const QuestionConstants = {
    MIN_POINTS: 10,
    MAX_POINTS: 100,
    POINTS_STEP: 10,

    MAX_CHOICE_LENGTH: 55,
    MAX_ANSWER_LENGTH: 125,
    STRING_MIN_LENGTH: 1,
    MAX_ANSWERS_LAQ_LENGTH: 200,

    MIN_CHOICES: 2,
    MAX_CHOICES: 4,
};

export const QuizConstants = {
    STRING_MIN_LENGTH: 1,
    TITLE_MAX_LENGTH: 256,
    DESCRIPTION_MAX_LENGTH: 512,

    MIN_DURATION: 10,
    MAX_DURATION: 60,
    DURATION_STEP: 10,
};

export const GREEN_FILLER = 'rgba(75, 192, 192, 0.5)';
export const GREEN_BORDER = 'rgb(75, 192, 192)';
export const RED_FILLER = 'rgba(255, 99, 132, 0.5)';
export const RED_BORDER = 'rgb(255, 99, 132)';
export const MAX_LABEL_LENGTH = 30;