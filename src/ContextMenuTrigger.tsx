import React, { Component, useRef } from "react";
import cx from "classnames";

import { showMenu, hideMenu } from "./actions";
import { callIfExists, cssClasses } from "./helpers";

export type ContextMenuTriggerProps = {
  id: string;
  attributes?: React.HTMLAttributes<any>;
  collect?: { (data: any): any };
  disable?: boolean;
  holdToDisplay?: number;
  renderTag?: React.ElementType;
  /** 0 is left click, 2 is right click */
  mouseButton?: number;
  disableIfShiftIsPressed?: boolean;
  [key: string]: any;

  children: React.ReactNode;
  posX?: number;
  posY?: number;
};

export const ContextMenuTrigger = (props: ContextMenuTriggerProps) => {
  const touchHandled = useRef(false);
  const mouseDownTimeoutId = useRef(0);
  const touchstartTimeoutId = useRef(0);

  const elemRef = useRef(null);

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    const holdToDisplay = props.holdToDisplay ?? 1000;
    if (holdToDisplay >= 0 && event.button === 0) {
      event.persist();
      event.stopPropagation();

      mouseDownTimeoutId.current = window.setTimeout(
        () => handleContextClick(event),
        holdToDisplay
      );
    }
    callIfExists(props.attributes?.onMouseDown, event);
  };

  const handleMouseUp = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button === 0) {
      clearTimeout(mouseDownTimeoutId.current);
    }
    callIfExists(props.attributes?.onMouseUp, event);
  };

  const handleMouseOut = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button === 0) {
      clearTimeout(mouseDownTimeoutId.current);
    }
    callIfExists(props.attributes?.onMouseOut, event);
  };

  const handleTouchstart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchHandled.current = false;
    const holdToDisplay = props.holdToDisplay ?? 1000;

    if (holdToDisplay >= 0) {
      event.persist();
      event.stopPropagation();

      touchstartTimeoutId.current = window.setTimeout(() => {
        handleContextClick(event);
        touchHandled.current = true;
      }, props.holdToDisplay);
    }
    callIfExists(props.attributes?.onTouchStart, event);
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchHandled) {
      event.preventDefault();
    }
    clearTimeout(touchstartTimeoutId.current);
    callIfExists(props.attributes?.onTouchEnd, event);
  };

  const handleContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button === (props.mouseButton ?? 2)) {
      handleContextClick(event);
    }
    callIfExists(props.attributes?.onContextMenu, event);
  };

  const handleMouseClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button === (props.mouseButton ?? 2)) {
      handleContextClick(event);
    }
    callIfExists(props.attributes?.onClick, event);
  };

  const handleContextClick = (
    event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    if (props.disable) return;
    if (props.disableIfShiftIsPressed && event.shiftKey) return;

    event.preventDefault();
    event.stopPropagation();

    let [x, y] =
      "clientX" in event
        ? [event.clientX, event.clientY]
        : event.touches
        ? [event.touches[0].pageX, event.touches[0].pageY]
        : [0, 0];

    if (props.posX) {
      x -= props.posX;
    }
    if (props.posY) {
      y -= props.posY;
    }

    hideMenu();

    let data = callIfExists(props.collect, props);
    let showMenuConfig: {
      position: {
        x: number;
        y: number;
      };
      target: null;
      id: string;
      data?: any;
    } = {
      position: { x, y },
      target: elemRef.current,
      id: props.id,
    };
    if (data && data instanceof Promise) {
      // it's promise
      data.then((resp) => {
        showMenuConfig.data = Object.assign({}, resp, {
          target: event.target,
        });
        showMenu(showMenuConfig);
      });
    } else {
      showMenuConfig.data = Object.assign({}, data, {
        target: event.target,
      });
      showMenu(showMenuConfig);
    }
  };

  return (
    <div
      {...props.attributes}
      className={cx(cssClasses.menuWrapper, props.attributes?.className)}
      onContextMenu={handleContextMenu}
      onClick={handleMouseClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchstart}
      onTouchEnd={handleTouchEnd}
      onMouseOut={handleMouseOut}
      ref={elemRef}
    >
      {props.children}
    </div>
  );
};
