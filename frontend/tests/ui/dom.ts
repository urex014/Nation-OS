import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
  url: "http://127.0.0.1:4173/",
  pretendToBeVisual: true,
});

const { window } = dom;

function expose(key: string, value: unknown) {
  Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
}

expose("window", window);
expose("self", window);
expose("document", window.document);
expose("navigator", window.navigator);
expose("HTMLElement", window.HTMLElement);
expose("Element", window.Element);
expose("Node", window.Node);
expose("DocumentFragment", window.DocumentFragment);
expose("MutationObserver", window.MutationObserver);
expose("getComputedStyle", window.getComputedStyle.bind(window));
expose("IS_REACT_ACT_ENVIRONMENT", true);
expose("requestAnimationFrame", (callback: FrameRequestCallback) =>
  window.setTimeout(() => callback(Date.now()), 0),
);
