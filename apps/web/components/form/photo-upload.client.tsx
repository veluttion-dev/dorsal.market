'use client';
import { Image as ImageIcon, Upload, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { usePresignPhoto } from '@/features/dorsals/hooks/use-presign-photo';
import { cn } from '@/lib/utils';

/**
 * Photo dropzone. `value` is the persisted photo URL; `onChange` fires with the
 * final URL once the upload resolves (or null when cleared).
 */
export function PhotoUpload({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const [preview, setPreview] = useState<string | null>(value);
  const presign = usePresignPhoto();

  const onDrop = useCallback(
    (accepted: File[]) => {
      const file = accepted[0];
      if (!file) return;
      presign.mutate(file, {
        onSuccess: ({ finalUrl, previewUrl }) => {
          setPreview(previewUrl);
          onChange(finalUrl);
        },
      });
    },
    [presign, onChange],
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
          {/* Preview is a local object URL or a remote URL — plain <img> is fine. */}
          {/* biome-ignore lint/a11y/useAltText: decorative preview of the uploaded file */}
          <img src={preview} alt="Vista previa del dorsal" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => {
              setPreview(null);
              onChange(null);
            }}
            className="absolute right-2 top-2 rounded-full bg-bg-primary/80 p-1.5 text-text-primary hover:bg-bg-primary"
            aria-label="Quitar foto"
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
            <p>Subiendo…</p>
          ) : (
            <>
              <ImageIcon className="h-10 w-10" />
              <p className="text-sm font-medium">
                <Upload className="-mt-1 mr-1 inline h-3.5 w-3.5" />
                Arrastra una foto o haz clic
              </p>
              <p className="text-xs">PNG / JPG / WEBP · Máx 8 MB</p>
            </>
          )}
        </div>
      )}
      {presign.isError && <p className="text-sm text-red-500">No se pudo subir la foto</p>}
    </div>
  );
}
