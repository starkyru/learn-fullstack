const FOCUSABLE = ["a[href]", "button", "input", "select", "textarea", "[tabindex]"].join(
  ",",
);

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const nodes = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
  return nodes.filter((el) => {
    if (el.hasAttribute("disabled")) return false;
    if (el.getAttribute("tabindex") === "-1") return false;
    return true;
  });
}
