import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { ConflictError, UnauthorizedError, ValidationError } from '../errors';
import { config } from '../config';
import { JwtPayload } from '../types';
import { UserRepository } from '../repositories/user.repository';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export class AuthService {
  private userRepo: UserRepository;

  constructor(prisma: PrismaClient) {
    this.userRepo = new UserRepository(prisma);
  }

  async register(email: string, password: string): Promise<{ user: { id: string; email: string }; token: string }> {
    const validated = registerSchema.parse({ email, password });

    const existing = await this.userRepo.findByEmail(validated.email);
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(validated.password, 10);
    const user = await this.userRepo.create(validated.email, hashedPassword);

    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
      },
      token,
    };
  }

  async login(email: string, password: string): Promise<{ user: { id: string; email: string }; token: string }> {
    const validated = loginSchema.parse({ email, password });

    const user = await this.userRepo.findByEmail(validated.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValid = await bcrypt.compare(validated.password, user.password);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
      },
      token,
    };
  }

  private generateToken(payload: JwtPayload): string {
    const secret = config.jwt.secret;
    if (!secret) {
      throw new Error('JWT_SECRET is required');
    }
    return jwt.sign(payload, secret, {
      expiresIn: config.jwt.expiresIn,
    } as jwt.SignOptions);
  }
}
