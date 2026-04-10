export function text(value) {
  return document.createTextNode(String(value));
}

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  // pre elements with overflow-x: auto need tabindex="0" so keyboard users can scroll them
  // (WCAG 2.1 SC 2.1.1 / axe scrollable-region-focusable rule)
  if (tag === "pre" && !("tabindex" in attrs)) {
    node.setAttribute("tabindex", "0");
  }
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
