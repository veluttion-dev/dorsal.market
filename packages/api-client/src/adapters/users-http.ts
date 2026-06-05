import {
  LoginInput,
  PatchUserProfileInput,
  PublicUserProfile,
  RegisterInput,
  SessionUser,
  UserProfile,
} from '@dorsal/schemas';
import type { HttpClient } from '../http';
import type { UsersPort } from '../ports';

export class UsersHttpAdapter implements UsersPort {
  constructor(private http: HttpClient) {}

  async register(input: RegisterInput): Promise<SessionUser> {
    return SessionUser.parse(
      await this.http.post('api/v1/auth/register', { body: RegisterInput.parse(input) }),
    );
  }

  async login(email: string, password: string): Promise<SessionUser> {
    return SessionUser.parse(
      await this.http.post('api/v1/auth/login', { body: LoginInput.parse({ email, password }) }),
    );
  }

  async getMe(): Promise<UserProfile> {
    return UserProfile.parse(await this.http.get('api/v1/me'));
  }

  async patchMe(input: PatchUserProfileInput): Promise<UserProfile> {
    return UserProfile.parse(
      await this.http.patch('api/v1/me', { body: PatchUserProfileInput.parse(input) }),
    );
  }

  async getPublicProfile(id: string): Promise<PublicUserProfile> {
    return PublicUserProfile.parse(await this.http.get(`api/v1/users/${id}/public`));
  }
}
