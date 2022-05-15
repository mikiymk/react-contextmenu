import React, { Component, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import assign from "object-assign";

import { hideMenu } from "./actions";
import { useAbstractMenu } from "./AbstractMenu";
import { callIfExists, cssClasses, hasOwnProp, store } from "./helpers";
import listener from "./globalEventListener";

const usePrev = <T,>(value: T) => {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

type SubMenuProps = {
  title: React.ReactElement<any> | string | number;
  className?: string;
  disabled?: boolean;
  hoverDelay?: number;
  rtl?: boolean;
  preventCloseOnClick?: boolean;
  onClick?: (
    event: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>,
    data: Object,
    target: HTMLElement
  ) => void;

  children: React.ReactNode;
  attributes?: React.HTMLAttributes<any> & {
    listClassName: string[];
    disabledClassName: string;
    visibleClassName: string;
    selectedClassName: string;
  };

  selected: boolean;
  onMouseMove: () => void;
  onMouseOut: () => void;
  forceOpen: boolean;
  forceClose: () => void;
  parentKeyNavigationHandler: () => void;
  data: any;
};

export const SubMenu = (props: SubMenuProps) => {
  const [visible, setVisible] = useState(false);

  const { setSelectedItem, renderChildren, handleKeyNavigation } =
    useAbstractMenu({
      hideMenu: (e) => {
        e.preventDefault();
        hideSubMenu(e);
      },
    });

  const menuRef = useRef<HTMLElement | null>(null);
  const subMenuRef = useRef<HTMLElement | null>(null);

  const getMenuPosition = () => {
    const { innerWidth, innerHeight } = window;
    const rect = subMenuRef.current?.getBoundingClientRect();
    const position: {
      top?: string;
      bottom?: string;
      left?: string;
      right?: string;
    } = {};

    if (rect?.bottom ?? 0 > innerHeight) {
      position.bottom = "0";
    } else {
      position.top = "0";
    }

    if (rect?.right ?? 0 < innerWidth) {
      position.left = "100%";
    } else {
      position.right = "100%";
    }

    return position;
  };

  const getRTLMenuPosition = () => {
    const { innerHeight } = window;
    const rect = subMenuRef.current?.getBoundingClientRect();
    const position: {
      top?: string;
      bottom?: string;
      left?: string;
      right?: string;
    } = {};

    if (rect?.bottom ?? 0 > innerHeight) {
      position.bottom = "0";
    } else {
      position.top = "0";
    }

    if (rect?.left ?? 0 < 0) {
      position.left = "100%";
    } else {
      position.right = "100%";
    }

    return position;
  };

  const registerHandlers = () => {
    document.removeEventListener("keydown", props.parentKeyNavigationHandler);
    document.addEventListener("keydown", handleKeyNavigation);
  };

  const unregisterHandlers = (dismounting?: true) => {
    document.removeEventListener("keydown", handleKeyNavigation);
    if (!dismounting) {
      document.addEventListener("keydown", props.parentKeyNavigationHandler);
    }
  };

  const hideSubMenu = (e: { detail?: { id: string } | number }) => {
    // avoid closing submenus of a different menu tree
    if (
      e.detail &&
      typeof e.detail === "object" &&
      e.detail.id &&
      menuRef.current &&
      e.detail.id !== menuRef.current.id
    ) {
      return;
    }

    if (props.forceOpen) {
      props.forceClose();
    }
    setVisible(false);
    setSelectedItem(null);
    unregisterHandlers();
  };

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (props.disabled) return;

    callIfExists(
      props.onClick,
      event,
      assign({}, props.data, store.data),
      store.target
    );

    if (!props.onClick || props.preventCloseOnClick) return;

    hideMenu();
  };

  const closetimer = useRef(0);
  const opentimer = useRef(0);
  const handleMouseEnter = () => {
    if (closetimer.current) clearTimeout(closetimer.current);

    if (props.disabled || visible) return;

    opentimer.current = window.setTimeout(() => {
      setVisible(true);
      setSelectedItem(null);
    }, props.hoverDelay ?? 500);
  };

  const handleMouseLeave = () => {
    if (opentimer.current) clearTimeout(opentimer.current);

    if (!visible) return;

    closetimer.current = window.setTimeout(() => {
      setVisible(false);
      setSelectedItem(null);
    }, props.hoverDelay ?? 500);
  };

  const listenId = useRef<string>();
  useEffect(() => {
    listenId.current = listener.register(() => {}, hideSubMenu);

    return () => {
      if (listenId.current) {
        listener.unregister(listenId.current);
      }

      if (opentimer.current) clearTimeout(opentimer.current);
      if (closetimer.current) clearTimeout(closetimer.current);

      unregisterHandlers(true);
    };
  }, []);

  const prevVisible = usePrev(visible);
  const prevForceOpen = usePrev(props.forceOpen);

  useEffect(() => {
    const isVisibilityChange =
      (prevVisible !== visible || prevForceOpen !== props.forceOpen) &&
      !(prevVisible && props.forceOpen) &&
      !(prevForceOpen && visible);

    if (!isVisibilityChange) return;
    const subMenu = subMenuRef.current;
    if (props.forceOpen || visible) {
      const wrapper = window.requestAnimationFrame || setTimeout;
      wrapper(() => {
        const styles = props.rtl ? getRTLMenuPosition() : getMenuPosition();
        if (subMenu) {
          subMenu.style.removeProperty("top");
          subMenu.style.removeProperty("bottom");
          subMenu.style.removeProperty("left");
          subMenu.style.removeProperty("right");

          if (hasOwnProp(styles, "top")) subMenu.style.top = styles.top;
          if (hasOwnProp(styles, "left")) subMenu.style.left = styles.left;
          if (hasOwnProp(styles, "bottom"))
            subMenu.style.bottom = styles.bottom;
          if (hasOwnProp(styles, "right")) subMenu.style.right = styles.right;
          subMenu.classList.add(cssClasses.menuVisible);
        }
        registerHandlers();
        setSelectedItem(null);
      });
    } else {
      const cleanup = () => {
        if (subMenu) {
          subMenu.removeEventListener("transitionend", cleanup);
          subMenu.style.removeProperty("bottom");
          subMenu.style.removeProperty("right");
          subMenu.style.top = "0";
          subMenu.style.left = "100%";
        }
        unregisterHandlers();
      };
      if (subMenu) {
        subMenu.addEventListener("transitionend", cleanup);
        subMenu.classList.remove(cssClasses.menuVisible);
      }
    }
  });

  return (
    <nav
      ref={menuRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cx(
        cssClasses.menuItem,
        cssClasses.subMenu,
        props.attributes?.listClassName
      )}
      style={{ position: "relative" }}
      role="menuitem"
      tabIndex={-1}
      aria-haspopup="true"
    >
      <div
        {...props.attributes}
        className={cx(cssClasses.menuItem, props.attributes?.className, {
          [cx(
            cssClasses.menuItemDisabled,
            props.attributes?.disabledClassName
          )]: props.disabled,
          [cx(cssClasses.menuItemActive, props.attributes?.visibleClassName)]:
            visible,
          [cx(
            cssClasses.menuItemSelected,
            props.attributes?.selectedClassName
          )]: props.selected,
        })}
        onMouseMove={props.onMouseMove}
        onMouseOut={props.onMouseOut}
        onClick={handleClick}
      >
        {props.title}
      </div>
      <nav
        ref={subMenuRef}
        style={{
          position: "absolute",
          transition: "opacity 1ms",
          top: 0,
          left: "100%",
        }}
        className={cx(cssClasses.menu, props.className)}
        role="menu"
        tabIndex={-1}
      >
        {renderChildren(props.children)}
      </nav>
    </nav>
  );
};
