import {
  DorsalsHttpAdapter,
  ReviewsHttpAdapter,
  TransactionsHttpAdapter,
  UploadsMockAdapter,
  UsersHttpAdapter,
} from './adapters';
import { createHttp, type HttpClient, type HttpClientOptions } from './http';
import type {
  DorsalsPort,
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
  reviews: ReviewsPort;
  uploads: UploadsPort;
}

export type ApiFactoryOptions = HttpClientOptions;

export function createApi(opts: ApiFactoryOptions): Api {
  const http = createHttp(opts);
  return {
    http,
    dorsals: new DorsalsHttpAdapter(http),
    users: new UsersHttpAdapter(http),
    transactions: new TransactionsHttpAdapter(http),
    reviews: new ReviewsHttpAdapter(http),
    uploads: new UploadsMockAdapter(),
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
