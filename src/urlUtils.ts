/**
 * URL manipulation utilities for multi-user testing
 */

import type { ProfileId } from './profiles';

const PROFILE_PARAM = 'test_profile';

/**
 * Build a new URL with the specified profile ID
 * Preserves existing query parameters and URL hash
 *
 * @param profileId - The profile ID to set (e.g., "alice", "bob")
 * @param baseUrl - Base URL to modify (defaults to current window.location.href)
 * @returns Complete URL with profile parameter added/updated
 */
export function buildUrlWithProfile(
  profileId: ProfileId,
  baseUrl?: string
): string {
  const url = new URL(baseUrl || window.location.href);

  // Update or add the profile parameter
  url.searchParams.set(PROFILE_PARAM, profileId);

  return url.toString();
}

/**
 * Get the profile ID from the current URL
 * Returns null if no profile parameter is present
 */
export function getProfileIdFromUrl(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  return params.get(PROFILE_PARAM);
}

/**
 * Check if a profile parameter exists in the URL
 */
export function hasProfileInUrl(): boolean {
  return getProfileIdFromUrl() !== null;
}
