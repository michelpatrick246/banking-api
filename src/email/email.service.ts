import {
  BodyContentType,
  Configuration,
  EmailsApi,
} from '@elasticemail/elasticemail-client-ts-axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private emailAPI: EmailsApi;

  constructor(private configService: ConfigService) {
    this.emailAPI = new EmailsApi(
      new Configuration({
        apiKey: this.configService.get('EMAIL_API_KEY'),
      }),
    );
  }

  /**
   * Envoie un email avec code OTP
   */
  async sendOtpEmail(to: string, code: string, type: string): Promise<void> {
    try {
      const emailMessageData = {
        Recipients: [
          {
            Email: to,
          },
        ],
        Content: {
          Subject: this.getSubject(type),
          Body: [
            {
              ContentType: BodyContentType.Html,
              Content: this.getOtpTemplate(code, type),
            },
          ],
          From: this.configService.get('EMAIL_FROM'),
        },
      };

      await this.emailAPI.emailsPost(emailMessageData);
      this.logger.log(`OTP email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP email: ${error.message}`);
      throw new Error('Failed to send verification code');
    }
  }

  /**
   * Template HTML pour l'email OTP
   */
  private getOtpTemplate(code: string, type: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
          .container { background-color: white; padding: 30px; border-radius: 10px; max-width: 500px; margin: 0 auto; }
          .code { font-size: 32px; font-weight: bold; color: #4CAF50; text-align: center; letter-spacing: 8px; padding: 20px; background-color: #f9f9f9; border-radius: 5px; margin: 20px 0; }
          .warning { color: #ff9800; font-size: 14px; margin-top: 20px; }
          h2 { color: #333; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>🔐 Code de Vérification</h2>
          <p>Votre code de vérification pour ${this.getActionText(type)} :</p>
          <div class="code">${code}</div>
          <p>Ce code est valide pendant <strong>5 minutes</strong>.</p>
          <p class="warning">⚠️ Ne partagez jamais ce code. Notre équipe ne vous demandera jamais ce code.</p>
        </div>
      </body>
      </html>
    `;
  }

  private getSubject(type: string): string {
    const subjects = {
      LOGIN: 'Code de connexion - Banking API',
      TRANSACTION: 'Code de vérification transaction',
      PASSWORD_RESET: 'Code de réinitialisation',
    };
    return subjects[type] || 'Code de vérification';
  }

  private getActionText(type: string): string {
    const actions = {
      LOGIN: 'vous connecter',
      TRANSACTION: 'valider la transaction',
      PASSWORD_RESET: 'réinitialiser votre mot de passe',
    };
    return actions[type] || 'cette action';
  }
}
