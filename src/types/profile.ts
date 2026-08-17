export type FitnessGoal = 'strength' | 'weight_loss' | 'endurance' | 'mobility' | 'general';
export type PreferredWorkoutTime = 'morning' | 'afternoon' | 'evening';

export interface ProfilePreferences {
  fitnessGoal: FitnessGoal;
  preferredWorkoutTime: PreferredWorkoutTime;
  classReminders: boolean;
  paymentAlerts: boolean;
  activityUpdates: boolean;
}

export const DEFAULT_PROFILE_PREFERENCES: ProfilePreferences = {
  fitnessGoal: 'general',
  preferredWorkoutTime: 'morning',
  classReminders: true,
  paymentAlerts: true,
  activityUpdates: true,
};

export type StoredProfilePreferences = Partial<ProfilePreferences>;

export const normalizeProfilePreferences = (value?: StoredProfilePreferences | null): ProfilePreferences => ({
  ...DEFAULT_PROFILE_PREFERENCES,
  ...(value || {}),
});
