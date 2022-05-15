declare module "react-contextmenu" {
  import * as React from "react";

  export interface SubMenuProps {
    title: React.ReactElement<any> | React.ReactText;
    className?: string;
    disabled?: boolean;
    hoverDelay?: number;
    rtl?: boolean;
    preventCloseOnClick?: boolean;
    onClick?:
      | {
          (
            event:
              | React.TouchEvent<HTMLDivElement>
              | React.MouseEvent<HTMLDivElement>,
            data: Object,
            target: HTMLElement
          ): void;
        }
      | Function;
  }

  export const SubMenu: React.ComponentClass<SubMenuProps>;
}
