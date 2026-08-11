import {
  Column,
  Entity,
  ManyToMany,
  JoinTable,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { QuestionAnswer } from './question-answer.entity';

@Entity('question_tabs')
export class QuestionTab {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  icon?: string;

  @Column({ nullable: true })
  index?: number;

  @ManyToMany(() => QuestionAnswer, (answer) => answer.tabs)
  @JoinTable({
    name: 'question_tabs_answers',
    joinColumn: {
      name: 'question_tab_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'question_answer_id',
      referencedColumnName: 'id',
    },
  })
  answers: QuestionAnswer[];
}
