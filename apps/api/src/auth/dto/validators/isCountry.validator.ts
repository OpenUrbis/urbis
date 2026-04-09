import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { countryList } from './utils';

const VALID_COUNTRY_CODES = new Set(countryList.map((country) => country.code));

export function IsCountryCode(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isCountryCode',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          return typeof value === 'string' && VALID_COUNTRY_CODES.has(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid ISO2 country code`;
        },
      },
    });
  };
}
