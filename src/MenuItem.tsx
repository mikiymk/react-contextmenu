import React, { useRef } from "react";
import cx from "classnames";

import { hideMenu } from "./actions";
import { callIfExists, cssClasses, store } from "./helpers";

type MenuItemProps = {
  attributes?: React.HTMLAttributes<HTMLDivElement>;
  className?: string;
  data?: Object;
  disabled?: boolean;
  divider?: boolean;
  preventClose?: boolean;
  onClick?: (
    event: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>,
    data: Object,
    target: HTMLElement
  ) => void;

  children: React.ReactNode;
  onMouseLeave: React.MouseEventHandler<HTMLDivElement>;
  onMouseMove: React.MouseEventHandler<HTMLDivElement>;
  selected: boolean;
};

export const MenuItem = (props: MenuItemProps) => {
  const refs = useRef<HTMLDivElement | null>();

  const handleClick = (
    event:
      | React.MouseEvent<HTMLDivElement, MouseEvent>
      | React.TouchEvent<HTMLDivElement>
  ) => {
    if ("button" in event && event.button !== 0 && event.button !== 1) {
      event.preventDefault();
    }

    if (props.disabled || props.divider) return;

    callIfExists(
      props.onClick,
      event,
      Object.assign({}, props.data, store.data),
      store.target
    );

    if (props.preventClose) return;

    hideMenu();
  };

  const menuItemClassNames = cx(
    props.className,
    cssClasses.menuItem,
    props.attributes?.className,
    {
      [cx(cssClasses.menuItemDisabled, props.attributes?.disabledClassName)]:
        props.disabled,
      [cx(cssClasses.menuItemDivider, props.attributes?.dividerClassName)]:
        props.divider,
      [cx(cssClasses.menuItemSelected, props.attributes?.selectedClassName)]:
        props.selected,
    }
  );

  return (
    <div
      {...(props.attributes ?? {})}
      className={menuItemClassNames}
      role="menuitem"
      tabIndex={-1}
      aria-disabled={props.disabled ? "true" : "false"}
      aria-orientation={props.divider ? "horizontal" : undefined}
      ref={(ref) => {
        refs.current = ref;
      }}
      onMouseMove={props.onMouseMove}
      onMouseLeave={props.onMouseLeave}
      onTouchEnd={handleClick}
      onClick={handleClick}
    >
      {props.divider ? null : props.children}
    </div>
  );
};
