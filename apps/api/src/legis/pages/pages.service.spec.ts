import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SYSTEM_ROLES } from 'common/constants/system-roles.const';
import { LegisUsersService } from '../shared/legis-users.service';
import { LegisPage } from './entities';
import { PagesService } from './pages.service';

const buildPage = (overrides: Partial<LegisPage> = {}): LegisPage =>
  ({
    id: 'page-1',
    title: 'Plano Diretor',
    slug: 'plano-diretor',
    type: 'original_normativo',
    author: 'Desconhecido',
    authorId: null,
    tags: [],
    isPublic: true,
    content: '{}',
    createdBy: null,
    updatedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as LegisPage;

const MARIA = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Maria Silva',
  firstName: 'Maria',
  lastName: 'Silva',
  socialName: null,
  email: 'maria@sp.gov.br',
  avatarUrl: null,
  initials: 'MS',
  isActive: true,
};

const JOAO = {
  ...MARIA,
  id: '22222222-2222-4222-8222-222222222222',
  name: 'João Souza',
  firstName: 'João',
  lastName: 'Souza',
  email: 'joao@sp.gov.br',
  initials: 'JS',
};

describe('PagesService author hydration', () => {
  let service: PagesService;
  let resolveMany: jest.Mock;

  beforeEach(async () => {
    const known = new Map([
      [MARIA.id, MARIA],
      [JOAO.id, JOAO],
    ]);

    resolveMany = jest.fn((ids: ReadonlyArray<string | null | undefined>) =>
      Promise.resolve(
        new Map(
          ids
            .filter((id): id is string => Boolean(id) && known.has(id))
            .map((id) => [id, known.get(id)] as const),
        ),
      ),
    );

    const resolveOne = jest.fn(() => Promise.resolve(null));

    const moduleRef = await Test.createTestingModule({
      providers: [
        PagesService,
        { provide: getRepositoryToken(LegisPage), useValue: {} },
        { provide: LegisUsersService, useValue: { resolveMany, resolveOne } },
      ],
    }).compile();

    service = moduleRef.get(PagesService);
  });

  it('attaches the author and the audit users', async () => {
    const [page] = await service.withAuthorsMany([
      buildPage({
        authorId: MARIA.id,
        createdBy: MARIA.id,
        updatedBy: JOAO.id,
      }),
    ]);

    expect(page.authorUser).toEqual(MARIA);
    expect(page.createdByUser).toEqual(MARIA);
    expect(page.updatedByUser).toEqual(JOAO);
  });

  /* The stored label goes stale whenever the person renames their account. */
  it('overrides the stored label with the resolved user name', async () => {
    const [page] = await service.withAuthorsMany([
      buildPage({ authorId: MARIA.id, author: 'Nome antigo' }),
    ]);

    expect(page.author).toBe('Maria Silva');
  });

  it('keeps the free-text label when there is no linked user', async () => {
    const [page] = await service.withAuthorsMany([
      buildPage({ author: 'Equipe Legis' }),
    ]);

    expect(page.author).toBe('Equipe Legis');
    expect(page.authorUser).toBeNull();
    expect(page.createdByUser).toBeNull();
    expect(page.updatedByUser).toBeNull();
  });

  it('resolves an unknown user id as null instead of failing', async () => {
    const [page] = await service.withAuthorsMany([
      buildPage({
        authorId: '33333333-3333-4333-8333-333333333333',
        author: 'Equipe Legis',
      }),
    ]);

    expect(page.authorUser).toBeNull();
    expect(page.author).toBe('Equipe Legis');
  });

  /* A list of pages must not turn into one user query per row. */
  it('resolves every page with a single user lookup', async () => {
    await service.withAuthorsMany([
      buildPage({ id: 'page-1', authorId: MARIA.id, updatedBy: JOAO.id }),
      buildPage({ id: 'page-2', authorId: JOAO.id, createdBy: MARIA.id }),
    ]);

    expect(resolveMany).toHaveBeenCalledTimes(1);
  });

  it('returns an empty list without touching the user lookup', async () => {
    expect(await service.withAuthorsMany([])).toEqual([]);
    expect(resolveMany).not.toHaveBeenCalled();
  });

  const ADMIN_ACTOR = {
    id: 'admin-user-id',
    userRoleAssignments: [{ roleId: SYSTEM_ROLES.admin }],
  };

  const REGULAR_ACTOR = {
    id: 'regular-user-id',
    userRoleAssignments: [],
  };

  it('queries repository by both id and slug when finding one page', async () => {
    const findOneRepo = jest
      .fn()
      .mockResolvedValue(
        buildPage({ id: 'p-1', slug: 'p-slug', isPublic: true }),
      );
    (service as any).pagesRepository = { findOne: findOneRepo };

    const page = await service.findOne('p-slug');
    expect(findOneRepo).toHaveBeenCalledWith({
      where: [{ id: 'p-slug' }, { slug: 'p-slug' }],
      withDeleted: false,
    });
    expect(page.id).toBe('p-1');
  });

  it('throws ForbiddenException when anonymous or non-admin user accesses a private page', async () => {
    const findOneRepo = jest
      .fn()
      .mockResolvedValue(
        buildPage({ id: 'p-private', slug: 'p-private', isPublic: false }),
      );
    (service as any).pagesRepository = { findOne: findOneRepo };

    await expect(service.findOne('p-private')).rejects.toThrow(
      ForbiddenException,
    );

    await expect(
      service.findOne('p-private', false, REGULAR_ACTOR),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows admin users to view private pages', async () => {
    const findOneRepo = jest
      .fn()
      .mockResolvedValue(
        buildPage({ id: 'p-private', slug: 'p-private', isPublic: false }),
      );
    (service as any).pagesRepository = { findOne: findOneRepo };

    const page = await service.findOne('p-private', false, ADMIN_ACTOR);
    expect(page.id).toBe('p-private');
  });

  it('filters by isPublic=true in findAll for non-admin actors', async () => {
    const mockQueryBuilder = {
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getManyAndCount: jest
        .fn()
        .mockResolvedValue([[buildPage({ id: 'p-1', isPublic: true })], 1]),
    };

    (service as any).pagesRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const result = await service.findAll({}, REGULAR_ACTOR);

    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
      'page.isPublic = :isPublic',
      { isPublic: true },
    );
    expect(result.items).toHaveLength(1);
  });

  it('filters by isPublic=true in findByIds for non-admin actors', async () => {
    const findRepo = jest
      .fn()
      .mockResolvedValue([buildPage({ id: 'p-1', isPublic: true })]);
    (service as any).pagesRepository = { find: findRepo };

    await service.findByIds(['p-1'], REGULAR_ACTOR);

    expect(findRepo).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isPublic: true }),
      }),
    );
  });

  describe('slug uniqueness', () => {
    it('appends a counter suffix when a slug already exists', async () => {
      const mockQueryBuilder = {
        withDeleted: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest
          .fn()
          .mockResolvedValueOnce(
            buildPage({ id: 'existing-1', slug: 'plano-diretor' }),
          )
          .mockResolvedValueOnce(null),
      };

      const mockRepo = {
        create: jest.fn((dto) => dto),
        save: jest.fn((dto) => Promise.resolve(buildPage(dto))),
        createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      };

      (service as any).pagesRepository = mockRepo;

      const created = await service.create({
        title: 'Plano Diretor',
        content: 'Conteúdo',
      });

      expect(created.slug).toBe('plano-diretor-1');
    });
  });
});
