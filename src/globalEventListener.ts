import { MENU_SHOW, MENU_HIDE } from "./actions";
import { uniqueId, hasOwnProp, canUseDOM } from "./helpers";

class GlobalEventListener {
  private callbacks: {
    [id: string]: {
      show: (event: CustomEvent) => void;
      hide: (event: CustomEvent) => void;
    };
  };
  constructor() {
    this.callbacks = {};

    if (canUseDOM) {
      window.addEventListener(MENU_SHOW, this.handleShowEvent as any);
      window.addEventListener(MENU_HIDE, this.handleHideEvent as any);
    }
  }

  handleShowEvent = (event: CustomEvent) => {
    for (const id in this.callbacks) {
      if (hasOwnProp(this.callbacks, id)) this.callbacks[id].show(event);
    }
  };

  handleHideEvent = (event: CustomEvent) => {
    for (const id in this.callbacks) {
      if (hasOwnProp(this.callbacks, id)) this.callbacks[id].hide(event);
    }
  };

  register = (
    showCallback: (event: CustomEvent) => void,
    hideCallback: (event: CustomEvent) => void
  ) => {
    const id = uniqueId();

    this.callbacks[id] = {
      show: showCallback,
      hide: hideCallback,
    };

    return id;
  };

  unregister = (id: string) => {
    if (id && this.callbacks[id]) {
      delete this.callbacks[id];
    }
  };
}

export default new GlobalEventListener();
