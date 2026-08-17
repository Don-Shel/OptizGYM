import { describe, expect, it } from 'vitest';
import { classSchema } from '../src/types/schemas';

describe('classSchema', () => {
  it('accepts the admin camelCase duration payload and trainer linkage fields', async () => {
    const payload = await classSchema.parseAsync({
      name: 'Power Yoga Flow',
      instructor: 'QA Trainer',
      instructorId: '1e5e7836-8c4d-4444-a957-3f9f9b9e9c9d',
      schedule: '2026-08-17T10:00:00.000Z',
      durationMinutes: 60,
      capacity: 20,
      category: 'yoga',
      location: 'Studio A',
      description: 'A controlled yoga session.',
      difficulty: 'intermediate',
      intensity: 'medium',
      requirements: 'Bring a mat.',
    });

    expect(payload.durationMinutes).toBe(60);
    expect(payload.instructorId).toBe('1e5e7836-8c4d-4444-a957-3f9f9b9e9c9d');
  });

  it('keeps legacy snake_case duration payloads valid', async () => {
    const payload = await classSchema.parseAsync({
      name: 'Legacy Class',
      instructor: 'Legacy Trainer',
      schedule: '2026-08-17T10:00:00.000Z',
      duration_minutes: 45,
    });

    expect(payload.duration_minutes).toBe(45);
    expect(payload.capacity).toBe(20);
  });
});
