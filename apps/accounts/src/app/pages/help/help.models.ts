export interface QuestionAnswer {
  id: string;
  question: string;
  answer: string;
  index: number;
  tabIds?: string[];
  tabs?: QuestionTab[];
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

export interface UpdateQuestionTabDto extends Partial<CreateQuestionTabDto> {}

export interface CreateQuestionAnswerDto {
  question: string;
  answer: string;
  index?: number;
  tabIds?: string[];
}

export interface UpdateQuestionAnswerDto
  extends Partial<CreateQuestionAnswerDto> {}

export interface ReorderTabQuestionsDto {
  items: {
    questionAnswerId: string;
    index: number;
  }[];
}