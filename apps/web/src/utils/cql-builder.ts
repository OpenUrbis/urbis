export const filtersToCQL = (filters: any[]): string => {
  if (!filters || filters.length === 0) return '';

  const conditions = filters.map((filter) => {
    const { columnId, operator, values, type } = filter;
    const value = values[0];

    const formatValue = (val: any) => {
        if (type === 'number') return val;
        if (type === 'date') return `'${new Date(val).toISOString()}'`; // Or format as needed by GeoServer
        return `'${val}'`;
    };

    switch (operator) {
      // Text
      case 'contains':
        return `${columnId} ilike '%${value}%'`; // ilike for case-insensitive
      case 'does not contain':
        return `not (${columnId} ilike '%${value}%')`;
      case 'is':
      case 'is (text)': // In case the label differs
        return `${columnId} = ${formatValue(value)}`;
      case 'is not':
        return `${columnId} <> ${formatValue(value)}`;
      
      // Number
      case 'is greater than':
        return `${columnId} > ${value}`;
      case 'is greater than or equal to':
        return `${columnId} >= ${value}`;
      case 'is less than':
        return `${columnId} < ${value}`;
      case 'is less than or equal to':
        return `${columnId} <= ${value}`;
      case 'is between':
        return `${columnId} BETWEEN ${values[0]} AND ${values[1]}`;
      case 'is not between':
        return `not (${columnId} BETWEEN ${values[0]} AND ${values[1]})`;

      // Date
      case 'is before':
        return `${columnId} < ${formatValue(value)}`;
      case 'is on or after':
        return `${columnId} >= ${formatValue(value)}`;
      case 'is after':
        return `${columnId} > ${formatValue(value)}`;
      case 'is on or before':
        return `${columnId} <= ${formatValue(value)}`;
      
      // Option
      case 'is any of':
      case 'include any of':
        const opts = values.map(formatValue).join(', ');
        return `${columnId} IN (${opts})`;
      case 'is none of':
        const notOpts = values.map(formatValue).join(', ');
        return `${columnId} NOT IN (${notOpts})`;
      
      default:
        console.warn(`Unsupported operator: ${operator}`);
        return '';
    }
  }).filter(c => c !== '');

  return conditions.join(' AND ');
};
