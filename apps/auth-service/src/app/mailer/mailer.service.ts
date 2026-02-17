import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private transporter: nodemailer.Transporter | null = null;
  private readonly logger = new Logger(MailerService.name);

  constructor(private configService: ConfigService) {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<number>('SMTP_PORT');
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASSWORD');

    if (smtpHost && smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort || 587,
        secure: this.configService.get<string>('SMTP_SECURE') === 'true',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      this.logger.log('Mailer initialized with SMTP configuration');
    } else {
      this.logger.warn(
        'SMTP configuration missing. Emails will be logged to console (Development Mode)'
      );
    }
  }

  async sendResetPasswordEmail(to: string, token: string): Promise<void> {
    const resetLink = `${this.configService.get<string>(
      'FRONTEND_URL'
    )}/reset-password?token=${token}`;

    const subject = 'Réinitialisation de votre mot de passe - SaaS Hub';
    const html = `
      <h1>Réinitialisation de mot de passe</h1>
      <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
      <p>Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
      <a href="${resetLink}">Réinitialiser mon mot de passe</a>
      <p>Ce lien est valide pendant 1 heure.</p>
      <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from:
            this.configService.get<string>('SMTP_FROM') ||
            'noreply@saas-hub.com',
          to,
          subject,
          html,
        });
        this.logger.log(`Reset password email sent to ${to}`);
      } catch (error) {
        this.logger.error(`Failed to send email to ${to}`, error);
        throw error;
      }
    } else {
      // Mock mode
      this.logger.log('==================================================');
      this.logger.log(`[MOCK EMAIL] To: ${to}`);
      this.logger.log(`[MOCK EMAIL] Subject: ${subject}`);
      this.logger.log(`[MOCK EMAIL] Link: ${resetLink}`);
      this.logger.log('==================================================');
    }
  }
}
