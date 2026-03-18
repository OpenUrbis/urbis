import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
class IsCpfConstraint implements ValidatorConstraintInterface {
  validate(value: unknown) {
    return isValidCpfValue(value);
  }
}

export function isValidCpfValue(value: unknown): boolean {
  if (!value) return false;
  if (typeof value !== 'string') return false;
  const cpf = value.replace(/\D/g, '');
  if (cpf.length !== 11 || /^([0-9])\1{10}$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let firstCheck = (sum * 10) % 11;
  if (firstCheck === 10) firstCheck = 0;
  if (firstCheck !== parseInt(cpf.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  let secondCheck = (sum * 10) % 11;
  if (secondCheck === 10) secondCheck = 0;
  return secondCheck === parseInt(cpf.charAt(10));
}

export function IsCPF(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: IsCpfConstraint,
    });
  };
}
