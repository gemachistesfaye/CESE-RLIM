import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuditService } from '../audit/audit.service';
import { UserRole } from '@prisma/client';
import { ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: any;
  let audit: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    audit = { log: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: require('../prisma/prisma.service').PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      prisma.user.findMany.mockResolvedValue([{ id: '1', email: 'test@test.com' }]);
      prisma.user.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.pagination.total).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
      expect(result.items).toHaveLength(1);
    });

    it('should apply search filter', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 10, search: 'test' });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { firstName: { contains: 'test', mode: 'insensitive' } },
            ]),
          }),
        }),
      );
    });

    it('should apply role filter', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 10, role: 'ADMIN' });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ role: 'ADMIN' }),
        }),
      );
    });
  });

  describe('create', () => {
    it('should create a user with hashed password', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: '1',
        email: 'new@test.com',
        firstName: 'Test',
        lastName: 'User',
      });

      const result = await service.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'new@test.com',
        role: UserRole.RESEARCHER,
        password: 'password123',
      });

      expect(prisma.user.create).toHaveBeenCalled();
      const callData = prisma.user.create.mock.calls[0][0].data;
      expect(callData.passwordHash).not.toBe('password123');
      expect(callData.passwordHash).toMatch(/^\$2/); // bcrypt hash
      expect(result.email).toBe('new@test.com');
      expect(audit.log).toHaveBeenCalled();
    });

    it('should reject duplicate email', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing', email: 'dup@test.com' });

      await expect(
        service.create({
          firstName: 'Test',
          lastName: 'User',
          email: 'dup@test.com',
          role: UserRole.RESEARCHER,
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should normalize email to lowercase and trim', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: '1' });

      await service.create({
        firstName: 'Test',
        lastName: 'User',
        email: '  TEST@Test.COM  ',
        role: UserRole.RESEARCHER,
        password: 'password123',
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@test.com' },
      });
    });
  });

  describe('findById', () => {
    it('should return a user', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: '1', email: 'test@test.com' });

      const result = await service.findById('1');
      expect(result.id).toBe('1');
    });

    it('should throw NotFoundException for missing user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateRole', () => {
    it('should allow admin to change roles', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: '1', role: 'RESEARCHER' });
      prisma.user.count.mockResolvedValue(3);
      prisma.user.update.mockResolvedValue({ id: '1', role: 'COORDINATOR' });

      const result = await service.updateRole(
        '1',
        { role: UserRole.COORDINATOR },
        'admin-id',
        UserRole.ADMIN,
      );

      expect(result.role).toBe('COORDINATOR');
      expect(audit.log).toHaveBeenCalled();
    });

    it('should reject non-admin users', async () => {
      await expect(
        service.updateRole(
          '1',
          { role: UserRole.COORDINATOR },
          'researcher-id',
          UserRole.RESEARCHER,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should prevent demoting the last admin', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: '1', role: 'ADMIN' });
      prisma.user.count.mockResolvedValue(1); // only 1 active admin

      await expect(
        service.updateRole(
          '1',
          { role: UserRole.RESEARCHER },
          'admin-id',
          UserRole.ADMIN,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateStatus', () => {
    it('should allow deactivation', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: '1', isActive: true });
      prisma.user.update.mockResolvedValue({ id: '1', isActive: false });

      await service.updateStatus('1', { isActive: false }, 'admin-id');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isActive: false } }),
      );
    });

    it('should prevent self-deactivation', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'self', isActive: true });

      await expect(
        service.updateStatus('self', { isActive: false }, 'self'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
