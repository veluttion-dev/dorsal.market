'use client';
import { useApi } from '@/lib/api-client';
import { useMutation } from '@tanstack/react-query';

export interface PresignedPhoto {
  /** URL stored on the dorsal, sent to the backend as `photo_url`. */
  finalUrl: string;
  /** Local object URL for immediate preview; revoke it when no longer needed. */
  previewUrl: string;
}

export function usePresignPhoto() {
  const api = useApi();
  return useMutation<PresignedPhoto, Error, File>({
    mutationFn: async (file: File) => {
      const previewUrl = URL.createObjectURL(file);
      const upload = await api.uploads.uploadPhoto(file);
      return { finalUrl: upload.photoUrl, previewUrl };
    },
  });
}
