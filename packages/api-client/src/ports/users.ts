import type {
  PatchUserProfileInput,
  PublicUserProfile,
  RegisterInput,
  SessionUser,
  UserProfile,
} from '@dorsal/schemas';

export type UserCardInfo = PublicUserProfile;

export interface UsersPort {
  register(input: RegisterInput): Promise<SessionUser>;
  login(email: string, password: string): Promise<SessionUser>;
  getMe(): Promise<UserProfile>;
  patchMe(input: PatchUserProfileInput): Promise<UserProfile>;
  getPublicProfile(id: string): Promise<PublicUserProfile>;
}
