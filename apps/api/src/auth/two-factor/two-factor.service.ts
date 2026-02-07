import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from 'common/mail/mail.service';
import { RedisService } from 'common/redis/redis.service';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';
import * as speakeasy from 'speakeasy';

import { User } from 'user/entities/user.entity';
import { UserService } from 'user/user.service';

const TEST_CODE = '869562';

const PREFIX_REDIS_EMAIL_OTP = 'USER_EMAIL_OTP';
const algorithm = 'aes-256-ctr';
const iv = crypto.randomBytes(16);

@Injectable()
export class TwoFactorService {
  constructor(
    private userService: UserService,
    private mailService: MailService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  async checkEmailOtp(userId: string, code: string) {
    if (
      code === TEST_CODE &&
      this.configService.get('app.nodeEnv') !== 'production'
    )
      return true;
    const sendedCode = await this.redisService.get(
      `${PREFIX_REDIS_EMAIL_OTP}_${userId}`,
    );

    if (sendedCode !== code)
      throw new BadRequestException({
        message: 'Invalid code',
        isInvalid: true,
      });

    await this.userService.confirmEmail(userId);

    return true;
  }

  private decrypt(encrypted: string) {
    const encryptionKey: string = this.configService.get(
      'auth.twoFactorSecret',
    );
    const parts = encrypted.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const decipher = crypto.createDecipheriv(
      algorithm,
      Buffer.from(encryptionKey, 'hex'),
      iv,
    );
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  private encrypt(secret: string) {
    const encryptionKey: string = this.configService.get(
      'auth.twoFactorSecret',
    );
    const cipher = crypto.createCipheriv(
      algorithm,
      Buffer.from(encryptionKey, 'hex'),
      iv,
    );
    let encrypted = cipher.update(secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const encryptedData = iv.toString('hex') + ':' + encrypted;
    return encryptedData;
  }

  async generate2FASecret(user: User, code: string) {
    if (user.otpSecret && user.otpValidated)
      throw new BadRequestException({
        message: 'This user already conclued process 2FA registration',
      });

    await this.checkEmailOtp(user.id, code);

    const { base32, otpauth_url } = speakeasy.generateSecret({
      name: `${this.configService.get('auth.twoFactorAppName')} - ${user.email}`,
    });
    const otpSecret = this.encrypt(base32);

    await this.userService.saveOtpSecret(user.id, otpSecret);
    const qrcode = await QRCode.toDataURL(otpauth_url);

    return {
      message: '2FA key generated successfully',
      base32,
      qrCode: qrcode,
    };
  }

  async verify2FACode(user: User, code: string) {
    if (!user.otpSecret)
      throw new BadRequestException({
        message: "This user doesn't have 2FA registration",
      });
    const secret = this.decrypt(user.otpSecret);

    const isValid =
      code === TEST_CODE &&
      this.configService.get('app.nodeEnv') !== 'production'
        ? true
        : speakeasy.totp.verify({
            secret,
            encoding: 'base32',
            token: code,
            window: 1,
          });

    if (isValid) await this.userService.otpSecretIsValidated(user.id);

    return { isValid };
  }

  async resendEmailOtp(user: User) {
    const code = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');

    await this.redisService.set(`${PREFIX_REDIS_EMAIL_OTP}_${user.id}`, code);

    console.log('>>>>>>>>>>>> ', this.configService.get('mail.sendGridApiKey'));
    try {
      await this.mailService.sendOtpCode(code, user.email);
    } catch (err) {
      console.error(err);
    }

    if (this.configService.get('app.nodeEnv') !== 'production') return { code };

    return { message: 'Ok' };
  }

  async desactive(user: User, code: string) {
    const { isValid } = await this.verify2FACode(user, code);
    if (!isValid)
      throw new BadRequestException({
        message: 'Invalid code',
        isInvalid: true,
      });

    return await this.userService.remove2FA(user.id);
  }
}
