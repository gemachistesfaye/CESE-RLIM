import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LaboratoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.laboratory.findMany({
      include: { _count: { select: { equipment: true } } },
    });
  }

  async findById(id: string) {
    return this.prisma.laboratory.findUnique({
      where: { id },
      include: { equipment: true },
    });
  }
}
