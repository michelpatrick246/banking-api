import {
    BadRequestException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { OtpType } from '@prisma/client';
import * as crypto from 'crypto';
import { DatabaseService } from 'src/database/database.service';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class OtpService {
  constructor(
    private db: DatabaseService,
    private emailService: EmailService,
  ) {}

  /**
   * Génère et envoie un code OTP
   */
  async generateAndSendOtp(userId: number, type: OtpType): Promise<void> {
    // Récupérer l'utilisateur
    const user = await this.db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Invalider les anciens codes non utilisés
    await this.db.otpCode.updateMany({
      where: {
        userId,
        type,
        usedAt: null,
      },
      data: {
        usedAt: new Date(), // Marquer comme "utilisé" pour les invalider
      },
    });

    // Générer un code à 6 chiffres
    const code = this.generateCode();

    // Expiration dans 5 minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    // Sauvegarder dans la DB
    await this.db.otpCode.create({
      data: {
        userId,
        code,
        type,
        expiresAt,
      },
    });

    // Envoyer par email
    await this.emailService.sendOtpEmail(user.email, code, type);
  }

  /**
   * Génère un code à 6 chiffres
   */
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async verifyOtp(
    userId: number,
    code: string,
    type: OtpType,
  ): Promise<boolean> {
    const otpRecord = await this.db.otpCode.findFirst({
      where: {
        userId,
        code,
        type,
        usedAt: null,
        expiresAt: { gte: new Date() },
      },
    });

    if (!otpRecord) {
      throw new UnauthorizedException('Invalid or expired verification code');
    }

    // Marquer comme utilisé
    await this.db.otpCode.update({
      where: { id: otpRecord.id },
      data: { usedAt: new Date() },
    });

    return true;
  }

  /**
   * Génère un code de backup (format: XXXX-XXXX)
   */
  private generateBackupCode(): string {
    const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `${part1}-${part2}`;
  }

  /**
   * Génère des codes de récupération
   */
  async generateBackupCodes(userId: number): Promise<string[]> {
    const codes: string[] = [];

    for (let i = 0; i < 10; i++) {
      codes.push(this.generateBackupCode());
    }

    await this.db.user.update({
      where: { id: userId },
      data: { backupCodes: codes },
    });

    return codes;
  }

  /**
   * Active le 2FA pour un utilisateur
   */
  async enable2FA(userId: number): Promise<{ backupCodes: string[] }> {
    const backupCodes = await this.generateBackupCodes(userId);

    await this.db.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    return { backupCodes };
  }

  /**
   * Désactive le 2FA
   */
  async disable2FA(userId: number): Promise<void> {
    await this.db.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        backupCodes: [],
      },
    });

    // Supprimer tous les codes OTP
    await this.db.otpCode.deleteMany({
      where: { userId },
    });
  }
}
