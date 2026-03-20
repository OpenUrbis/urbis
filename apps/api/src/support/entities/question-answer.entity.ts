import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { QuestionTab } from './question-tab.entity';

@Entity('question_answers')
export class QuestionAnswer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  question: string;

  @Column()
  answer: string;

  @Column({ nullable: true })
  index?: number;

  @Column({ type: 'text', array: true, nullable: true })
  apps?: string[];

  @ManyToMany(() => QuestionTab, (tab) => tab.answers)
  tabs: QuestionTab[];
}
