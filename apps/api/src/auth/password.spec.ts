import * as bcrypt from 'bcryptjs';

describe('Password Hashing', () => {
  it('should hash a password', async () => {
    const password = 'testpassword123';
    const hash = await bcrypt.hash(password, 10);
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(0);
  });

  it('should verify a password against its hash', async () => {
    const password = 'testpassword123';
    const hash = await bcrypt.hash(password, 10);
    const isValid = await bcrypt.compare(password, hash);
    expect(isValid).toBe(true);
  });

  it('should reject wrong password', async () => {
    const password = 'testpassword123';
    const hash = await bcrypt.hash(password, 10);
    const isValid = await bcrypt.compare('wrongpassword', hash);
    expect(isValid).toBe(false);
  });
});
