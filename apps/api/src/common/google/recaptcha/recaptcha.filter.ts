import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { GoogleRecaptchaException } from '@nestlab/google-recaptcha';
import { Request, Response } from 'express';
import { googleRecaptchaErrorCodeDictionary } from './recaptcha.utils';

@Catch(GoogleRecaptchaException)
export class GoogleRecaptchaFilter implements ExceptionFilter {
  catch(exception: GoogleRecaptchaException, host: ArgumentsHost): any {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    // const request = ctx.getResponse<Request>();
    const status = exception.getStatus();
    const errorCodes = exception.errorCodes || [];
    const errorCode = errorCodes[0] || 'unknown-error';
    const message =
      googleRecaptchaErrorCodeDictionary[errorCode] ||
      'recaptcha.verification.failed';
    response.status(status).json({
      statusCode: status,
      message,
      errorCode,
    });
  }
}
