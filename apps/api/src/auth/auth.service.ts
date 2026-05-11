import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import {
  AccessControl,
  IAccessControlPermission,
} from '../common/guards/access-control/access-control';
import { UserService } from 'user/user.service';
import { RoleService } from '../role/role.service';
import { User } from '../user/entities/user.entity';
import { MailService } from './../common/mail/mail.service';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';
import { AuthExternalStrategyDto } from './dto/auth-external-strategy.dto';
import { AuthRegisterLoginDto } from './dto/auth-register-login.dto';
import { AuthUpdateDto } from './dto/auth-update.dto';
import { ForgotService } from './forgot/forgot.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
    private roleService: RoleService,
    private forgotService: ForgotService,
    private mailService: MailService,
    private configService: ConfigService,
  ) {}

  async validateLogin(loginDto: AuthEmailLoginDto): Promise<User> {
    const user = await this.userService.findOne({
      email: loginDto.email,
    });
    if (!user || !(await user.validatePassword(loginDto.password))) {
      throw new BadRequestException({
        message: 'Email is not found or password is wrong',
      });
    }
    return user;
  }

  async buildAccessToken(id: string) {
    const user = await this.userService.findOne({
      id,
    });
    return this.jwtService.sign({
      _id: user.id,
      id: user.id,
      sub: user.id,
      email: user.email,
    });
  }

  async register(
    dto: AuthRegisterLoginDto,
    emailConfirmation = true,
  ): Promise<any> {
    // todo: change this var to confirmHash
    let emailHashConfirm = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');
    if (!emailConfirmation) {
      emailHashConfirm = null;
    }

    const user = await this.userService.create({
      ...dto,
      email: dto.email,
      emailHashConfirm,
    } as any);

    const defaultRole = await this.roleService.findDefault();
    const defaultOrgId = this.configService.get('admin.organization.id');

    if (defaultRole) {
      await this.roleService.assign({
        userId: user.id,
        roleId: defaultRole.id,
        organizationId: defaultOrgId,
      });
    }

    if (emailConfirmation) {
      await this.mailService.userSignUp({
        to: user.email,
        data: {
          hash: emailHashConfirm,
          firstName: user.firstName,
        },
      });
    }
    if (this.configService.get('app.nodeEnv') !== 'production') {
      return { hash: emailHashConfirm, ...user };
    }

    return user;
  }

  async confirmEmail(emailHashConfirm: string): Promise<void> {
    const user = await this.userService.findOne({
      emailHashConfirm,
    });

    if (!user) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: `notFound`,
        },
        HttpStatus.NOT_FOUND,
      );
    }

    user.emailHashConfirm = null;
    await this.userService.save(user);
  }

  async forgotPassword(email: string): Promise<any> {
    const user = await this.userService.findOne({
      email,
    });

    if (!user) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            email: 'emailNotExists',
          },
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    } else {
      const hash = crypto
        .createHash('sha256')
        .update(randomStringGenerator())
        .digest('hex');
      await this.forgotService.create({
        hash,
        userId: user.id,
      });

      await this.mailService.forgotPassword({
        to: email,
        data: {
          firstName: user.firstName,
          hash,
        },
      });
      if (this.configService.get('app.nodeEnv') !== 'production') {
        // JUST FOR TESTS
        return { hash };
      }
    }
  }

  async resetPassword(hash: string, password: string): Promise<void> {
    const forgot = await this.forgotService.findOne({
      where: {
        hash,
      },
    });
    if (!forgot) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            hash: `notFound`,
          },
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const user = await this.userService.findOne({ id: forgot.userId });
    user.password = password;
    await user.save();
    await this.forgotService.softDelete(forgot.id);
  }

  async me(user: any): Promise<User> {
    return await this.userService.findOne({
      id: user.id,
    });
  }

  async passwordValidationStep(
    user: User,
    dtoPassword: string,
    dtoOldPassword: string,
  ) {
    /* If user isn't setting a new password, skips */
    if (!dtoPassword) return;
    /* If user doesn't have a setted password like from Google auth, skips */
    if (!user.password) return;

    /* If user isn't providing the previous password, throws error */
    if (!dtoOldPassword) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            oldPassword: 'missingOldPassword',
          },
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    /* If old password is invalid throws error */
    const isOldPasswordValid = await user.validatePassword(dtoOldPassword);
    if (!isOldPasswordValid) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            oldPassword: 'incorrectOldPassword',
          },
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  async update(user: User, userDto: AuthUpdateDto): Promise<User> {
    const currentUser = await this.userService.findOne(
      {
        id: user.id,
      },
      { select: { id: true, password: true } },
    );

    await this.passwordValidationStep(
      currentUser,
      userDto.password,
      userDto.oldPassword,
    );

    delete userDto.oldPassword;

    await this.userService.findByIdAndUpdate(user.id, userDto);

    return this.userService.findOne({ id: user.id });
  }

  async softDelete(user: User): Promise<void> {
    await this.userService.softDelete(user.id);
  }

  async resendEmailConfirmation(id: string): Promise<void> {
    const user = await this.userService.findOne({
      id,
    });

    if (!user) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            email: 'userNotExists',
          },
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    if (!user.emailHashConfirm) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: { hash: 'emailAlreadyConfirmed' },
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    return await this.mailService.userSignUp({
      to: user.email,
      data: {
        hash: user.emailHashConfirm,
        firstName: user.firstName,
      },
    });
  }

  async getPermissions(user: User): Promise<IAccessControlPermission[]> {
    const assignments = await this.roleService.listUserRoles(user.id);
    const accessControl = new AccessControl(assignments);
    return accessControl.permissions;
  }

  async getRoles(user: User) {
    return await this.roleService.listUserRoles(user.id);
  }

  async createOrValidateExternalOidcUser(payload: AuthExternalStrategyDto) {
    payload.email = payload.email.toLowerCase();
    let user = await this.userService.findOne({
      email: payload.email,
    });

    const now = new Date();

    if (user === null) {
      await this.register(
        {
          email: payload.email,
          firstName: payload.firstName,
          lastName: payload.lastName,
          country: payload.country,
          password: null,
          cpf: payload.cpf,
          govBrData: payload.govBrData,
          lastGovBrLoginAt: now,
          govBrFirstLoginAt: now,
          avatarUrl: payload.picture,
        },
        false,
      );
      user = await this.userService.findOne({ email: payload.email });
      return { ...user, isNewUser: true };
    } else {
      const updateData: any = {
        lastGovBrLoginAt: now,
      };

      if (!user.govBrFirstLoginAt) {
        updateData.govBrFirstLoginAt = now;
      }

      if (payload.govBrData) {
        updateData.govBrData = payload.govBrData;
      }

      if (!user.cpf && payload.cpf) {
        updateData.cpf = payload.cpf;
      }

      if (payload.firstName && !user.firstName) {
        updateData.firstName = payload.firstName;
      }

      if (payload.lastName && !user.lastName) {
        updateData.lastName = payload.lastName;
      }

      if (payload.picture) {
        updateData.avatarUrl = payload.picture;
      }

      await this.userService.update(user.id, updateData);
      return await this.userService.findOne({ id: user.id });
    }
  }
}
