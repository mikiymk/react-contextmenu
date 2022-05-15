export function callIfExists<F extends (...args: any) => any>(
  func?: F,
  ...args: Parameters<F>
): ReturnType<F> {
  return typeof func === "function" && func(...(args as any[]));
}

export function hasOwnProp<K extends PropertyKey>(
  obj: any,
  prop: K
): obj is { [prop in K]: any } {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

export function uniqueId() {
  return Math.random().toString(36).substring(7);
}

export const cssClasses = {
  menu: "solid-contextmenu",
  menuVisible: "solid-contextmenu--visible",
  menuWrapper: "solid-contextmenu-wrapper",
  menuItem: "solid-contextmenu-item",
  menuItemActive: "solid-contextmenu-item--active",
  menuItemDisabled: "solid-contextmenu-item--disabled",
  menuItemDivider: "solid-contextmenu-item--divider",
  menuItemSelected: "solid-contextmenu-item--selected",
  subMenu: "solid-contextmenu-submenu",
} as const;

export const store: Partial<{
  store:any,
  data: any,
  target: any,
}> = {};

export const canUseDOM = Boolean(
  typeof window !== "undefined" &&
    window.document &&
    window.document.createElement
);
