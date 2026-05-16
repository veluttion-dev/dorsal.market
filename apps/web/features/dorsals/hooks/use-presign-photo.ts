'use client';
import { useApi } from '@/lib/api-client';
import { useMutation } from '@tanstack/react-query';

export interface PresignedPhoto {
  /** URL stored on the dorsal — sent to the backend as `photo_url`. */
  finalUrl: string;
  /** Local object URL for immediate preview (revoke when no longer needed). */
  previewUrl: string;
}

/**
 * Uploads a photo and returns its final URL.
 *
 * Until the backend exposes the real S3 presign endpoint, the UploadsMockAdapter
 * returns `uploadUrl: 'about:blank'`. In that case we cannot persist the actual
 * image, so `finalUrl` becomes a deterministic https placeholder (valid for the
 * real Catalog backend, which validates `photo_url` as a URL). The user still
 * sees their real image via `previewUrl`.
 */
export function usePresignPhoto() {
  const api = useApi();
  return useMutation<PresignedPhoto, Error, File>({
    mutationFn: async (file: File) => {
      const previewUrl = URL.createObjectURL(file);
      const presign = await api.uploads.createPresign({
        contentType: file.type,
        sizeBytes: file.size,
      });

      if (presign.uploadUrl === 'about:blank') {
        // Mock path — no real storage yet.
        const seed = encodeURIComponent(file.name || 'dorsal');
        return { finalUrl: `https://picsum.photos/seed/${seed}/1200/800`, previewUrl };
      }

      // Real S3 path: upload directly to the presigned URL.
      if (presign.fields) {
        const fd = new FormData();
        for (const [k, v] of Object.entries(presign.fields)) fd.append(k, v);
        fd.append('file', file);
        const res = await fetch(presign.uploadUrl, { method: presign.method, body: fd });
        if (!res.ok) throw new Error('upload failed');
      } else {
        const res = await fetch(presign.uploadUrl, {
          method: presign.method,
          headers: { 'Content-Type': file.type },
          body: file,
        });
        if (!res.ok) throw new Error('upload failed');
      }
      return { finalUrl: presign.finalUrl, previewUrl };
    },
  });
}
