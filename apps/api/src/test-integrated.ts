import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuthService } from './auth/auth.service';
import { UserService } from './user/user.service';

async function run() {
  console.log('--- STARTING INTEGRATED END-TO-END MAIL TEST ---');
  console.log(
    'Bootstrapping NestJS application context (real DB, Config, and Mail)...',
  );

  const app = await NestFactory.createApplicationContext(AppModule);
  console.log('Context bootstrapped successfully!');

  const authService = app.get(AuthService);
  const userService = app.get(UserService);

  const email = process.env.TEST_EMAIL || 'test-e2e@example.com';
  const cpf = process.env.TEST_CPF || '000.000.000-00';

  console.log(`Checking for existing user with email: ${email}...`);
  const existingUserEmail = await userService.findOne({ email });
  if (existingUserEmail) {
    console.log(
      `User with email ${email} exists. Deleting to run registration cleanly...`,
    );
    const repo = (userService as any).usersRepository;
    await repo.delete({ email });
    console.log('Existing user by email cleaned up.');
  }

  console.log(`Checking for existing user with CPF: ${cpf}...`);
  const existingUserCpf = await userService.findOne({ cpf });
  if (existingUserCpf) {
    console.log(
      `User with CPF ${cpf} exists. Deleting to run registration cleanly...`,
    );
    const repo = (userService as any).usersRepository;
    await repo.delete({ cpf });
    console.log('Existing user by CPF cleaned up.');
  }

  console.log(`\n1. Executing integrated registration for ${email}...`);
  try {
    const registerResult = await authService.register({
      email,
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
      cpf,
      birthDate: '1997-01-01',
      accountType: 'fisica_capaz',
    });
    console.log(
      'SUCCESS: Registration completed! User created in database and confirmation email sent.',
      registerResult,
    );
  } catch (err) {
    console.error(
      'FAILED: Registration failed:',
      err.response?.body || err.message || err,
    );
  }

  console.log(
    `\n2. Executing integrated forgot password recovery for ${email}...`,
  );
  try {
    const forgotResult = await authService.forgotPassword(email);
    console.log(
      'SUCCESS: Forgot password flow executed! Reset password email sent.',
      forgotResult,
    );
  } catch (err) {
    console.error(
      'FAILED: Password recovery failed:',
      err.response?.body || err.message || err,
    );
  }

  console.log('\nClosing NestJS context...');
  await app.close();
  console.log('--- INTEGRATED MAIL TEST COMPLETE ---');
}

run().catch((err) => {
  console.error('Fatal error during integrated test execution:', err);
});
