'use client';
import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();
  const resolved = (theme === 'light' || theme === 'dark' ? theme : 'system') as
    | 'light'
    | 'dark'
    | 'system';
  return (
    <Sonner
      theme={resolved}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-bg-card group-[.toaster]:text-text-primary group-[.toaster]:border-border group-[.toaster]:shadow-elevated',
          description: 'group-[.toast]:text-text-secondary',
          actionButton: 'group-[.toast]:bg-coral group-[.toast]:text-white',
          cancelButton: 'group-[.toast]:bg-bg-elevated group-[.toast]:text-text-secondary',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
