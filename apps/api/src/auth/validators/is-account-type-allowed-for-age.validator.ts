import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

const ACCOUNT_TYPES_BY_AGE = {
  adult: ['fisica_capaz'],
  adolescent: [
    'fisica_emancipada',
    'fisica_assistido_parental',
    'fisica_assistido_tutor',
  ],
  underSixteen: [],
};

function getAge(birthDate: string): number {
  const [year, month, day] = birthDate.split('-').map(Number);
  const today = new Date();
  let age = today.getFullYear() - year;
  const birthdayHasNotOccurred =
    today.getMonth() + 1 < month ||
    (today.getMonth() + 1 === month && today.getDate() < day);

  if (birthdayHasNotOccurred) age -= 1;
  return age;
}

@ValidatorConstraint({ async: false })
class IsAccountTypeAllowedForAgeConstraint implements ValidatorConstraintInterface {
  validate(accountType: unknown, args: ValidationArguments) {
    const birthDate = (args.object as { birthDate?: unknown }).birthDate;
    if (typeof accountType !== 'string' || typeof birthDate !== 'string') {
      return false;
    }

    const age = getAge(birthDate);
    const allowedTypes =
      age >= 18
        ? ACCOUNT_TYPES_BY_AGE.adult
        : age >= 16
          ? ACCOUNT_TYPES_BY_AGE.adolescent
          : ACCOUNT_TYPES_BY_AGE.underSixteen;

    return allowedTypes.includes(accountType);
  }

  defaultMessage() {
    return 'invalidForBirthDate';
  }
}

export function IsAccountTypeAllowedForAge(
  validationOptions?: ValidationOptions,
) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: IsAccountTypeAllowedForAgeConstraint,
    });
  };
}
