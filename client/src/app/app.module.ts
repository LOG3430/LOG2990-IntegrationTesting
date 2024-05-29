import { DragDropModule } from '@angular/cdk/drag-drop';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PlayAreaComponent } from '@app/components/play-area/play-area.component';
import { AppMaterialModule } from '@app/modules/material.module';
import { AppComponent } from '@app/pages/app/app.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { NgChartsModule } from 'ng2-charts';
import { AlertComponent } from './components/alert/alert.component';
import { BarChartComponent } from './components/bar-chart/bar-chart.component';
import { ChatComponent } from './components/chat/chat.component';
import { ConfirmComponent } from './components/confirm/confirm.component';
import { ErrorComponent } from './components/error/error.component';
import { EvaluationComponent } from './components/evaluation/evaluation.component';
import { GamePresentationComponent } from './components/game-presentation/game-presentation.component';
import { HeaderComponent } from './components/header/header.component';
import { LeaderboardComponent } from './components/leaderboard/leaderboard.component';
import { McqPanelComponent } from './components/mcq-panel/mcq-panel.component';
import { PasswordDialogComponent } from './components/password-dialog/password-dialog.component';
import { AnswersComponent } from './components/play-area/answers/answers.component';
import { QuestionPanelComponent } from './components/question-panel/question-panel.component';
import { QuizDetailsComponent } from './components/quiz-details/quiz-details.component';
import { QuizPanelComponent } from './components/quiz-panel/quiz-panel.component';
import { PickQuestionComponent } from './components/quiz/pick-question/pick-question.component';
import { QuizQuestionComponent } from './components/quiz/quiz-question/quiz-question.component';
import { RandomModeSelectorComponent } from './components/random-mode-selector/random-mode-selector.component';
import { RemainingTimeComponent } from './components/remaining-time/remaining-time.component';
import { ResultComponent } from './components/result/result.component';
import { TimerComponent } from './components/timer/timer.component';
import { WaitingAreaComponent } from './components/waiting-area/waiting-area.component';
import { AppRoutingModule } from './modules/app-routing.module';
import { AdminPageComponent } from './pages/admin-page/admin-page.component';
import { CreateGamePageComponent } from './pages/create-game-page/create-game-page.component';
import { HistoryPageComponent } from './pages/history-page/history-page.component';
import { JoinGamePageComponent } from './pages/join-game-page/join-game-page.component';
import { NotFoundPageComponent } from './pages/not-found-page/not-found-page.component';
import { QuestionCatalogComponent } from './pages/question-catalog/question-catalog.component';
import { QuizCatalogComponent } from './pages/quiz-catalog/quiz-catalog.component';
import { QuizCreatorPageComponent } from './pages/quiz-creator-page/quiz-creator-page.component';
import { TestPageComponent } from './pages/test-page/test-page.component';
import { DateFormatterPipe } from './pipes/date-formatter/date-formatter.pipe';
import { QuestionSortPipe } from './pipes/question/question-sort.pipe';
import { QuizSortPipe } from './pipes/quiz/quiz-sort.pipe';

/**
 * Main module that is used in main.ts.
 * All automatically generated components will appear in this module.
 * Please do not move this module in the module folder.
 * Otherwise Angular Cli will not know in which module to put new component
 */
@NgModule({
    declarations: [
        AppComponent,
        GamePageComponent,
        MainPageComponent,
        PlayAreaComponent,
        CreateGamePageComponent,
        AdminPageComponent,
        PasswordDialogComponent,
        QuizCreatorPageComponent,
        QuizQuestionComponent,
        ChatComponent,
        PickQuestionComponent,
        TestPageComponent,
        QuizDetailsComponent,
        QuizCatalogComponent,
        AlertComponent,
        AlertComponent,
        QuestionCatalogComponent,
        TestPageComponent,
        QuestionPanelComponent,
        JoinGamePageComponent,
        HeaderComponent,
        GamePresentationComponent,
        ResultComponent,
        BarChartComponent,
        GamePresentationComponent,
        LeaderboardComponent,
        WaitingAreaComponent,
        AnswersComponent,
        QuizPanelComponent,
        ConfirmComponent,
        TimerComponent,
        ErrorComponent,
        EvaluationComponent,
        HistoryPageComponent,
        McqPanelComponent,
        RandomModeSelectorComponent,
        RemainingTimeComponent,
        QuizSortPipe,
        DateFormatterPipe,
        QuestionSortPipe,
        NotFoundPageComponent,
    ],

    imports: [
        AppMaterialModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        BrowserModule,
        FormsModule,
        HttpClientModule,
        DragDropModule,
        ReactiveFormsModule,
        NgChartsModule,
    ],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}
