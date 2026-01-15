import { PrismaClient, User } from '@prisma/client';
import { NotFoundError } from '../errors';

export class UserRepository {
  constructor(private prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async create(email: string, hashedPassword: string): Promise<User> {
    return this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });
  }

  async getByIdOrThrow(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }
}
