export function sanitizeFileName(input: string) {
  return input.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').replace(/\s+/g, '-');
}
