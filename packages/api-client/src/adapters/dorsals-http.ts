import {
  DorsalDetail,
  DorsalListResponse,
  PublishDorsalInput,
  PublishDorsalResponse,
  type SearchDorsalsQuery,
} from '@dorsal/schemas';
import type { HttpClient } from '../http';
import type { DorsalsPort } from '../ports';

export class DorsalsHttpAdapter implements DorsalsPort {
  constructor(private http: HttpClient) {}

  async search(query: SearchDorsalsQuery): Promise<DorsalListResponse> {
    const raw = await this.http.get<unknown>('api/v1/dorsals', { query });
    return DorsalListResponse.parse(raw);
  }

  async getById(id: string): Promise<DorsalDetail> {
    const raw = await this.http.get<unknown>(`api/v1/dorsals/${id}`);
    return DorsalDetail.parse(raw);
  }

  async publish(input: PublishDorsalInput): Promise<PublishDorsalResponse> {
    const validated = PublishDorsalInput.parse(input);
    const raw = await this.http.post<unknown>('api/v1/dorsals', { body: validated });
    return PublishDorsalResponse.parse(raw);
  }
}
