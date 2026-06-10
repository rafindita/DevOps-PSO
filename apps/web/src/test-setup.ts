import { GlobalRegistrator } from "@happy-dom/global-registrator";

// If using happy-dom (recommended for speed)
// GlobalRegistrator.register();

// Or if using jsdom (which is already in package.json)
import { JSDOM } from "jsdom";

const jsdom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost",
});

globalThis.window = jsdom.window as any;
globalThis.document = jsdom.window.document;
globalThis.navigator = jsdom.window.navigator;
globalThis.HTMLElement = jsdom.window.HTMLElement;
globalThis.Node = jsdom.window.Node;
globalThis.CustomEvent = jsdom.window.CustomEvent;
