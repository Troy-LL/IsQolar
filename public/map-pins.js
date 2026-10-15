const SVG_NS = "http://www.w3.org/2000/svg";

const KIND_LABEL = {
  room: "Room",
  stairs: "Stairs",
  gate: "Gate",
  entrance: "Entrance",
  cr: "Comfort room",
};

const KIND_PATH = {
  room: "M3.5 14.5V3.5h9v11M8 14.5V9",
  stairs: "M2 13h4V9h4V5h4",
  gate: "M3 14.5V6.5M13 14.5V6.5M3 6.5C3 2.5 13 2.5 13 6.5",
  entrance: "M2 8h7M6.2 4.8 10 8 6.2 11.2M12 3.5v9",
};

function hiddenName() {
  return [
    "all",
    ["!=", ["get", "name"], null],
    ["!", ["in", "?", ["to-string", ["coalesce", ["get", "name"], ""]]]],
  ];
}

function svgEl(tag, attrs, text) {
  const n = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  if (text !== undefined) n.textContent = text;
  return n;
}

function kindIcon(kind) {
  const icon = svgEl("svg", {
    class: "opin-ico",
    x: "14.5",
    y: "10.5",
    width: "15",
    height: "15",
    viewBox: "0 0 16 16",
    "aria-hidden": "true",
  });
  if (kind === "cr") {
    icon.append(svgEl("text", {
      x: "8",
      y: "11.2",
      "text-anchor": "middle",
      "font-size": "7.5",
      "font-weight": "700",
      "font-family": "system-ui, sans-serif",
      fill: "#8B0000",
    }, "CR"));
    return icon;
  }
  const d = KIND_PATH[kind];
  if (!d) return null;
  icon.append(svgEl("path", {
    d,
    fill: "none",
    stroke: "#8B0000",
    "stroke-width": "1.7",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  }));
  return icon;
}

export function pinElement({ kind, state, label } = {}) {
  const known = Object.hasOwn(KIND_LABEL, kind);
  const btn = document.createElement("button");
  btn.setAttribute("type", "button");
  btn.className = "opin";
  if (known) btn.dataset.kind = kind;
  if (state === "selected" || state === "destination") btn.dataset.state = state;
  btn.setAttribute("aria-label", label || (known ? KIND_LABEL[kind] : "Pin"));
  const svg = svgEl("svg", { viewBox: "0 0 44 44", width: "44", height: "44", "aria-hidden": "true" });
  svg.append(svgEl("path", {
    class: "opin-fill",
    d: "M22 40c0 0-13-12.2-13-22a13 13 0 1 1 26 0c0 9.8-13 22-13 22z",
  }));
  svg.append(svgEl("circle", { class: "opin-ring", cx: "22", cy: "18", r: "8.25" }));
  const icon = known ? kindIcon(kind) : null;
  if (icon) svg.append(icon);
  btn.append(svg);
  return btn;
}

export const namesLayer = {
  filter: hiddenName(),
  layout: {
    "text-field": ["get", "name"],
    "text-font": ["Noto Sans Bold"],
    "text-anchor": "top",
    "text-offset": [0, 0.8],
    "text-size": [
      "step",
      ["zoom"],
      ["case", ["get", "main"], 14, 11],
      17,
      ["case", ["get", "main"], 16, 13],
      18.5,
      ["case", ["get", "main"], 18, 15],
    ],
    "text-max-width": 8,
    "text-padding": 10,
    "text-allow-overlap": false,
    "symbol-z-order": "source",
  },
  paint: {
    "text-color": ["case", ["get", "main"], "#5c0000", "#1f1a1a"],
    "text-halo-color": "#ffffff",
    "text-halo-width": 3,
    "text-halo-blur": 0,
  },
};

export const wingsLayer = {
  filter: hiddenName(),
  layout: {
    "text-field": ["upcase", ["get", "name"]],
    "text-font": ["Noto Sans Bold"],
    "text-letter-spacing": 0.08,
    "text-size": ["step", ["zoom"], 11, 18.4, 13, 19.4, 15],
    "text-padding": 16,
    "text-allow-overlap": false,
  },
  paint: {
    "text-color": "#6B5E57",
    "text-halo-color": "#ffffff",
    "text-halo-width": 2,
    "text-halo-blur": 0,
  },
};
