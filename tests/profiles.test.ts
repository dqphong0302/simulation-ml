import { afterEach, expect, it, vi } from 'vitest';
import { profilesWithoutKeys, restoreProfiles, type Profiles } from '../src/core/security/profiles';
import { clearKeys, getSessionSnapshot, loadProfilesWithoutKeys, setSession } from '../src/core/security/keystore';

const defaults: Profiles = { chatA: { label: 'A', baseUrl: '', model: '', apiKey: 'SECRET', temperature: 0.7, topP: 1, maxTokens: 512, stream: true }, chatB: { label: 'B', baseUrl: '', model: '', apiKey: 'SECRET', temperature: 0.7, topP: 1, maxTokens: 512, stream: true }, embed: { baseUrl: '', model: '', apiKey: 'SECRET' } };
afterEach(() => { clearKeys(); vi.unstubAllGlobals(); });
it('restores only typed known settings, never keys or arbitrary fields', () => {
  const loaded = restoreProfiles(JSON.stringify({ chatA: { baseUrl: 'https://test.example/v1', model: null, temperature: 'bad', stream: 'false', maxTokens: -1, apiKey: 'PERSISTED_SECRET', extra: 'injected' }, chatB: [], embed: { model: 'embed', apiKey: 'PERSISTED_SECRET' } }), defaults);
  expect(loaded.chatA).toEqual({ ...defaults.chatA, baseUrl: 'https://test.example/v1', apiKey: '' });
  expect(loaded.embed).toEqual({ baseUrl: '', model: 'embed', apiKey: '' });
  expect(JSON.stringify(loaded)).not.toContain('SECRET');
  expect(restoreProfiles('null', defaults).chatA.apiKey).toBe('');
});
it('serializes connection settings without secret fields', () => {
  expect(JSON.stringify(profilesWithoutKeys(defaults))).not.toMatch(/SECRET|apiKey/);
  expect(restoreProfiles(JSON.stringify(profilesWithoutKeys(defaults)), defaults).chatB).toEqual({ ...defaults.chatB, apiKey: '' });
});
it('does not mutate a caller profile and clears the inherited key when endpoint changes', () => {
  setSession('chatA', { ...defaults.chatA, baseUrl: 'https://a.example/v1' });
  const next = Object.freeze({ ...getSessionSnapshot().chatA, baseUrl: 'https://b.example/v1' });
  setSession('chatA', next);
  expect(next.apiKey).toBe('SECRET');
  expect(getSessionSnapshot().chatA.apiKey).toBe('');
});
it('ignores broken storage, restores validated profiles, and never saves keys', () => {
  const setItem = vi.fn();
  const getItem = vi.fn((key: string): string => key === 'sml.persist' ? '1' : '{bad');
  vi.stubGlobal('localStorage', { getItem, setItem });
  const before = getSessionSnapshot();
  loadProfilesWithoutKeys(); expect(getSessionSnapshot()).toBe(before);
  getItem.mockImplementation(key => key === 'sml.persist' ? '1' : JSON.stringify(profilesWithoutKeys(defaults)));
  loadProfilesWithoutKeys(); expect(getSessionSnapshot().chatA.temperature).toBe(0.7);
  setSession('chatA', defaults.chatA);
  expect(setItem.mock.calls[0][1]).not.toMatch(/SECRET|apiKey/);
});
