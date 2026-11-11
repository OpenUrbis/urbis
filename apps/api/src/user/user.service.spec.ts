import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { RoleService } from '../role/role.service';
import { MapUsageService } from '../common/map-usage/map-usage.service';
import { MailService } from '../common/mail/mail.service';
import { RepresentationService } from '../representation/representation.service';
import { Brackets } from 'typeorm';

describe('UserService', () => {
  let service: UserService;
  let usersRepository: any;
  let roleService: any;
  let representationService: any;
  const mapUsageService = {
    getDailyUsage: jest.fn().mockResolvedValue(0),
  };

  beforeEach(async () => {
    usersRepository = {
      create: jest.fn((input) => input),
      save: jest.fn((input) => Promise.resolve({ id: 'user-1', ...input })),
      findOne: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    roleService = {
      findDefault: jest.fn(),
      assign: jest.fn(),
      assignByOrganization: jest.fn(),
    };
    representationService = {
      inactivateForUserDeletion: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: usersRepository,
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(1000) },
        },
        {
          provide: RoleService,
          useValue: roleService,
        },
        {
          provide: MapUsageService,
          useValue: mapUsageService,
        },
        {
          provide: MailService,
          useValue: {},
        },
        {
          provide: RepresentationService,
          useValue: representationService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('reads the map proxy usage counter for the authenticated user', async () => {
    mapUsageService.getDailyUsage.mockResolvedValue(12);

    await expect(service.getUsage({ id: 'user-1' })).resolves.toEqual({
      userId: 'user-1',
      dailyLimit: 1000,
      currentUsage: 12,
      remaining: 988,
    });
    expect(mapUsageService.getDailyUsage).toHaveBeenCalledWith('user:user-1');
  });

  describe('create', () => {
    it('creates a user and assigns the organization default role when applicable', async () => {
      usersRepository.save.mockResolvedValue({
        id: 'user-1',
        email: 'ana@example.test',
        cpf: '52998224725',
      });
      roleService.findDefault.mockResolvedValue({
        id: 'organization-default-role',
      });

      await expect(
        service.create(
          { email: 'ana@example.test', cpf: '52998224725' } as User,
          { id: 'organization-1' } as any,
        ),
      ).resolves.toEqual(expect.objectContaining({ id: 'user-1' }));

      expect(roleService.assignByOrganization).toHaveBeenCalledWith(
        'organization-1',
        {
          userId: 'user-1',
          roleIds: ['organization-default-role'],
        },
      );
    });

    it.each([
      ['cpf', { code: '23505', detail: 'Key (cpf) already exists' }, 'cpf'],
      [
        'email',
        { code: '23505', detail: 'Key (email) already exists' },
        'email',
      ],
    ])(
      'maps duplicate %s errors to a field validation error',
      async (_field, error, expectedField) => {
        usersRepository.save.mockRejectedValue(error);

        await expect(
          service.create({ email: 'ana@example.test' } as User),
        ).rejects.toMatchObject({
          response: { errors: { [expectedField]: 'alreadyExists' } },
        });
      },
    );
  });

  describe('list and update', () => {
    it('lists only active users and applies status, verification and document search filters for administration', async () => {
      const queryBuilder: any = {
        leftJoinAndSelect: jest.fn(),
        where: jest.fn(),
        andWhere: jest.fn(),
        take: jest.fn(),
        skip: jest.fn(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      Object.values(queryBuilder).forEach((method: any) => {
        if (method !== queryBuilder.getManyAndCount)
          method.mockReturnValue(queryBuilder);
      });
      usersRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      await service.list(
        { page: 2, limit: 25 },
        'organization-1',
        'ACTIVE' as any,
        '309.241.958-86',
        true,
      );

      expect(queryBuilder.where).toHaveBeenCalledWith(
        'usr."deletedAt" IS NULL',
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'assignment."organizationId" = :organizationId',
        { organizationId: 'organization-1' },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'usr."status" = :status',
        { status: 'ACTIVE' },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'usr."emailHashConfirm" IS NULL',
      );

      const searchBrackets = queryBuilder.andWhere.mock.calls.find(
        ([condition]: [unknown]) => condition instanceof Brackets,
      )?.[0] as Brackets & {
        whereFactory: (queryBuilder: any) => void;
      };
      expect(searchBrackets).toBeDefined();

      const searchQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
      };
      searchBrackets.whereFactory(searchQueryBuilder);

      expect(searchQueryBuilder.where).toHaveBeenCalledWith(
        'usr."firstName" ILIKE :textSearch',
        { textSearch: '%309.241.958-86%' },
      );
      expect(searchQueryBuilder.orWhere).toHaveBeenCalledWith(
        'usr."socialName" ILIKE :textSearch',
        { textSearch: '%309.241.958-86%' },
      );
      expect(searchQueryBuilder.orWhere).toHaveBeenCalledWith(
        expect.stringContaining('regexp_replace(COALESCE(usr."cpf", \'\'),'),
        { documentSearch: '%30924195886%' },
      );

      expect(queryBuilder.take).toHaveBeenCalledWith(25);
      expect(queryBuilder.skip).toHaveBeenCalledWith(25);
      expect(queryBuilder.getManyAndCount).toHaveBeenCalled();
    });

    it('updates account type and birth date while returning the refreshed user', async () => {
      const existingUser = {
        id: 'user-1',
        accountType: 'fisica_capaz',
        birthDate: '2000-01-01',
      } as User;
      const updatedUser = {
        ...existingUser,
        accountType: 'fisica_emancipada',
        birthDate: '2001-02-02',
      } as User;
      usersRepository.findOne
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(updatedUser);

      await expect(
        service.update(
          'user-1',
          {
            accountType: 'fisica_emancipada',
            birthDate: '2001-02-02',
            sensitiveChangeJustification:
              'Correção cadastral conforme documento apresentado',
          } as any,
          {
            hasPermission: jest.fn().mockReturnValue(true),
          } as any,
        ),
      ).resolves.toEqual(updatedUser);
      expect(usersRepository.update).toHaveBeenCalledWith(
        { id: 'user-1' },
        expect.objectContaining({
          id: 'user-1',
          accountType: 'fisica_emancipada',
          birthDate: '2001-02-02',
          metadata: expect.objectContaining({
            sensitiveChanges: [
              expect.objectContaining({
                fields: ['accountType', 'birthDate'],
                justification:
                  'Correção cadastral conforme documento apresentado',
                attachments: [],
              }),
            ],
          }),
        }),
      );
    });

    it('allows administrators to update user email', async () => {
      const existing = {
        id: 'user-1',
        email: 'old@example.test',
        accountType: 'fisica_capaz',
      } as User;
      const refreshed = {
        ...existing,
        email: 'new@example.test',
      } as User;

      usersRepository.findOne
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(refreshed);

      const accessControl = {
        hasPermission: jest.fn().mockReturnValue(true),
      } as any;

      await service.update(
        'user-1',
        {
          accountType: 'fisica_capaz',
          email: 'new@example.test',
        } as any,
        accessControl,
      );

      expect(usersRepository.update).toHaveBeenCalledWith(
        { id: 'user-1' },
        expect.objectContaining({
          email: 'new@example.test',
        }),
      );
    });

    it('rejects email update when actor is not administrator', async () => {
      const existing = {
        id: 'user-1',
        email: 'old@example.test',
        accountType: 'fisica_capaz',
      } as User;

      usersRepository.findOne.mockResolvedValueOnce(existing);

      const accessControl = {
        hasPermission: jest.fn().mockReturnValue(false),
      } as any;

      await expect(
        service.update(
          'user-1',
          {
            accountType: 'fisica_capaz',
            email: 'new@example.test',
          } as any,
          accessControl,
        ),
      ).rejects.toThrow(
        'Apenas administradores podem alterar o e-mail de usuários',
      );
    });
  });

  describe('softDelete', () => {
    const existingUser = {
      id: 'user-1',
      email: 'ana@example.test',
      cpf: '52998224725',
      password: 'hashed-password',
      emailHashConfirm: 'confirmation-token',
      otpSecret: 'otp-secret',
      requires2fa: true,
      otpValidated: true,
    } as User;

    it('does not delete an unknown user', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(service.softDelete('missing-user')).rejects.toThrow(
        'User is not found',
      );
      expect(
        representationService.inactivateForUserDeletion,
      ).not.toHaveBeenCalled();
      expect(usersRepository.softDelete).not.toHaveBeenCalled();
    });

    it('inactivates representations and invalidates every login identifier before deleting', async () => {
      usersRepository.findOne.mockResolvedValue(existingUser);

      await service.softDelete(existingUser.id);

      expect(
        representationService.inactivateForUserDeletion,
      ).toHaveBeenCalledWith(existingUser);
      expect(usersRepository.update).toHaveBeenCalledWith(existingUser.id, {
        email: 'deleted+user-1@invalid.urbis',
        cpf: null,
        password: null,
        emailHashConfirm: null,
        otpSecret: null,
        requires2fa: false,
        otpValidated: false,
      });
      expect(usersRepository.softDelete).toHaveBeenCalledWith(existingUser.id);
    });

    it('allows a new account with the old CPF and email without restoring prior representations', async () => {
      usersRepository.findOne.mockResolvedValue(existingUser);
      usersRepository.save.mockResolvedValue({
        id: 'user-2',
        email: existingUser.email,
        cpf: existingUser.cpf,
      });

      await service.softDelete(existingUser.id);
      const recreated = await service.create({
        email: existingUser.email,
        cpf: existingUser.cpf,
      } as User);

      expect(recreated).toEqual(expect.objectContaining({ id: 'user-2' }));
      expect(
        representationService.inactivateForUserDeletion,
      ).toHaveBeenCalledTimes(1);
      expect(representationService).not.toHaveProperty('restoreForUser');
      expect(usersRepository.create).toHaveBeenLastCalledWith({
        email: existingUser.email,
        cpf: existingUser.cpf,
      });
    });
  });
});
