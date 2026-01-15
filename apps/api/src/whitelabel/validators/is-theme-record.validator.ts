import { registerDecorator, ValidationOptions } from 'class-validator';
import { ApplicationTheme } from '../enums/application-theme.enum';

export function IsThemeRecord(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isThemeRecord',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'object') return false;

          const enumValues = Object.values(ApplicationTheme);

          const keys = Object.keys(value as object);
          if (keys.length !== enumValues.length) return false;
          if (!keys.every((k) => enumValues.includes(k as ApplicationTheme)))
            return false;

          return keys.every((k) => typeof value[k] === 'string');
        },
      },
    });
  };
}
