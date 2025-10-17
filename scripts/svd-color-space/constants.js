export const CONFIG = {
  // Canvas and image dimensions
  IMAGE_SIZE: 100,
  CANVAS_SIZE: 200,
  U_CANVAS_SIZE: 120,

  // Complexity limits
  MAX_COLORS: 10,
  MAX_SHAPES: 10,

  // Animation and interaction
  ANIMATION_DURATION: 500,
  HOVER_THRESHOLD: 0, // Minimum RGB value to consider "contributing"

  // Base color palette
  COLORS: [
    [255, 0, 0], // Red
    [0, 255, 0], // Green
    [0, 0, 255], // Blue
    [255, 255, 0], // Yellow
    [255, 0, 255], // Magenta
    [0, 255, 255], // Cyan
    [255, 128, 0], // Orange
    [128, 0, 255], // Purple
    [255, 192, 203], // Pink
    [128, 255, 0], // Lime
  ],

  // Shape types
  SHAPE_TYPES: [
    "circle",
    "rectangle",
    "triangle",
    "diamond",
    "pentagon",
    "hexagon",
    "star",
    "ellipse",
    "cross",
    "heart",
  ],
};
