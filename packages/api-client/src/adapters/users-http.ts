import { LoginInput, RegisterInput, SessionUser, User } from '@dorsal/schemas';
import type { HttpClient } from '../http';
import type { UpdateProfileInput, UserCardInfo, UsersPort } from '../ports';

const UserCardSchema = User.pick({
  id: true,
  full_name: true,
  avatar_url: true,
  rating_average: true,
  total_sales: true,
});

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

  async getMe(): Promise<User> {
    return User.parse(await this.http.get('api/v1/users/me'));
  }

  async updateProfile(input: UpdateProfileInput): Promise<User> {
    return User.parse(await this.http.patch('api/v1/users/me', { body: input }));
  }

  async getById(id: string): Promise<UserCardInfo> {
    return UserCardSchema.parse(await this.http.get(`api/v1/users/${id}`));
  }
}
