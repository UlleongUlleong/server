import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Transporter } from 'nodemailer';
import * as nodemailer from 'nodemailer';
import { emailCodeTemplate } from './mail.template';
import { emailPasswordTemplate } from './mail-password.template';
import {
  generateRandomCode,
  generateRandomPassword,
} from 'src/common/utils/random-generator.util';
import Redis from 'ioredis';

@Injectable()
export class MailService {
  private transporter: Transporter;
  @Inject('REDIS_CLIENT') private redis: Redis;

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

  async sendCode(email: string) {
    const code = generateRandomCode(6, 10);
    await this.saveCode(email, code);

    const options: nodemailer.SendMailOptions = {
      from: `"술렁술렁" <${process.env.MAIL_FROM}>`,
      to: email,
      subject: '[술렁술렁] 인증코드 안내',
      html: emailCodeTemplate(code),
    };

    await this.transporter.sendMail(options);
  }

  async saveCode(email: string, code: string): Promise<void> {
    const userKey = `verify:code:users:${email}`;
    await this.redis.set(userKey, code, 'EX', 600);

    const attemptKey = `verify:attempt:users:${email}`;
    const attemptCount = await this.redis.get(attemptKey);
    if (!attemptCount) {
      await this.redis.set(attemptKey, '0', 'EX', 86400);
    }
  }

  async verifyCode(email: string, code: string): Promise<void> {
    const generatedCode = await this.checkCodeExpiration(email);
    await this.checkAttemptCount(email);

    if (code !== generatedCode) {
      throw new BadRequestException('인증 코드가 일치하지 않습니다.');
    }

    const userKey = `verify:code:users:${email}`;
    const attemptKey = `verify:attempt:users:${email}`;
    await this.redis.del([userKey, attemptKey]);
    await this.allowAccess(email);
  }

  async checkCodeExpiration(email: string): Promise<string> {
    const key = `verify:code:users:${email}`;
    const code = await this.redis.get(key);

    if (!code) {
      throw new NotFoundException('인증 코드가 만료됐습니다.');
    }

    return code;
  }

  async checkAttemptCount(email: string): Promise<number> {
    const key = `verify:attempt:users:${email}`;
    const attemptCount = await this.redis.get(key);

    if (Number(attemptCount) >= 10) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: '인증코드 시도 횟수가 너무 많습니다.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return await this.redis.incr(key);
  }

  async allowAccess(email: string) {
    const key = `verify:complete:users:${email}`;
    await this.redis.set(key, 1, 'EX', 3600);
  }

  async sendPassword(email: string): Promise<string> {
    const temporaryPassword = generateRandomPassword();

    const options: nodemailer.SendMailOptions = {
      from: `"술렁술렁" <${process.env.MAIL_FROM}>`,
      to: email,
      subject: '[술렁술렁] 임시 비밀번호 안내',
      html: emailPasswordTemplate(temporaryPassword),
    };

    await this.transporter.sendMail(options);
    return temporaryPassword;
  }
}
