export interface QuestionAnswer {
  id: string;
  question: string;
  answer: string;
  index: number;
  tabIds?: string[];
  tabs?: QuestionTab[];
  apps?: string[];
}

export interface QuestionTab {
  id: string;
  name: string;
  description: string;
  icon: string;
  index: number;
  answers?: QuestionAnswer[];
}

export interface CreateQuestionTabDto {
  name: string;
  description: string;
  icon: string;
  index: number;
}

export type UpdateQuestionTabDto = Partial<CreateQuestionTabDto>;

export interface CreateQuestionAnswerDto {
  question: string;
  answer: string;
  index?: number;
  tabIds?: string[];
  apps?: string[];
}

export type UpdateQuestionAnswerDto = Partial<CreateQuestionAnswerDto>;

export interface ReorderTabQuestionsDto {
  items: {
    questionAnswerId: string;
    index: number;
  }[];
}
