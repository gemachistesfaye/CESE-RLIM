import { Test, TestingModule } from '@nestjs/testing';
import { LaboratoriesService } from './laboratories.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('LaboratoriesService', () => {
  let service: LaboratoriesService;
  let prisma: any;
  let auditService: any;

  beforeEach(async () => {
    prisma = {
      laboratory: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
    };

    auditService = { log: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LaboratoriesService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<LaboratoriesService>(LaboratoriesService);
  });

  describe('findAll', () => {
    it('should return paginated laboratories', async () => {
      const labs = [{ id: '1', name: 'Lab A', code: 'L001', status: 'ACTIVE', _count: { equipment: 5 } }];
      prisma.laboratory.findMany.mockResolvedValue(labs);
      prisma.laboratory.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.items).toEqual(labs);
      expect(result.pagination).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 });
    });

    it('should search laboratories', async () => {
      prisma.laboratory.findMany.mockResolvedValue([]);
      prisma.laboratory.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 10, search: 'power' });

      expect(prisma.laboratory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { name: { contains: 'power', mode: 'insensitive' } },
            ]),
          }),
        }),
      );
    });

    it('should filter by status', async () => {
      prisma.laboratory.findMany.mockResolvedValue([]);
      prisma.laboratory.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 10, status: 'ACTIVE' });

      expect(prisma.laboratory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'ACTIVE' }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return a laboratory by ID', async () => {
      const lab = { id: '1', name: 'Lab A', code: 'L001', equipment: [] };
      prisma.laboratory.findUnique.mockResolvedValue(lab);

      const result = await service.findById('1');
      expect(result).toEqual(lab);
    });

    it('should throw NotFoundException for invalid ID', async () => {
      prisma.laboratory.findUnique.mockResolvedValue(null);
      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a laboratory', async () => {
      prisma.laboratory.findUnique.mockResolvedValue(null); // no existing code
      prisma.laboratory.create.mockResolvedValue({
        id: '1',
        name: 'New Lab',
        code: 'NL001',
        location: 'Building A',
        status: 'ACTIVE',
        _count: { equipment: 0 },
      });

      const result = await service.create(
        { name: 'New Lab', code: 'NL001', location: 'Building A' },
        'operator-id',
      );

      expect(result.name).toBe('New Lab');
      expect(auditService.log).toHaveBeenCalled();
    });

    it('should throw ConflictException for duplicate code', async () => {
      prisma.laboratory.findUnique.mockResolvedValue({ id: 'existing', code: 'NL001' });

      await expect(
        service.create(
          { name: 'New Lab', code: 'NL001', location: 'Building A' },
          'operator-id',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update laboratory fields', async () => {
      prisma.laboratory.findUnique
        .mockResolvedValueOnce({ id: '1', name: 'Old Name' }) // findById
        .mockResolvedValueOnce(null); // name uniqueness check

      prisma.laboratory.update.mockResolvedValue({
        id: '1',
        name: 'New Name',
        code: 'L001',
        status: 'ACTIVE',
        _count: { equipment: 0 },
      });

      const result = await service.update('1', { name: 'New Name' }, 'operator-id');
      expect(result.name).toBe('New Name');
    });

    it('should throw NotFoundException if lab does not exist', async () => {
      prisma.laboratory.findUnique.mockResolvedValue(null);
      await expect(
        service.update('nonexistent', { name: 'Test' }, 'operator-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update laboratory status', async () => {
      prisma.laboratory.findUnique.mockResolvedValue({
        id: '1',
        name: 'Lab A',
        status: 'ACTIVE',
      });
      prisma.laboratory.update.mockResolvedValue({
        id: '1',
        name: 'Lab A',
        status: 'INACTIVE',
        _count: { equipment: 0 },
      });

      const result = await service.updateStatus('1', { status: 'INACTIVE' }, 'operator-id');
      expect(result.status).toBe('INACTIVE');
    });

    it('should return lab unchanged if status is the same', async () => {
      prisma.laboratory.findUnique.mockResolvedValue({
        id: '1',
        name: 'Lab A',
        status: 'ACTIVE',
      });

      const result = await service.updateStatus('1', { status: 'ACTIVE' }, 'operator-id');
      expect(result.status).toBe('ACTIVE');
      expect(prisma.laboratory.update).not.toHaveBeenCalled();
    });
  });
});
