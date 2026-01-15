import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../services/auth.service';

export class AuthController {
  private authService: AuthService;

  constructor(prisma: PrismaClient) {
    this.authService = new AuthService(prisma);
  }

  async register(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;
    const result = await this.authService.register(email, password);

    res.status(201).json(result);
  }

  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;
    const result = await this.authService.login(email, password);

    res.json(result);
  }

  async me(req: Request, res: Response): Promise<void> {
    const userId = req.context?.userId;
    const userEmail = req.context?.userEmail;
    if (!userId || !userEmail) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      return;
    }

    res.json({
      userId,
      email: userEmail,
    });
  }
}
