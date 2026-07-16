'use client';
import { useApi } from '@/lib/api-client';
import type { ProofUploadUrlResponse } from '@dorsal/schemas';
import { useMutation, useQueryClient } from '@tanstack/react-query';

async function uploadToPresignedUrl(
  file: File,
  upload: Pick<ProofUploadUrlResponse, 'upload_url' | 'upload_method' | 'fields'>,
) {
  if (upload.upload_method === 'POST') {
    const fd = new FormData();
    for (const [key, value] of Object.entries(upload.fields ?? {})) fd.append(key, value);
    fd.append('file', file);
    const res = await fetch(upload.upload_url, { method: 'POST', body: fd });
    if (!res.ok) throw new Error(`proof upload failed: ${res.status}`);
    return;
  }

  const res = await fetch(upload.upload_url, { method: upload.upload_method ?? 'PUT', body: file });
  if (!res.ok) throw new Error(`proof upload failed: ${res.status}`);
}

export function useSubmitProof(id: string) {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const upload = await api.transactions.getProofUploadUrl(id, {
        contentType: file.type || 'application/octet-stream',
      });
      await uploadToPresignedUrl(file, upload);
      return api.transactions.submitProofUrl(id, {
        proofFileUrl: upload.file_url,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['transactions', 'buyer'] });
      void qc.invalidateQueries({ queryKey: ['transactions', 'seller'] });
      void qc.invalidateQueries({ queryKey: ['transactions', 'purchases'] });
      void qc.invalidateQueries({ queryKey: ['transactions', 'sales'] });
    },
  });
}
