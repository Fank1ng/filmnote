export function esc(value: unknown): string {
  const div = document.createElement('div');
  div.textContent = value == null ? '' : String(value);
  return div.innerHTML;
}

export function fmtDate(value: string | number | Date | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function normalizeSearchText(value: unknown): string {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function installUtilsNamespace(target: Window = window): void {
  target.FilmNoteUtils = {
    esc,
    fmtDate,
    normalizeSearchText,
  };
}
