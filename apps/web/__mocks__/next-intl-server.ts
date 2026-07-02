import messages from '../messages/es.json';

type Messages = Record<string, unknown>;

function resolve(obj: Messages, key: string): string | undefined {
  const parts = key.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Messages)[part];
  }
  return typeof current === 'string' ? current : undefined;
}

function makeT(namespace?: string) {
  return (key: string, params?: Record<string, unknown>): string => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    const val = resolve(messages as Messages, fullKey) ?? key;
    if (!params) return val;
    return val.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? ''));
  };
}

export const getTranslations = (namespace?: string) => makeT(namespace);
export const getMessages = async () => messages;
export const getLocale = async () => 'es';
export const getRequestConfig = (fn: unknown) => fn;
