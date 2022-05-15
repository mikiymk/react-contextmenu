import React, { Component, useRef, useState } from "react";
import PropTypes from "prop-types";

import { MenuItem } from "./MenuItem";
import { SubMenu } from "./SubMenu";

type UseAbstractMenuProps = {
  isVisible?: boolean;
  hideMenu: (event: KeyboardEvent) => void;
};

export const useAbstractMenu = (props: UseAbstractMenuProps) => {
  const seletedItemRef = useRef<HTMLElement | null>(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [forceSubMenuOpen, setForceSubMenuOpen] = useState(false);

  const handleKeyNavigation = (e: KeyboardEvent) => {
    // check for isVisible strictly here as it might be undefined when this code executes in the context of SubMenu
    // but we only need to check when it runs in the ContextMenu context
    if (props.isVisible === false) {
      return;
    }

    switch (e.keyCode) {
      case 37: // left arrow
      case 27: // escape
        e.preventDefault();
        props.hideMenu(e);
        break;
      case 38: // up arrow
        e.preventDefault();
        selectChildren(true);
        break;
      case 40: // down arrow
        e.preventDefault();
        selectChildren(false);
        break;
      case 39: // right arrow
        tryToOpenSubMenu(e);
        break;
      case 13: // enter
        e.preventDefault();
        tryToOpenSubMenu(e);
        {
          // determine the selected item is disabled or not
          const disabled =
            seletedItemRef.current &&
            seletedItemRef.current.props &&
            seletedItemRef.current.props.disabled;

          if (
            seletedItemRef.current &&
            seletedItemRef.current.ref instanceof HTMLElement &&
            !disabled
          ) {
            seletedItemRef.current.ref.click();
          } else {
            props.hideMenu(e);
          }
        }
        break;
      default:
      // do nothing
    }
  };

  const handleForceClose = () => {
    setForceSubMenuOpen(false);
  };

  const tryToOpenSubMenu = (e) => {
    if (selectedItem && selectedItem.type === SubMenu) {
      e.preventDefault();
      setForceSubMenuOpen(true);
    }
  };

  const selectChildren = (forward) => {
    const children: React.ReactNode[] = [];
    let disabledChildrenCount = 0;
    let disabledChildIndexes = {};

    const childCollector = (child: React.ReactNode, index: number) => {
      // child can be empty in case you do conditional rendering of components, in which
      // case it should not be accounted for as a real child
      if (!child) {
        return;
      }

      if ([MenuItem, SubMenu].indexOf(child.type) < 0) {
        // Maybe the MenuItem or SubMenu is capsuled in a wrapper div or something else
        React.Children.forEach(child.props.children, childCollector);
      } else if (!child.props.divider) {
        if (child.props.disabled) {
          ++disabledChildrenCount;
          disabledChildIndexes[index] = true;
        }

        children.push(child);
      }
    };

    React.Children.forEach(props.children, childCollector);
    if (disabledChildrenCount === children.length) {
      // All menu items are disabled, so none can be selected, don't do anything
      return;
    }

    function findNextEnabledChildIndex(currentIndex) {
      let i = currentIndex;
      let incrementCounter = () => {
        if (forward) {
          --i;
        } else {
          ++i;
        }

        if (i < 0) {
          i = children.length - 1;
        } else if (i >= children.length) {
          i = 0;
        }
      };

      do {
        incrementCounter();
      } while (i !== currentIndex && disabledChildIndexes[i]);

      return i === currentIndex ? null : i;
    }

    const currentIndex = children.indexOf(selectedItem);
    const nextEnabledChildIndex = findNextEnabledChildIndex(currentIndex);

    if (nextEnabledChildIndex !== null) {
      setSelectedItem(children[nextEnabledChildIndex]);
      setForceSubMenuOpen(false);
    }
  };

  const onChildMouseMove = (child) => {
    if (selectedItem !== child) {
      setSelectedItem(child);
      setForceSubMenuOpen(false);
    }
  };

  const onChildMouseLeave = () => {
    setSelectedItem(null);
    setForceSubMenuOpen(false);
  };

  const renderChildren = (children: React.ReactNode) =>
    React.Children.map(children, (child) => {
      const props = {};
      if (!React.isValidElement(child)) return child;
      if ([MenuItem, SubMenu].indexOf(child.type) < 0) {
        // Maybe the MenuItem or SubMenu is capsuled in a wrapper div or something else
        props.children = renderChildren(child.props.children);
        return React.cloneElement(child, props);
      }
      props.onMouseLeave = onChildMouseLeave.bind(this);
      if (child.type === SubMenu) {
        // special props for SubMenu only
        props.forceOpen = forceSubMenuOpen && selectedItem === child;
        props.forceClose = handleForceClose;
        props.parentKeyNavigationHandler = handleKeyNavigation;
      }
      if (!child.props.divider && selectedItem === child) {
        // special props for selected item only
        props.selected = true;
        props.ref = (ref) => {
          seletedItemRef.current = ref;
        };
        return React.cloneElement(child, props);
      }
      // onMouseMove is only needed for non selected items
      props.onMouseMove = () => onChildMouseMove(child);
      return React.cloneElement(child, props);
    });

  return {
    selectedItem,
    setSelectedItem,
    forceSubMenuOpen,
    setForceSubMenuOpen,
    handleKeyNavigation,
    renderChildren,
  };
};
