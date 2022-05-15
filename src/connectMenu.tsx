import React, { Component, useEffect, useRef, useState } from "react";

import { ContextMenuTrigger } from "./ContextMenuTrigger";
import listener from "./globalEventListener";

// collect ContextMenuTrigger's expected props to NOT pass them on as part of the context
const ignoredTriggerProps = [
  "id",
  "children",
  "attributes",
  "collect",
  "disable",
  "holdToDisplay",
  "posX",
  "posY",
  "renderTag",
  "mouseButton",
  "disableIfShiftIsPressed",
  "children",
];

type ConnectMenuProps = {
  id: string;
  trigger: any;
};

// expect the id of the menu to be responsible for as outer parameter
export const connectMenu = <P,>(menuId: string) => {
  // expect menu component to connect as inner parameter
  // <Child/> is presumably a wrapper of <ContextMenu/>
  return function connect(Child: React.ComponentType<P & ConnectMenuProps>) {
    // return wrapper for <Child/> that forwards the ContextMenuTrigger's additional props
    return (props: P) => {
      const [trigger, setTrigger] = useState(null);
      const handleShow = (e: CustomEvent) => {
        if (e.detail.id !== menuId) return;

        // the onShow event's detail.data object holds all ContextMenuTrigger props
        const { data } = e.detail;
        const filteredData: typeof data = {};

        for (const key in data) {
          // exclude props the ContextMenuTrigger is expecting itself
          if (!ignoredTriggerProps.includes(key)) {
            filteredData[key] = data[key];
          }
        }
        setTrigger(filteredData);
      };

      const handleHide = () => {
        setTrigger(null);
      };

      const listenId = useRef<string>();
      useEffect(() => {
        listenId.current = listener.register(handleShow, handleHide);

        return () => {
          if (listenId.current) {
            listener.unregister(listenId.current);
          }
        };
      }, []);

      return <Child {...props} id={menuId} trigger={trigger} />;
    };
  };
};
