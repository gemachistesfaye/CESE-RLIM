import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EquipmentService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.equipment.findMany({
      include: { laboratory: { select: { name: true, code: true } } },
    });
  }

  async findById(id: string) {
    return this.prisma.equipment.findUnique({
      where: { id },
      include: { laboratory: true },
    });
  }

  async findByLaboratory(laboratoryId: string) {
    return this.prisma.equipment.findMany({
      where: { laboratoryId },
      include: { laboratory: { select: { name: true, code: true } } },
    });
  }
}
