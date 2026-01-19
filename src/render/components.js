export function text(value) {
  return document.createTextNode(String(value));
}

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined) continue;
    if (k === "class") node.className = String(v);
    else node.setAttribute(k, String(v));
  }
  for (const child of children) node.appendChild(child);
  return node;
}

export function button(label, onClick, attrs = {}) {
  const btn = el("button", { type: "button", ...attrs }, [text(label)]);
  btn.addEventListener("click", onClick);
  return btn;
}
