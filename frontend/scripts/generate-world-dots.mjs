// One-off generator: samples a lat/lng grid against the real country
// polygons in src/data/globe.json and bakes the "land" points into
// src/data/worldDots.json as ready-to-render SVG coordinates.
//
// Run with: node scripts/generate-world-dots.mjs

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, "../src/data/globe.json");
const OUT_PATH = path.join(__dirname, "../src/data/worldDots.json");

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 500;
const LAT_MIN = -56; // trims Antarctica
const LAT_MAX = 78; // trims high Arctic
const STEP = 1.3; // degrees between candidate grid points

function project(lat, lng) {
  const x = ((lng + 180) / 360) * MAP_WIDTH;
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * MAP_HEIGHT;
  return [x, y];
}

function bboxOfRing(ring) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of ring) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY };
}

function pointInRing([px, py], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects =
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointInBbox([px, py], bbox) {
  return px >= bbox.minX && px <= bbox.maxX && py >= bbox.minY && py <= bbox.maxY;
}

// Flatten every feature into a list of { exterior, holes, bbox } polygons,
// handling both Polygon and MultiPolygon geometries.
function extractPolygons(features) {
  const polygons = [];

  for (const feature of features) {
    const { type, coordinates } = feature.geometry;
    const polys = type === "Polygon" ? [coordinates] : coordinates;

    for (const rings of polys) {
      const [exterior, ...holes] = rings;
      polygons.push({ exterior, holes, bbox: bboxOfRing(exterior) });
    }
  }

  return polygons;
}

function isLand(point, polygons) {
  for (const poly of polygons) {
    if (!pointInBbox(point, poly.bbox)) continue;
    if (!pointInRing(point, poly.exterior)) continue;
    if (poly.holes.some((hole) => pointInRing(point, hole))) continue;
    return true;
  }
  return false;
}

const geojson = JSON.parse(readFileSync(DATA_PATH, "utf8"));
const polygons = extractPolygons(geojson.features);

const dots = [];
for (let lat = LAT_MIN; lat <= LAT_MAX; lat += STEP) {
  for (let lng = -180; lng <= 180; lng += STEP) {
    if (isLand([lng, lat], polygons)) {
      const [x, y] = project(lat, lng);
      dots.push([Math.round(x * 10) / 10, Math.round(y * 10) / 10]);
    }
  }
}

writeFileSync(
  OUT_PATH,
  JSON.stringify({
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    latMin: LAT_MIN,
    latMax: LAT_MAX,
    dots,
  }),
);

console.log(`Generated ${dots.length} land dots -> ${OUT_PATH}`);
