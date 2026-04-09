import {
  BaseEntity,
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

export interface IAppSettings {
  organizations: {
    allowUserCreation: boolean;
  };
}

@Entity('app_settings')
export class AppSettings extends BaseEntity {
  @PrimaryColumn()
  id: number = 1;

  @Column({ type: 'jsonb', nullable: false })
  data: IAppSettings;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  ensureSingleton() {
    this.id = 1;
  }
}
