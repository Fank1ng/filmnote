export function byId(id: string): HTMLElement | null {
  return document.getElementById(id);
}

export function qs<T extends Element = Element>(selector: string, root: ParentNode = document): T | null {
  return root.querySelector(selector);
}

export function qsa<T extends Element = Element>(selector: string, root: ParentNode = document): T[] {
  return Array.from(root.querySelectorAll<T>(selector));
}

export function installDomNamespace(target: Window = window): void {
  target.FilmNoteDOM = {
    byId,
    qs,
    qsa,
  };
}
