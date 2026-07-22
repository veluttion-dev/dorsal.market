import {
  DorsalsHttpAdapter,
  NotificationsHttpAdapter,
  ReviewsHttpAdapter,
  TransactionsHttpAdapter,
  UploadsHttpAdapter,
  UploadsMockAdapter,
  UsersHttpAdapter,
} from './adapters';
import { type HttpClient, type HttpClientOptions, createHttp } from './http';
import type {
  DorsalsPort,
  NotificationsPort,
  ReviewsPort,
  TransactionsPort,
  UploadsPort,
  UsersPort,
} from './ports';

export interface Api {
  http: HttpClient;
  dorsals: DorsalsPort;
  users: UsersPort;
  transactions: TransactionsPort;
  notifications: NotificationsPort;
  reviews: ReviewsPort;
  uploads: UploadsPort;
}

export type ApiFactoryOptions = HttpClientOptions & {
  realModules?: string | undefined;
};

export function createApi(opts: ApiFactoryOptions): Api {
  const http = createHttp(opts);
  const realModules = parseRealModules(opts.realModules);
  return {
    http,
    dorsals: new DorsalsHttpAdapter(http),
    users: new UsersHttpAdapter(http),
    transactions: new TransactionsHttpAdapter(http),
    notifications: new NotificationsHttpAdapter(http),
    reviews: new ReviewsHttpAdapter(http),
    uploads: realModules.includes('dorsals')
      ? new UploadsHttpAdapter(http)
      : new UploadsMockAdapter(),
  };
}

export type ApiModule = 'dorsals' | 'users' | 'transactions' | 'reviews';

export function parseRealModules(csv: string | undefined): ApiModule[] {
  const all: ApiModule[] = ['dorsals', 'users', 'transactions', 'reviews'];
  if (!csv) return [];
  return csv
    .split(',')
    .map((s) => s.trim())
    .filter((m): m is ApiModule => all.includes(m as ApiModule));
}

export function deriveMockedModules(real: ApiModule[]): ApiModule[] {
  const all: ApiModule[] = ['dorsals', 'users', 'transactions', 'reviews'];
  return all.filter((m) => !real.includes(m));
}
