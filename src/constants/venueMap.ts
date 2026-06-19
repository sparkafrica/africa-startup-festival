/** ATE26 venue floor plan — bundled asset + optional web fallback. */
export const VENUE_FLOOR_PLAN_IMAGE = require("../assets/images/ATE26-Floor-Plan.png");

/** Portrait floor plan aspect (height / width). Source: 1190×2114 PNG. */
export const VENUE_FLOOR_PLAN_ASPECT = 2114 / 1190;

export const VENUE_MAP_WEB_URL = "https://africatechnologyexpo.com/floor-plan";

export const VENUE_MAP_INTRO =
  "Pinch to zoom and drag to explore. Rotate your phone for more room on the map.";

/** Logical size at 1× scale (full screen width) and scale to fit inside a viewport. */
export function getVenueFloorPlanFit(
  viewportWidth: number,
  viewportHeight: number
): {
  width: number;
  height: number;
  fitScale: number;
  minScale: number;
  maxScale: number;
} {
  const width = viewportWidth;
  const height = width * VENUE_FLOOR_PLAN_ASPECT;
  const fitScale = Math.min(1, viewportHeight / height);
  return {
    width,
    height,
    fitScale,
    minScale: fitScale * 0.55,
    maxScale: fitScale * 5,
  };
}
