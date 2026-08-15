import api from './axios';

function filenameFromDisposition(header: string | undefined, fallback: string): string {
  if (!header) return fallback;
  const utf = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf?.[1]) {
    return decodeURIComponent(utf[1]);
  }
  const plain = header.match(/filename="?([^";]+)"?/i);
  return plain?.[1] ?? fallback;
}

export async function downloadExport(path: string, fallbackName: string): Promise<void> {
  const res = await api.get(path, { responseType: 'blob' });
  const contentType = (res.headers['content-type'] as string) || '';

  if (contentType.includes('application/json')) {
    const text = await (res.data as Blob).text();
    const json = JSON.parse(text);
    throw new Error(json.message || 'Téléchargement impossible.');
  }

  const blob = new Blob([res.data], { type: contentType || 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filenameFromDisposition(res.headers['content-disposition'] as string | undefined, fallbackName);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
