import type {
  LoginInput,
  RegisterInput,
  RunnerProfile,
  SessionUser,
  User,
} from '@dorsal/schemas';

export interface UpdateProfileInput {
  contact?: User['contact'];
  runner?: RunnerProfile;
  full_name?: string;
}

export type UserCardInfo = Pick<
  User,
  'id' | 'full_name' | 'avatar_url' | 'rating_average' | 'total_sales'
>;

export interface UsersPort {
  register(input: RegisterInput): Promise<SessionUser>;
  login(email: string, password: string): Promise<SessionUser>;
  getMe(): Promise<User>;
  updateProfile(input: UpdateProfileInput): Promise<User>;
  getById(id: string): Promise<UserCardInfo>;
}
