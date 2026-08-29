import { Test, TestingModule } from '@nestjs/testing';
import { ResearchersService } from './researchers.service';
import { AuditService } from '../audit/audit.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('ResearchersService', () => {
  let service: ResearchersService;
  let prisma: any;
  let audit: any;

  beforeEach(async () => {
    prisma = {
      researcher: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    audit = { log: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResearchersService,
        { provide: require('../prisma/prisma.service').PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<ResearchersService>(ResearchersService);
  });

  describe('findAll', () => {
    it('should return paginated researchers', async () => {
      prisma.researcher.findMany.mockResolvedValue([]);
      prisma.researcher.count.mockResolvedValue(0);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.pagination.total).toBe(0);
      expect(result.items).toHaveLength(0);
    });

    it('should apply search filter', async () => {
      prisma.researcher.findMany.mockResolvedValue([]);
      prisma.researcher.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 10, search: 'power' });

      expect(prisma.researcher.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { employeeOrStudentId: { contains: 'power', mode: 'insensitive' } },
            ]),
          }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return a researcher', async () => {
      prisma.researcher.findUnique.mockResolvedValue({ id: '1', user: { firstName: 'Test' } });

      const result = await service.findById('1');
      expect(result.id).toBe('1');
    });

    it('should throw NotFoundException', async () => {
      prisma.researcher.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByUserId', () => {
    it('should find researcher by user ID', async () => {
      prisma.researcher.findUnique.mockResolvedValue({ id: 'r1', userId: 'u1' });

      const result = await service.findByUserId('u1');
      expect(result.userId).toBe('u1');
    });

    it('should throw NotFoundException if not found', async () => {
      prisma.researcher.findUnique.mockResolvedValue(null);

      await expect(service.findByUserId('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create researcher + user in transaction', async () => {
      prisma.user.findUnique.mockResolvedValue(null); // no dup email
      prisma.researcher.findUnique.mockResolvedValue(null); // no dup emp ID

      const mockResearcher = { id: 'r1', userId: 'u1', user: { firstName: 'Test' } };
      prisma.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          user: { create: jest.fn().mockResolvedValue({ id: 'u1' }) },
          researcher: { create: jest.fn().mockResolvedValue(mockResearcher) },
        };
        return fn(tx);
      });

      const result = await service.create(
        {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@test.com',
          password: 'password123',
          employeeOrStudentId: 'EMP-001',
          department: 'Engineering',
        },
        'operator-id',
      );

      expect(result.id).toBe('r1');
      expect(audit.log).toHaveBeenCalled();
    });

    it('should reject duplicate email', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create(
          {
            firstName: 'Test',
            lastName: 'User',
            email: 'dup@test.com',
            password: 'password123',
            employeeOrStudentId: 'EMP-001',
            department: 'Engineering',
          },
          'operator-id',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject duplicate employee ID', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.researcher.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create(
          {
            firstName: 'Test',
            lastName: 'User',
            email: 'new@test.com',
            password: 'password123',
            employeeOrStudentId: 'DUP-001',
            department: 'Engineering',
          },
          'operator-id',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update researcher fields', async () => {
      prisma.researcher.findUnique
        .mockResolvedValueOnce({ id: 'r1', user: { firstName: 'Test', lastName: 'User' } }) // findById
        .mockResolvedValueOnce(null); // employee ID uniqueness check

      prisma.researcher.update.mockResolvedValue({
        id: 'r1',
        department: 'New Dept',
        user: { firstName: 'Test', lastName: 'User' },
      });

      const result = await service.update('r1', { department: 'New Dept' }, 'operator-id');
      expect(result.department).toBe('New Dept');
    });
  });
});
