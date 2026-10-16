import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { planRoute, planCampusRoute, type Paths, type Stairs, type Floor, type Campus, type Point } from "../public/route.js";

const paths = JSON.parse(readFileSync("data/paths.json", "utf8")) as Paths;
const stairs = JSON.parse(readFileSync("data/stairs.json", "utf8")) as Stairs;
const floors = JSON.parse(readFileSync("data/floors.json", "utf8")) as Floor[];
const campus = JSON.parse(readFileSync("data/campus-osm.json", "utf8")) as Campus;

const lobby = { floorId: "main-1f-lobby", node: "start" };

interface LockedLeg {
  floorId: string;
  points: Point[];
}

interface LockedRoute {
  steps: string[];
  legs: LockedLeg[];
}

function shape(route: { steps: { text: string }[]; legs: { floorId: string; points: Point[] }[] }): LockedRoute {
  return {
    steps: route.steps.map((step) => step.text),
    legs: route.legs.map((leg) => ({
      floorId: leg.floorId,
      points: leg.points.map((point) => ({ x: point.x, y: point.y })),
    })),
  };
}

const locked: { oneFloor: LockedRoute; floorChange: LockedRoute; outdoors: LockedRoute } = {
  "oneFloor": {
    "steps": [
      "Walk to N519"
    ],
    "legs": [
      {
        "floorId": "main-5f",
        "points": [
          {
            "x": 0.39963,
            "y": 0.51973
          },
          {
            "x": 0.39893,
            "y": 0.51883
          },
          {
            "x": 0.423,
            "y": 0.4705
          },
          {
            "x": 0.45798,
            "y": 0.47235
          },
          {
            "x": 0.47184,
            "y": 0.47308
          },
          {
            "x": 0.50457,
            "y": 0.47481
          },
          {
            "x": 0.5373,
            "y": 0.47654
          },
          {
            "x": 0.57003,
            "y": 0.47827
          },
          {
            "x": 0.60276,
            "y": 0.48
          },
          {
            "x": 0.61557,
            "y": 0.48067
          },
          {
            "x": 0.63549,
            "y": 0.48172
          },
          {
            "x": 0.66822,
            "y": 0.48345
          },
          {
            "x": 0.70095,
            "y": 0.48518
          },
          {
            "x": 0.73368,
            "y": 0.48691
          },
          {
            "x": 0.76641,
            "y": 0.4886400000000001
          },
          {
            "x": 0.76603,
            "y": 0.50527
          }
        ]
      }
    ]
  },
  "floorChange": {
    "steps": [
      "Walk to the East wing stairs by the dome",
      "Go up to 4F",
      "Walk to N412"
    ],
    "legs": [
      {
        "floorId": "main-1f-lobby",
        "points": [
          {
            "x": 0.38721,
            "y": 0.51016
          },
          {
            "x": 0.39410946119213197,
            "y": 0.5186210810919158
          },
          {
            "x": 0.38791,
            "y": 0.53106
          }
        ]
      },
      {
        "floorId": "main-4f",
        "points": [
          {
            "x": 0.4864,
            "y": 0.42823
          },
          {
            "x": 0.516,
            "y": 0.444
          },
          {
            "x": 0.516,
            "y": 0.469
          },
          {
            "x": 0.516,
            "y": 0.49528
          },
          {
            "x": 0.516,
            "y": 0.51983
          },
          {
            "x": 0.516,
            "y": 0.54439
          },
          {
            "x": 0.516,
            "y": 0.56894
          },
          {
            "x": 0.516,
            "y": 0.5935
          },
          {
            "x": 0.516,
            "y": 0.61806
          },
          {
            "x": 0.53045,
            "y": 0.61806
          }
        ]
      }
    ]
  },
  "outdoors": {
    "steps": [
      "Walk from the main gate to the East Wing entrance (265 m)",
      "Enter the lobby (1F)",
      "Walk to the East wing stairs by the dome",
      "Go up to 4F",
      "Walk to N412"
    ],
    "legs": [
      {
        "floorId": "outdoor",
        "points": [
          {
            "x": 121.011884,
            "y": 14.5991055
          },
          {
            "x": 121.0118157,
            "y": 14.5990422
          },
          {
            "x": 121.011715,
            "y": 14.5989489
          },
          {
            "x": 121.0116211,
            "y": 14.598862
          },
          {
            "x": 121.0115466,
            "y": 14.5987924
          },
          {
            "x": 121.0114652,
            "y": 14.5987177
          },
          {
            "x": 121.0114809,
            "y": 14.5987022
          },
          {
            "x": 121.0114854,
            "y": 14.5986786
          },
          {
            "x": 121.0114783,
            "y": 14.5986387
          },
          {
            "x": 121.011323,
            "y": 14.5982167
          },
          {
            "x": 121.0113359,
            "y": 14.5978845
          },
          {
            "x": 121.0113837,
            "y": 14.5977764
          },
          {
            "x": 121.0111861,
            "y": 14.5976865
          },
          {
            "x": 121.0111087,
            "y": 14.5976575
          },
          {
            "x": 121.0109763,
            "y": 14.5971235
          },
          {
            "x": 121.0109702,
            "y": 14.597125
          }
        ]
      },
      {
        "floorId": "main-1f-lobby",
        "points": [
          {
            "x": 0.38721,
            "y": 0.51016
          },
          {
            "x": 0.39410946119213197,
            "y": 0.5186210810919158
          },
          {
            "x": 0.38791,
            "y": 0.53106
          }
        ]
      },
      {
        "floorId": "main-4f",
        "points": [
          {
            "x": 0.4864,
            "y": 0.42823
          },
          {
            "x": 0.516,
            "y": 0.444
          },
          {
            "x": 0.516,
            "y": 0.469
          },
          {
            "x": 0.516,
            "y": 0.49528
          },
          {
            "x": 0.516,
            "y": 0.51983
          },
          {
            "x": 0.516,
            "y": 0.54439
          },
          {
            "x": 0.516,
            "y": 0.56894
          },
          {
            "x": 0.516,
            "y": 0.5935
          },
          {
            "x": 0.516,
            "y": 0.61806
          },
          {
            "x": 0.53045,
            "y": 0.61806
          }
        ]
      }
    ]
  }
};

describe("route regression", () => {
  it("locks a route on one floor", () => {
    const route = planRoute(paths, stairs, floors, { floorId: "main-5f", node: "start" }, "main-5f-n519");
    assert.equal(route.ok, true);
    if (!route.ok) return;
    assert.deepEqual(shape(route), locked.oneFloor);
  });

  it("locks a floor change from the lobby to 4F", () => {
    const route = planRoute(paths, stairs, floors, lobby, "main-4f-north-412");
    assert.equal(route.ok, true);
    if (!route.ok) return;
    assert.deepEqual(shape(route), locked.floorChange);
  });

  it("locks the outdoor walk from the main gate to a room", () => {
    const route = planCampusRoute(paths, stairs, floors, campus, "main-4f-north-412");
    assert.equal(route.ok, true);
    if (!route.ok) return;
    assert.deepEqual(shape(route), locked.outdoors);
  });
});
