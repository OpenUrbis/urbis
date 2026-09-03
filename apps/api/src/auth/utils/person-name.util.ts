const LOWERCASE_NAME_PARTICLES = new Set(['da', 'das', 'de', 'do', 'dos', 'e']);

export function normalizePersonName(value?: string): string {
  return (value ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part, index) => {
      const normalized =
        part.charAt(0).toLocaleUpperCase('pt-BR') +
        part.slice(1).toLocaleLowerCase('pt-BR');

      return index > 0 && LOWERCASE_NAME_PARTICLES.has(normalized.toLowerCase())
        ? normalized.toLocaleLowerCase('pt-BR')
        : normalized;
    })
    .join(' ');
}

export function splitGovBrFullName(value?: string): {
  firstName: string;
  lastName: string;
} {
  const normalizedName = normalizePersonName(value);
  const [firstName = '', ...lastNameParts] = normalizedName.split(' ');

  return {
    firstName,
    lastName: lastNameParts.join(' '),
  };
}
