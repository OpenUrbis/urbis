import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'cpfCnpj',
  standalone: true,
})
export class CpfCnpjPipe implements PipeTransform {
  transform(value: string | number): string {
    if (!value) {
      return '';
    }

    const valueStr = value.toString().replace(/\D/g, '');

    if (valueStr.length === 11) {
      return valueStr.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (valueStr.length === 14) {
      return valueStr.replace(
        /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
        '$1.$2.$3/$4-$5',
      );
    }

    return value.toString();
  }
}
