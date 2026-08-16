import { describe, expect, it } from 'vitest';
import { getAllowedFrontendOrigins } from '../src/config/cors';

describe('frontend CORS origins', () => {
  it('allows both deployed Vercel hostnames in production', () => {
    expect(getAllowedFrontendOrigins('https://optizgym.vercel.app', 'production')).toEqual([
      'https://optizgym.vercel.app',
      'https://optibizgym.vercel.app',
    ]);
  });

  it('merges configured origins without duplicates or trailing slashes', () => {
    expect(getAllowedFrontendOrigins(
      'https://optibizgym.vercel.app/, https://staging.example.com, https://optibizgym.vercel.app',
      'production',
    )).toEqual([
      'https://optibizgym.vercel.app',
      'https://staging.example.com',
      'https://optizgym.vercel.app',
    ]);
  });

  it('keeps development defaults local and does not add production aliases', () => {
    expect(getAllowedFrontendOrigins(undefined, 'development')).toEqual([
      'http://localhost:8080',
    ]);
  });
});
