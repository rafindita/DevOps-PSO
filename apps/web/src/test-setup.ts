// If using happy-dom (recommended for speed)
// GlobalRegistrator.register();

// Or if using jsdom (which is already in package.json)
import { JSDOM } from "jsdom";

const jsdom = new JSDOM("<!doctype html><html><body></body></html>", {
	url: "http://localhost",
});

// biome-ignore lint/suspicious/noExplicitAny: JSDOM window needs to be cast to any for globalThis
(globalThis as any).window = jsdom.window;
globalThis.document = jsdom.window.document;
globalThis.navigator = jsdom.window.navigator;
globalThis.HTMLElement = jsdom.window.HTMLElement;
globalThis.Node = jsdom.window.Node;
globalThis.CustomEvent = jsdom.window.CustomEvent;
globalThis.Element = jsdom.window.Element;
globalThis.requestAnimationFrame = (callback) => setTimeout(callback, 0);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
globalThis.getComputedStyle = jsdom.window.getComputedStyle;

if (!globalThis.PointerEvent) {
	globalThis.PointerEvent = class PointerEvent extends jsdom.window
		.MouseEvent {} as unknown as typeof window.PointerEvent;
}
