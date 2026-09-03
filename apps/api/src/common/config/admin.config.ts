import { registerAs } from '@nestjs/config';

export default registerAs('admin', () => ({
  organization: {
    id:
      process.env.ADMIN_ORGANIZATION_ID ||
      '964b5546-31b7-407c-b139-0d44076f08b6',
    name: process.env.ADMIN_ORGANIZATION_NAME || 'admin',
  },
  account: {
    email:
      process.env.ADMIN_ACCOUNT_EMAIL || 'admin@urbis.prefeitura.sp.gov.br',
    password: process.env.ADMIN_ACCOUNT_PASSWORD,
  },
}));
