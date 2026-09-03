import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SYSTEM_ROLES } from 'common/constants/system-roles.const';
import * as crypto from 'crypto';
import { UserService } from 'user/user.service';
import {
  AccessControl,
  IAccessControlPermission,
} from '../common/guards/access-control/access-control';
import { OrganizationService } from '../organization/organization.service';
import { RoleService } from '../role/role.service';
import { User } from '../user/entities/user.entity';
import { UserStatus } from '../user/enums/user-status.enum';
import { MailService } from './../common/mail/mail.service';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';
import { AuthExternalStrategyDto } from './dto/auth-external-strategy.dto';
import { AuthRegisterLoginDto } from './dto/auth-register-login.dto';
import { AuthUpdateDto } from './dto/auth-update.dto';
import { ForgotService } from './forgot/forgot.service';
import { CpfValidationService } from './services/cpf-validation.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
    private roleService: RoleService,
    private forgotService: ForgotService,
    private mailService: MailService,
    private configService: ConfigService,
    private cpfValidationService: CpfValidationService,
    @Inject(forwardRef(() => OrganizationService))
    private organizationService: OrganizationService,
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

    await this.createOrUpdatePfOrganization(user);
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

  async register(dto: AuthRegisterLoginDto): Promise<any> {
    // todo: change this var to confirmHash
    const emailHashConfirm = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');

    if (dto.cpf) {
      dto.cpf = dto.cpf.replace(/\D/g, '');
      await this.cpfValidationService.validate(dto.cpf);
      await this.validateExistingLegalRegistration(dto.cpf);
    }

    let initialStatus = UserStatus.ACTIVE;
    const requiresAnalysisTypes = [
      'fisica_emancipada',
      'fisica_assistido_parental',
      'fisica_assistido_tutor',
    ];
    if (requiresAnalysisTypes.includes(dto.accountType)) {
      initialStatus = UserStatus.IN_ANALYSIS;
    }

    const user = await this.userService.create({
      ...dto,
      email: dto.email,
      status: initialStatus,
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

    // Ensure PF Organization is created
    await this.createOrUpdatePfOrganization(user);

    await this.mailService.userSignUp({
      to: user.email,
      data: {
        hash: emailHashConfirm,
        firstName: user.firstName,
      },
    });

    if (this.configService.get('app.nodeEnv') !== 'production') {
      return { hash: emailHashConfirm, ...user };
    }

    return user;
  }

  private async validateExistingLegalRegistration(cpf: string): Promise<void> {
    const organization = await this.organizationService.findOneByDocument(cpf);
    const representedType = organization?.metadata?.representedType;

    if (!['Espólio', 'Herança jacente ou vacante'].includes(representedType)) {
      return;
    }

    throw new BadRequestException(
      `Este CPF já está cadastrado como ${representedType}. Para alterar ou corrigir a situação, contate o suporte do Urbis.`,
    );
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

  async me(user: any, includeSystem = false): Promise<User> {
    const currentUser = await this.userService.findOne({
      id: user.id,
    });

    if (!currentUser || includeSystem === false) {
      if (currentUser?.userRoleAssignments) {
        const systemOrganizationId = this.configService.get<string>(
          'admin.organization.id',
        );
        currentUser.userRoleAssignments =
          currentUser.userRoleAssignments.filter(
            (assignment) => assignment.organizationId !== systemOrganizationId,
          );
      }
      return currentUser;
    }

    const systemOrganizationId = this.configService.get<string>(
      'admin.organization.id',
    );
    const isSystemAdmin = currentUser.userRoleAssignments?.some(
      (assignment) =>
        assignment.organizationId === systemOrganizationId &&
        assignment.roleId === SYSTEM_ROLES.admin,
    );

    if (!isSystemAdmin) {
      currentUser.userRoleAssignments = currentUser.userRoleAssignments?.filter(
        (assignment) => assignment.organizationId !== systemOrganizationId,
      );
    }

    return currentUser;
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

    const isChangingName =
      userDto.firstName !== undefined || userDto.lastName !== undefined;
    if (isChangingName) {
      const roles = await this.roleService.listUserRoles(user.id);
      const isAdmin = roles.some(
        (assignment) => assignment.roleId === SYSTEM_ROLES.admin,
      );

      if (!isAdmin) {
        throw new ForbiddenException(
          'Somente administradores podem alterar nome e sobrenome.',
        );
      }
    }

    delete userDto.oldPassword;

    await this.userService.findByIdAndUpdate(user.id, userDto as any);

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

  async getPermissions(
    user: User,
    organizationId?: string,
  ): Promise<IAccessControlPermission[]> {
    const assignments = await this.roleService.listUserRoles(
      user.id,
      organizationId,
    );
    const accessControl = new AccessControl(assignments);
    return accessControl.permissions;
  }

  async getRoles(user: User, organizationId?: string) {
    return await this.roleService.listUserRoles(user.id, organizationId);
  }

  async createOrValidateExternalOidcUser(payload: AuthExternalStrategyDto) {
    payload.email = payload.email.toLowerCase().trim();
    const cpf = payload.cpf?.replace(/\D/g, '');
    const formattedCpf = cpf?.replace(
      /(\d{3})(\d{3})(\d{3})(\d{2})/,
      '$1.$2.$3-$4',
    );
    const userByCpf = cpf ? await this.userService.findOne({ cpf }) : null;
    const legacyUserByCpf =
      !userByCpf && formattedCpf
        ? await this.userService.findOne({ cpf: formattedCpf })
        : null;
    const userByEmail =
      userByCpf || legacyUserByCpf
        ? null
        : await this.userService.findOne({ email: payload.email });
    const user = userByCpf ?? legacyUserByCpf ?? userByEmail;

    const now = new Date();

    if (user === null) {
      throw new HttpException(
        {
          status: HttpStatus.UNAUTHORIZED,
          message: 'USER_NOT_FOUND',
          data: {
            email: payload.email,
            firstName: payload.firstName,
            lastName: payload.lastName,
            cpf,
            picture: payload.picture,
          },
        },
        HttpStatus.UNAUTHORIZED,
      );
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

      if (!user.cpf && cpf) {
        updateData.cpf = cpf;
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
      const updatedUser = await this.userService.findOne({ id: user.id });
      await this.createOrUpdatePfOrganization(updatedUser);
      return updatedUser;
    }
  }

  async createOrUpdatePfOrganization(user: User) {
    if (!user.cpf) return;

    const ACCOUNT_TYPE_LABELS: Record<string, string> = {
      fisica_capaz: 'Pessoa física Capaz',
      fisica_emancipada: 'Pessoa física capaz (emancipada)',
      fisica_assistido_parental:
        'Pessoa física assistida por autoridade parental',
      fisica_assistido_tutor: 'Pessoa física assistida por tutor',
    };
    const pfLabel =
      ACCOUNT_TYPE_LABELS[user.accountType] || 'Pessoa física Capaz';
    const pfDescription = `Sua conta - ${pfLabel}`;

    const pfOrg = await this.organizationService.findOneByDocument(
      user.cpf.replace(/\D/g, ''),
    );

    if (pfOrg) {
      // Update existing PF Organization if needed
      const updatedOrg = await this.organizationService.update(
        pfOrg.id,
        {
          name: user.firstName,
          document: user.cpf.replace(/\D/g, ''),
          description: pfDescription,
          metadata: {
            ...pfOrg.metadata,
            userId: user.id,
            documentType: 'CPF',
            accountType: user.accountType,
            birthDate: user.birthDate,
            phone: user.phone,
            socialName: user.socialName,
            address: user.address,
            digitalAddress: user.digitalAddress,
          },
        } as any,
        user,
      );

      if (!(await this.roleService.hasOrganization(user.id, pfOrg.id))) {
        await this.roleService.assign(
          {
            organizationId: pfOrg.id,
            userId: user.id,
            roleId: SYSTEM_ROLES.organizationAdmin,
          },
          pfOrg,
        );
      }

      return updatedOrg;
    } else {
      // Create new PF Organization
      const newOrg = await this.organizationService.createOwn(
        {
          name: user.firstName,
          document: user.cpf.replace(/\D/g, ''),
          description: pfDescription,
          metadata: {
            documentType: 'CPF',
            userId: user.id,
            accountType: user.accountType,
            birthDate: user.birthDate,
            phone: user.phone,
            socialName: user.socialName,
            address: user.address,
            digitalAddress: user.digitalAddress,
          },
        } as any,
        user,
      );

      return newOrg;
    }
  }
}
