'use client';
import { usePresignPhoto } from '@/features/dorsals/hooks/use-presign-photo';
import { cn } from '@/lib/utils';
import { Image as ImageIcon, Upload, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';

export function PhotoUpload({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const t = useTranslations('photo_upload');
  const [preview, setPreview] = useState<string | null>(value);
  const objectUrlRef = useRef<string | null>(null);
  const presign = usePresignPhoto();

  const setPreviewUrl = useCallback((next: string | null) => {
    if (objectUrlRef.current && objectUrlRef.current !== next) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    objectUrlRef.current = next?.startsWith('blob:') ? next : null;
    setPreview(next);
  }, []);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const onDrop = useCallback(
    (accepted: File[]) => {
      const file = accepted[0];
      if (!file) return;
      presign.mutate(file, {
        onSuccess: ({ finalUrl, previewUrl }) => {
          setPreviewUrl(previewUrl);
          onChange(finalUrl);
        },
      });
    },
    [presign, onChange, setPreviewUrl],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxSize: 8 * 1024 * 1024,
    multiple: false,
  });

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-bg-elevated">
          <img src={preview} alt={t('preview_alt')} className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => {
              setPreviewUrl(null);
              onChange(null);
            }}
            className="absolute right-2 top-2 rounded-full bg-bg-primary/80 p-1.5 text-text-primary hover:bg-bg-primary"
            aria-label={t('remove_aria')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'flex aspect-video cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-bg-elevated text-text-secondary transition',
            isDragActive && 'border-coral bg-coral-subtle text-coral',
          )}
        >
          <input {...getInputProps()} />
          {presign.isPending ? (
            <p>{t('uploading')}</p>
          ) : (
            <>
              <ImageIcon className="h-10 w-10" />
              <p className="text-sm font-medium">
                <Upload className="-mt-1 mr-1 inline h-3.5 w-3.5" />
                {t('drop_hint')}
              </p>
              <p className="text-xs">{t('file_types')}</p>
            </>
          )}
        </div>
      )}
      {presign.isError && <p className="text-sm text-red-500">{t('upload_error')}</p>}
    </div>
  );
}
