import Vue from "vue";
import { EventEmitter } from 'events';

import {makeStore} from './store';
import Game from './components/Game.vue';

function launch(selector: string) {
  const store = makeStore();

  const app = new Vue({
    store,
    render: (h) => h(Game),
  }).$mount(selector);

  const item = new EventEmitter();

  item.addListener("state:updated", data => store.dispatch("gaiaViewer/externalData", data));

  const unsub1 = store.subscribeAction(({type, payload}) => {
    console.log("spy action", type, payload);

    if (type === "gaiaViewer/move") {
      item.emit("move", payload);
    }
  });

  const unsub2 = store.subscribe(({type, payload}) => {
    console.log("spy mutation", type, payload);

    if (type == "info" || type == "error") {
      item.emit(type, payload);
    }
  });

  app.$once("hook:beforeDestroy", () => {
    unsub1();
    unsub2();
  });

  return item;
}

export default launch;