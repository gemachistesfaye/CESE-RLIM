import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ResearchersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.researcher.findMany({
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    });
  }

  async findById(id: string) {
    return this.prisma.researcher.findUnique({
      where: { id },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    });
  }
}
