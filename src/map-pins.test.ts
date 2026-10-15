import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { featureFilter } from "@maplibre/maplibre-gl-style-spec";

type PinButton = {
  tag: string;
  className: string;
  dataset: Record<string, string>;
  attrs: Record<string, string>;
  children: SvgNode[];
};

type SvgNode = {
  tag: string;
  attrs: Record<string, string>;
  textContent?: string;
  children: SvgNode[];
};

function installDocument() {
  function node(tag: string): SvgNode & { setAttribute: (k: string, v: string) => void; append: (...kids: SvgNode[]) => void; textContent: string } {
    const el: SvgNode & { setAttribute: (k: string, v: string) => void; append: (...kids: SvgNode[]) => void; textContent: string } = {
      tag,
      attrs: {},
      children: [],
      textContent: "",
      setAttribute(k, v) {
        this.attrs[k] = String(v);
      },
      append(...kids) {
        this.children.push(...kids);
      },
    };
    return el;
  }
  globalThis.document = {
    createElement(tag: string) {
      const el = node(tag) as unknown as SvgNode & {
        setAttribute: (k: string, v: string) => void;
        append: (...kids: SvgNode[]) => void;
        className: string;
        dataset: Record<string, string>;
      };
      el.className = "";
      el.dataset = {};
      return el;
    },
    createElementNS(_ns: string, tag: string) {
      return node(tag);
    },
  } as unknown as Document;
}

function walk(n: SvgNode, out: SvgNode[] = []) {
  out.push(n);
  for (const c of n.children || []) walk(c, out);
  return out;
}

const href = new URL("../public/map-pins.js", import.meta.url).href;
const { pinElement, namesLayer, wingsLayer } = await import(href);

describe("map pins", () => {
  it("builds a 44px teardrop button with a kind icon and gold for selected or destination", () => {
    installDocument();
    const gate = pinElement({ kind: "gate", label: "Main gate" }) as unknown as PinButton;
    assert.equal(gate.tag, "button");
    assert.equal(gate.attrs.type, "button");
    assert.equal(gate.className, "opin");
    assert.equal(gate.dataset.kind, "gate");
    assert.equal(gate.dataset.state, undefined);
    assert.equal(gate.attrs["aria-label"], "Main gate");
    const parts = walk(gate.children[0]);
    assert.equal(parts.find((n) => n.attrs.class === "opin-fill")?.tag, "path");
    assert.equal(parts.find((n) => n.attrs.class === "opin-ring")?.attrs.fill, undefined);
    assert.equal(parts.find((n) => n.tag === "path" && n.attrs.stroke === "#8B0000")?.attrs.d.includes("M3 14.5V6.5"), true);
    assert.equal(gate.children[0].attrs.width, "44");
    assert.equal(gate.children[0].attrs.height, "44");

    for (const kind of ["room", "stairs", "gate", "entrance", "cr"]) {
      const pin = pinElement({ kind }) as unknown as PinButton;
      const nodes = walk(pin.children[0]);
      assert.ok(nodes.some((n) => n.tag === "path" || n.tag === "text"));
      assert.equal(pin.dataset.kind, kind);
    }
    const cr = pinElement({ kind: "cr" }) as unknown as PinButton;
    assert.equal(walk(cr.children[0]).find((n) => n.tag === "text")?.textContent, "CR");

    const selected = pinElement({ kind: "room", state: "selected" }) as unknown as PinButton;
    const destination = pinElement({ kind: "stairs", state: "destination" }) as unknown as PinButton;
    assert.equal(selected.dataset.state, "selected");
    assert.equal(destination.dataset.state, "destination");
    const plain = pinElement({ kind: "entrance", state: "other" }) as unknown as PinButton;
    assert.equal(plain.dataset.state, undefined);
    const unknown = pinElement({ kind: "library" }) as unknown as PinButton;
    assert.equal(unknown.dataset.kind, undefined);
    assert.equal(unknown.attrs["aria-label"], "Pin");
    assert.equal(walk(unknown.children[0]).some((n) => n.attrs.stroke === "#8B0000"), false);
  });

  it("hides names that contain ? and steps label size with a halo and padding", () => {
    const names = featureFilter(namesLayer.filter).filter;
    const wings = featureFilter(wingsLayer.filter).filter;
    const feat = (name: string | null) => ({ type: "Point" as const, properties: { name } });
    const globals = { zoom: 16 };
    for (const pass of [names, wings]) {
      assert.equal(pass(globals, feat("PUP Main Building")), true);
      assert.equal(pass(globals, feat("South Wing")), true);
      assert.equal(pass(globals, feat("North?")), false);
      assert.equal(pass(globals, feat("?")), false);
      assert.equal(pass(globals, feat(null)), false);
    }
    assert.equal(namesLayer.layout["text-size"][0], "step");
    assert.deepEqual(namesLayer.layout["text-size"][1], ["zoom"]);
    assert.equal(namesLayer.layout["text-anchor"], "top");
    assert.deepEqual(namesLayer.layout["text-offset"], [0, 0.8]);
    assert.equal(namesLayer.layout["text-padding"], 10);
    assert.equal(namesLayer.paint["text-halo-color"], "#ffffff");
    assert.equal(namesLayer.paint["text-halo-width"], 3);
    assert.equal(wingsLayer.layout["text-size"][0], "step");
    assert.equal(wingsLayer.layout["text-padding"], 16);
    assert.equal(wingsLayer.paint["text-halo-color"], "#ffffff");
    assert.equal(wingsLayer.paint["text-halo-width"], 2);
    assert.deepEqual(wingsLayer.layout["text-field"], ["upcase", ["get", "name"]]);
  });

  it("keeps the 44px target, maroon and gold fills, and the focus ring", () => {
    const css = readFileSync(new URL("../public/map.css", import.meta.url), "utf8");
    assert.match(css, /\.opin \{[^}]*width: 44px; height: 44px/);
    assert.match(css, /\.opin-fill \{ fill: #8B0000; stroke: #fff/);
    assert.match(css, /\.opin\[data-state="selected"\] \.opin-fill,\s*\.opin\[data-state="destination"\] \.opin-fill \{ fill: #FFC72C; \}/);
    assert.match(css, /\.opin:focus-visible \{ outline: 3px solid var\(--maroon-deep\); outline-offset: 2px; \}/);
    const html = readFileSync(new URL("../public/map.html", import.meta.url), "utf8");
    assert.equal(html.match(/map-pins\.js/g)?.length, 1);
  });
});
