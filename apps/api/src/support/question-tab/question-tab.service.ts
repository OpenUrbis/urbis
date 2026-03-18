import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateQuestionTabDto } from '../dto/create-question-tab.dto';
import { UpdateQuestionTabDto } from '../dto/update-question-tab.dto';
import { QuestionTab } from '../entities/question-tab.entity';

@Injectable()
export class QuestionTabService {
  constructor(
    @InjectRepository(QuestionTab)
    private readonly questionTabRepository: Repository<QuestionTab>,
  ) {}

  async create(
    createQuestionTabDto: CreateQuestionTabDto,
  ): Promise<QuestionTab> {
    const questionTab = this.questionTabRepository.create(createQuestionTabDto);
    return this.questionTabRepository.save(questionTab);
  }

  async findAll(): Promise<QuestionTab[]> {
    return this.questionTabRepository.find({
      order: {
        index: 'ASC',
        answers: {
          index: 'ASC',
        },
      },
      relations: ['answers'],
    });
  }

  async findOne(id: string): Promise<QuestionTab> {
    const questionTab = await this.questionTabRepository.findOne({
      where: { id },
      relations: ['answers'],
    });

    if (!questionTab) {
      throw new NotFoundException(`QuestionTab with ID ${id} not found`);
    }

    return questionTab;
  }

  async update(
    id: string,
    updateQuestionTabDto: UpdateQuestionTabDto,
  ): Promise<QuestionTab> {
    const questionTab = await this.findOne(id);
    this.questionTabRepository.merge(questionTab, updateQuestionTabDto);
    return this.questionTabRepository.save(questionTab);
  }

  async remove(id: string): Promise<void> {
    const questionTab = await this.findOne(id);
    await this.questionTabRepository.remove(questionTab);
  }
}
