import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateQuestionAnswerDto } from '../dto/create-question-answer.dto';
import { UpdateQuestionAnswerDto } from '../dto/update-question-answer.dto';
import { QuestionAnswer } from '../entities/question-answer.entity';
import { QuestionTab } from '../entities/question-tab.entity';

@Injectable()
export class QuestionAnswerService {
  constructor(
    @InjectRepository(QuestionAnswer)
    private readonly questionAnswerRepository: Repository<QuestionAnswer>,
    @InjectRepository(QuestionTab)
    private readonly questionTabRepository: Repository<QuestionTab>,
  ) {}

  async create(
    createQuestionAnswerDto: CreateQuestionAnswerDto,
  ): Promise<QuestionAnswer> {
    const { tabIds, ...answerData } = createQuestionAnswerDto;

    const questionAnswer = this.questionAnswerRepository.create(answerData);

    if (tabIds && tabIds.length > 0) {
      const tabs = await this.questionTabRepository.find({
        where: { id: In(tabIds) },
      });
      questionAnswer.tabs = tabs;
    }

    return this.questionAnswerRepository.save(questionAnswer);
  }

  async findAll(): Promise<QuestionAnswer[]> {
    return this.questionAnswerRepository.find({
      order: { index: 'ASC' },
      relations: ['tabs'],
    });
  }

  async findOne(id: string): Promise<QuestionAnswer> {
    const questionAnswer = await this.questionAnswerRepository.findOne({
      where: { id },
      relations: ['tabs'],
    });

    if (!questionAnswer) {
      throw new NotFoundException(`QuestionAnswer with ID ${id} not found`);
    }

    return questionAnswer;
  }

  async update(
    id: string,
    updateQuestionAnswerDto: UpdateQuestionAnswerDto,
  ): Promise<QuestionAnswer> {
    const questionAnswer = await this.findOne(id);
    const { tabIds, ...updateData } = updateQuestionAnswerDto;

    this.questionAnswerRepository.merge(questionAnswer, updateData);

    if (tabIds) {
      const tabs = await this.questionTabRepository.find({
        where: { id: In(tabIds) },
      });
      questionAnswer.tabs = tabs;
    }

    return this.questionAnswerRepository.save(questionAnswer);
  }

  async remove(id: string): Promise<void> {
    const questionAnswer = await this.findOne(id);
    await this.questionAnswerRepository.remove(questionAnswer);
  }
}
