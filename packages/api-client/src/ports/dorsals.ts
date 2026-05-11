import type {
  DorsalDetail,
  DorsalListResponse,
  PublishDorsalInput,
  PublishDorsalResponse,
  SearchDorsalsQuery,
} from '@dorsal/schemas';

export interface DorsalsPort {
  search(query: SearchDorsalsQuery): Promise<DorsalListResponse>;
  getById(id: string): Promise<DorsalDetail>;
  publish(input: PublishDorsalInput): Promise<PublishDorsalResponse>;
}
