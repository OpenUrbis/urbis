import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateQuestionAnswerDto,
  CreateQuestionTabDto,
  QuestionAnswer,
  QuestionTab,
  ReorderTabQuestionsDto,
  UpdateQuestionAnswerDto,
  UpdateQuestionTabDto,
} from './help.models';

@Injectable({ providedIn: 'root' })
export class HelpService {
  private readonly http = inject(HttpClient);

  private readonly questionTabBaseUrl = `${environment.api}/support/question-tabs`;
  private readonly questionAnswerBaseUrl = `${environment.api}/support/question-answers`;

  listTabs(): Observable<QuestionTab[]> {
    return this.http.get<QuestionTab[]>(this.questionTabBaseUrl);
  }

  getTabById(id: string): Observable<QuestionTab> {
    return this.http.get<QuestionTab>(`${this.questionTabBaseUrl}/${id}`);
  }

  createTab(payload: CreateQuestionTabDto): Observable<QuestionTab> {
    return this.http.post<QuestionTab>(this.questionTabBaseUrl, payload);
  }

  updateTab(
    id: string,
    payload: UpdateQuestionTabDto,
  ): Observable<QuestionTab> {
    return this.http.patch<QuestionTab>(
      `${this.questionTabBaseUrl}/${id}`,
      payload,
    );
  }

  deleteTab(id: string): Observable<void> {
    return this.http.delete<void>(`${this.questionTabBaseUrl}/${id}`);
  }

  listQuestions(): Observable<QuestionAnswer[]> {
    return this.http.get<QuestionAnswer[]>(this.questionAnswerBaseUrl);
  }

  getQuestionById(id: string): Observable<QuestionAnswer> {
    return this.http.get<QuestionAnswer>(`${this.questionAnswerBaseUrl}/${id}`);
  }

  createQuestion(payload: CreateQuestionAnswerDto): Observable<QuestionAnswer> {
    return this.http.post<QuestionAnswer>(this.questionAnswerBaseUrl, payload);
  }

  updateQuestion(
    id: string,
    payload: UpdateQuestionAnswerDto,
  ): Observable<QuestionAnswer> {
    return this.http.patch<QuestionAnswer>(
      `${this.questionAnswerBaseUrl}/${id}`,
      payload,
    );
  }

  deleteQuestion(id: string): Observable<void> {
    return this.http.delete<void>(`${this.questionAnswerBaseUrl}/${id}`);
  }

  getTabQuestions(tabId: string): Observable<QuestionTab> {
    return this.http.get<QuestionTab>(`${this.questionTabBaseUrl}/${tabId}`);
  }

  reorderTabQuestions(
    _tabId: string,
    payload: ReorderTabQuestionsDto,
  ): Observable<void> {
    const requests = payload.items.map((item) =>
      this.http.patch<QuestionAnswer>(
        `${this.questionAnswerBaseUrl}/${item.questionAnswerId}`,
        { index: item.index },
      ),
    );

    return forkJoin(requests).pipe(map(() => void 0));
  }
}
