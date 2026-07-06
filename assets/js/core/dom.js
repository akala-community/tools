export const $ = (id, root = document) => root.getElementById ? root.getElementById(id) : root.querySelector(`#${id}`);

export const qs = (selector, root = document) => root.querySelector(selector);

export const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

export function on(target, event, handler, options) {
  const element = typeof target === 'string' ? qs(target) : target;
  if (!element) return () => {};
  element.addEventListener(event, handler, options);
  return () => element.removeEventListener(event, handler, options);
}

export function setHidden(element, hidden = true) {
  if (!element) return;
  element.classList.toggle('hidden', hidden);
}
