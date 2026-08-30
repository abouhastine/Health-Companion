import { describe, expect, it } from 'vitest';
import { loginSchema, registrationSchema } from './schemas';

describe('authentication schemas', () => {
  it('accepts a valid login', () => {
    expect(
      loginSchema.safeParse({ email: 'patient@example.com', password: 'Password1!' }).success,
    ).toBe(true);
  });

  it('rejects mismatched registration passwords', () => {
    const result = registrationSchema.safeParse({
      firstName: 'Amina',
      lastName: 'Benali',
      email: 'amina@example.com',
      phone: '',
      password: 'Password1!',
      confirmPassword: 'Different1!',
    });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.flatten().fieldErrors.confirmPassword).toBeDefined();
  });
});
