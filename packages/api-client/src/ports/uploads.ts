export interface PresignRequest {
  contentType: string;
  sizeBytes: number;
}

export interface PresignResponse {
  uploadUrl: string;
  method: 'PUT' | 'POST';
  fields?: Record<string, string>;
  finalUrl: string;
}

export interface UploadsPort {
  createPresign(req: PresignRequest): Promise<PresignResponse>;
}
