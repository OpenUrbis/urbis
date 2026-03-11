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
  email: string;

  @Column({ nullable: true })
  @Exclude({ toPlainOnly: true })
  password: string;

  @Index()
  @Column({ nullable: true })
  firstName: string;

  @Index()
  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ nullable: true })
  @Index()
  @Exclude({ toPlainOnly: true })
  emailHashConfirm?: string;

  @Column({ nullable: true })
  otpSecret!: string;

  @Column({ default: false })
  otpValidated!: boolean;

  @Column({
    default: false,
  })
  requires2fa!: boolean;

  @Column({
    default: 'BR',
  })
  country!: string;

  @Column({ nullable: true })
  phone?: string;

  @Index({ unique: true })
  @Column({ nullable: true, unique: true })
  cpf?: string;

  @Column({ nullable: true })
  socialName?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  digitalAddress?: string;

  @Column('jsonb', { nullable: true })
  termsAccepted?: string[];

  @Column('jsonb', { nullable: true })
  govBrData?: any;

  @Column({ nullable: true })
  lastGovBrLoginAt?: Date;

  @Column({ nullable: true })
  govBrFirstLoginAt?: Date;

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

  public isEmailConfirmed: boolean;

  @AfterLoad()
  public computeIsEmailConfirmed(): void {
    this.isEmailConfirmed = !this.emailHashConfirm;
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
