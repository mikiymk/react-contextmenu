import React, { useEffect, useRef, useState } from "react";
import cx from "classnames";

import listener from "./globalEventListener";
import { useAbstractMenu } from "./AbstractMenu";
import { SubMenu } from "./SubMenu";
import { hideMenu } from "./actions";
import { cssClasses, callIfExists, store } from "./helpers";

type ContextMenuProps = {
  id: string;
  data?: any;
  className?: string;
  hideOnLeave?: boolean;
  rtl?: boolean;
  onHide?: { (event: any): void };
  onMouseLeave?: (
    event: React.MouseEvent<HTMLElement>,
    data: Object,
    target: HTMLElement
  ) => void;

  onShow?: { (event: any): void };
  preventHideOnContextMenu?: boolean;
  preventHideOnResize?: boolean;
  preventHideOnScroll?: boolean;
  style?: React.CSSProperties;

  children: React.ReactNode;
};

export const ContextMenu = (props: ContextMenuProps) => {
  const menuRef = useRef<HTMLElement | null>();
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const {
    handleKeyNavigation,
    setSelectedItem,
    setForceSubMenuOpen,
    renderChildren,
  } = useAbstractMenu({
    isVisible,
    hideMenu: (e: KeyboardEvent) => {
      if (e.keyCode === 27 || e.keyCode === 13) {
        // ECS or enter
        hideMenu();
      }
    },
  });

  const getSubMenuType = () => {
    // eslint-disable-line class-methods-use-this
    return SubMenu;
  };

  const inlineStyle = Object.assign({}, props.style, {
    position: "fixed",
    opacity: 0,
    pointerEvents: "none",
  });

  const menuClassnames = cx(cssClasses.menu, props.className, {
    [cssClasses.menuVisible]: isVisible,
  });

  const registerHandlers = () => {
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    if (!props.preventHideOnScroll)
      document.addEventListener("scroll", handleHide);
    if (!props.preventHideOnContextMenu)
      document.addEventListener("contextmenu", handleHide);
    document.addEventListener("keydown", handleKeyNavigation);
    if (!props.preventHideOnResize)
      window.addEventListener("resize", handleHide);
  };

  const unregisterHandlers = () => {
    document.removeEventListener("mousedown", handleOutsideClick);
    document.removeEventListener("touchstart", handleOutsideClick);
    document.removeEventListener("scroll", handleHide);
    document.removeEventListener("contextmenu", handleHide);
    document.removeEventListener("keydown", handleKeyNavigation);
    window.removeEventListener("resize", handleHide);
  };

  const handleShow = (e: CustomEvent) => {
    if (e.detail.id !== props.id || isVisible) return;

    const { x, y } = e.detail.position;

    setIsVisible(true);
    setX(x);
    setY(y);
    registerHandlers();
    callIfExists(props.onShow, e);
  };

  const handleHide = (
    e: (Event | React.UIEvent) & { detail?: { id: string } | number }
  ) => {
    if (
      isVisible &&
      (!e.detail ||
        typeof e.detail !== "object" ||
        !e.detail.id ||
        e.detail.id === props.id)
    ) {
      unregisterHandlers();
      setIsVisible(false);
      setSelectedItem(null);
      setForceSubMenuOpen(false);
      callIfExists(props.onHide, e);
    }
  };

  const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
    if (!menuRef.current?.contains(e.target as Node)) hideMenu();
  };

  const handleMouseLeave = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();

    callIfExists(
      props.onMouseLeave,
      event,
      Object.assign({}, props.data, store.data),
      store.target
    );

    if (props.hideOnLeave) hideMenu();
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLElement>) => {
    if (process.env.NODE_ENV === "production") {
      e.preventDefault();
    }
    handleHide(e);
  };

  const getMenuPosition = (x = 0, y = 0) => {
    let menuStyles = {
      top: y,
      left: x,
    };

    if (!menuRef.current) return menuStyles;

    const { innerWidth, innerHeight } = window;
    const rect = menuRef.current.getBoundingClientRect();

    if (y + rect.height > innerHeight) {
      menuStyles.top -= rect.height;
    }

    if (x + rect.width > innerWidth) {
      menuStyles.left -= rect.width;
    }

    if (menuStyles.top < 0) {
      menuStyles.top =
        rect.height < innerHeight ? (innerHeight - rect.height) / 2 : 0;
    }

    if (menuStyles.left < 0) {
      menuStyles.left =
        rect.width < innerWidth ? (innerWidth - rect.width) / 2 : 0;
    }

    return menuStyles;
  };

  const getRTLMenuPosition = (x = 0, y = 0) => {
    let menuStyles = {
      top: y,
      left: x,
    };

    if (!menuRef.current) return menuStyles;

    const { innerWidth, innerHeight } = window;
    const rect = menuRef.current.getBoundingClientRect();

    // Try to position the menu on the left side of the cursor
    menuStyles.left = x - rect.width;

    if (y + rect.height > innerHeight) {
      menuStyles.top -= rect.height;
    }

    if (menuStyles.left < 0) {
      menuStyles.left += rect.width;
    }

    if (menuStyles.top < 0) {
      menuStyles.top =
        rect.height < innerHeight ? (innerHeight - rect.height) / 2 : 0;
    }

    if (menuStyles.left + rect.width > innerWidth) {
      menuStyles.left =
        rect.width < innerWidth ? (innerWidth - rect.width) / 2 : 0;
    }

    return menuStyles;
  };

  const listenId = useRef<string>();
  useEffect(() => {
    listenId.current = listener.register(handleShow, handleHide);

    return () => {
      if (listenId.current) {
        listener.unregister(listenId.current);
      }
      unregisterHandlers();
    };
  }, []);

  useEffect(() => {
    const wrapper = window.requestAnimationFrame || setTimeout;
    if (isVisible) {
      wrapper(() => {
        const { top, left } = props.rtl
          ? getRTLMenuPosition(x, y)
          : getMenuPosition(x, y);

        wrapper(() => {
          if (!menuRef.current) return;
          menuRef.current.style.top = `${top}px`;
          menuRef.current.style.left = `${left}px`;
          menuRef.current.style.opacity = "1";
          menuRef.current.style.pointerEvents = "auto";
        });
      });
    } else {
      wrapper(() => {
        if (!menuRef.current) return;
        menuRef.current.style.opacity = "0";
        menuRef.current.style.pointerEvents = "none";
      });
    }
  });

  return (
    <nav
      role="menu"
      tabIndex={-1}
      ref={(ref) => {
        menuRef.current = ref;
      }}
      style={inlineStyle}
      className={menuClassnames}
      onContextMenu={handleContextMenu}
      onMouseLeave={handleMouseLeave}
    >
      {renderChildren(props.children)}
    </nav>
  );
};
