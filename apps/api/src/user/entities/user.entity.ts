import * as bcrypt from 'bcrypt';
import { Exclude } from 'class-transformer';
import {
  AfterLoad,
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRoleAssignment } from '../../role/entities/user-role-assignment.entity';
import { UserStatus } from '../enums/user-status.enum';

@Entity('users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true })
  email: string | null;

  @Column({ nullable: true })
  @Exclude({ toPlainOnly: true })
  password: string;

  @Index()
  @Column({ nullable: true })
  firstName: string | null;

  @Index()
  @Column({ nullable: true })
  lastName: string | null;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ nullable: true })
  @Index()
  @Exclude({ toPlainOnly: true })
  emailHashConfirm?: string | null;

  @Column({ nullable: true })
  otpSecret!: string | null;

  @Column({ default: false })
  otpValidated!: boolean;

  @Column({
    default: false,
  })
  requires2fa!: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @Exclude({ toPlainOnly: true })
  public previousPassword: string;

  @AfterLoad()
  public loadPreviousPassword(): void {
    this.previousPassword = this.password;
  }

  get isEmailConfirmed() {
    return !this.emailHashConfirm;
  }

  validatePassword(plainPassword: string) {
    if (!this.password || !plainPassword) {
      return false;
    }
    return bcrypt.compare(plainPassword, this.password);
  }

  @OneToMany(() => UserRoleAssignment, (ura) => ura.user)
  userRoleAssignments: UserRoleAssignment[];
}
