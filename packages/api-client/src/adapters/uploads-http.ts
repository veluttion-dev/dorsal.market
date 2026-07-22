import { z } from 'zod';
import type { HttpClient } from '../http';
import type {
  PresignRequest,
  PresignResponse,
  UploadPhotoResponse,
  UploadsPort,
} from '../ports/uploads';

const UploadPhotoBackendResponse = z.object({
  photo_url: z.string().url(),
});

export class UploadsHttpAdapter implements UploadsPort {
  constructor(private http: HttpClient) {}

  async createPresign(_req: PresignRequest): Promise<PresignResponse> {
    throw new Error('Dorsal photo uploads use uploadPhoto');
  }

  async uploadPhoto(file: File): Promise<UploadPhotoResponse> {
    const body = new FormData();
    body.append('file', file);
    const raw = await this.http.post<unknown>('api/v1/dorsals/photos', { body });
    const parsed = UploadPhotoBackendResponse.parse(raw);
    return { photoUrl: parsed.photo_url };
  }
}
