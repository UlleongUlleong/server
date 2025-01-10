import { Injectable } from '@nestjs/common';
import { Transporter } from 'nodemailer';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: parseInt(process.env.MAIL_PORT),
      secure: true,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async sendVerificationCode(to: string, code: string) {
    const options: nodemailer.SendMailOptions = {
      from: `"술렁술렁" <${process.env.MAIL_FROM}>`,
      to,
      subject: '[술렁술렁] 인증코드 안내',
      html: code,
    };

    await this.transporter.sendMail(options);
  }
}
