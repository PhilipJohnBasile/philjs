import { describe, it, expect } from 'vitest';
import { JWTManager, createToken, verifyToken, decodeToken } from './jwt.js';

describe('JWTManager', () => {
  const secret = 'test-secret-key';

  it('should create a valid token', async () => {
    const manager = new JWTManager({ secret });
    const token = await manager.create({ sub: '123', role: 'user' });

    expect(token).toBeTruthy();
    expect(token.split('.')).toHaveLength(3);
  });

  it('should verify a valid token', async () => {
    const manager = new JWTManager({ secret });
    const token = await manager.create({ sub: '123', role: 'user' });

    const payload = await manager.verify(token);

    expect(payload.sub).toBe('123');
    expect(payload.role).toBe('user');
    expect(payload.iat).toBeTruthy();
    expect(payload.exp).toBeTruthy();
  });

  it('should reject invalid signature', async () => {
    const manager = new JWTManager({ secret });
    const token = await manager.create({ sub: '123' });

    const tamperedToken = token.slice(0, -5) + 'xxxxx';

    await expect(manager.verify(tamperedToken)).rejects.toThrow('Invalid token signature');
  });

  it('should reject expired token', async () => {
    const manager = new JWTManager({ secret, expiresIn: -1 });
    const token = await manager.create({ sub: '123' });

    await expect(manager.verify(token)).rejects.toThrow('Token expired');
  });

  it('should decode token without verification', async () => {
    const manager = new JWTManager({ secret });
    const token = await manager.create({ sub: '123', role: 'admin' });

    const payload = manager.decode(token);

    expect(payload?.sub).toBe('123');
    expect(payload?.role).toBe('admin');
  });

  it('should check if token is expired', async () => {
    const manager = new JWTManager({ secret, expiresIn: -1 });
    const expiredToken = await manager.create({ sub: '123' });

    expect(manager.isExpired(expiredToken)).toBe(true);

    const validManager = new JWTManager({ secret, expiresIn: 3600 });
    const validToken = await validManager.create({ sub: '123' });

    expect(validManager.isExpired(validToken)).toBe(false);
  });

  it('should get time to expiry', async () => {
    const manager = new JWTManager({ secret, expiresIn: 3600 });
    const token = await manager.create({ sub: '123' });

    const timeToExpiry = manager.getTimeToExpiry(token);

    expect(timeToExpiry).toBeGreaterThan(3500);
    expect(timeToExpiry).toBeLessThanOrEqual(3600);
  });

  it('should refresh a token', async () => {
    const manager = new JWTManager({ secret, expiresIn: 3600 });
    const token = await manager.create({ sub: '123', role: 'user' });

    const newToken = await manager.refresh(token);

    expect(newToken).not.toBe(token);

    const payload = await manager.verify(newToken);
    expect(payload.sub).toBe('123');
    expect(payload.role).toBe('user');
  });

  it('should include issuer and audience', async () => {
    const manager = new JWTManager({
      secret,
      issuer: 'test-issuer',
      audience: 'test-audience'
    });

    const token = await manager.create({ sub: '123' });
    const payload = await manager.verify(token);

    expect(payload.iss).toBe('test-issuer');
    expect(payload.aud).toBe('test-audience');
  });

  it('should use utility functions', async () => {
    const token = await createToken({ sub: '123', role: 'user' }, secret);
    expect(token).toBeTruthy();

    const payload = await verifyToken(token, secret);
    expect(payload.sub).toBe('123');

    const decoded = decodeToken(token);
    expect(decoded?.sub).toBe('123');
  });
});
