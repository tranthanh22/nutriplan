/**
 * onboarding.service.ts
 *
 * Service layer — Decoupled from the database.
 * All authentication, catalog queries, and profile saving are routed
 * via REST APIs to the NestJS backend server (http://localhost:4000/api/v1).
 */

import { apiClient } from '@/lib/api-client';
import type { AllergenOption, OnboardingData } from '@/types/onboarding';

const TOKEN_KEY = 'nutriplan_access_token';

export interface VerifyOtpResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
  };
}

export interface AuthMeResponse {
  id: string;
  email: string;
  role: string;
}

// ─── Auth REST endpoints ──────────────────────────────────────────────────────

export async function signUp(email: string, password: string) {
  const response = await apiClient.post<Partial<VerifyOtpResponse>>('/auth/signup', {
    email,
    password,
  });

  if (response.accessToken) {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TOKEN_KEY, response.accessToken);
    }
  }

  return response;
}

export async function login(email: string, password: string) {
  const response = await apiClient.post<VerifyOtpResponse>(
    '/auth/login',
    { email, password },
  );

  if (response.accessToken) {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TOKEN_KEY, response.accessToken);
    }
  }

  return response;
}

export async function verifyOtp(email: string, token: string) {
  const response = await apiClient.post<VerifyOtpResponse>(
    '/auth/verify-otp',
    { email, token },
  );

  if (response.accessToken) {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TOKEN_KEY, response.accessToken);
    }
  }

  return response;
}

export async function getSession(): Promise<{ access_token: string; user: AuthMeResponse; isFromHash?: boolean } | null> {
  if (typeof window === 'undefined') return null;

  let isFromHash = false;
  // Detect access token in URL hash/query when user clicks email confirmation link
  if (window.location.hash && window.location.hash.includes('access_token=')) {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const accessToken = params.get('access_token');
    if (accessToken) {
      window.localStorage.setItem(TOKEN_KEY, accessToken);
      window.history.replaceState(null, '', window.location.pathname);
      isFromHash = true;
    }
  }

  const token = window.localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  try {
    const user = await apiClient.get<AuthMeResponse>('/auth/me', token);
    return { access_token: token, user, isFromHash };
  } catch {
    window.localStorage.removeItem(TOKEN_KEY);
    return null;
  }
}

export function signOut() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

// ─── Catalog REST endpoints ───────────────────────────────────────────────────

/**
 * Fetch all active allergens from NestJS REST API: GET /dishes/allergens
 */
export async function fetchAllergens(): Promise<AllergenOption[]> {
  return apiClient.get<AllergenOption[]>('/dishes/allergens');
}

export async function fetchDietTypes(): Promise<{ id: string; code: string; name: string; emoji?: string; description?: string }[]> {
  return apiClient.get('/dishes/diet-types');
}

export async function fetchIngredients(): Promise<{ id: string; name: string; normalized_name: string; default_unit?: string }[]> {
  return apiClient.get('/dishes/ingredients');
}

// ─── Nutrition Profile REST endpoint ──────────────────────────────────────────

/**
 * Called at the end of Step 7.
 * Posts to NestJS REST API: POST /nutrition-profiles
 * NestJS calculates BMR, TDEE, and target macros on the server and saves the profile.
 */
export async function saveNutritionProfile(
  accessToken: string,
  data: Omit<OnboardingData, 'email' | 'password' | 'likedMealTypes'>,
) {
  return apiClient.post(
    '/nutrition-profiles',
    {
      gender: data.gender,
      birthDate: data.birthDate,
      heightCm: data.heightCm,
      weightKg: data.weightKg,
      activityLevel: data.activityLevel,
      goal: data.goal,
      dietaryPreferences: data.dietaryPreferences,
      dislikedIngredients: data.dislikedIngredients,
    },
    accessToken,
  );
}
