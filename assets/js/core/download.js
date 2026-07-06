export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function downloadText(text, filename, type = 'text/plain;charset=utf-8') {
  downloadBlob(new Blob([text], { type }), filename);
}

export function downloadJson(data, filename) {
  downloadText(JSON.stringify(data, null, 2), filename, 'application/json;charset=utf-8');
}
