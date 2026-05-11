import type { PresignRequest, PresignResponse, UploadsPort } from '../ports/uploads';

export class UploadsMockAdapter implements UploadsPort {
  // Local mock: the upload itself is a no-op (object URL is created client-side).
  // Real backend will return a real S3 presigned URL.
  async createPresign(_req: PresignRequest): Promise<PresignResponse> {
    return { uploadUrl: 'about:blank', method: 'PUT', finalUrl: '' };
  }
}
