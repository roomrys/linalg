import { CONFIG } from "./constants.js";

export class ImageGenerator {
  constructor() {
    this.imageSize = CONFIG.IMAGE_SIZE;
  }

  generateComplexImage(colorComplexity, shapeComplexity, fixedShapes) {
    // Initialize image with background
    const imageData = new Array(this.imageSize);
    for (let i = 0; i < this.imageSize; i++) {
      imageData[i] = new Array(this.imageSize);
      for (let j = 0; j < this.imageSize; j++) {
        imageData[i][j] = [0, 0, 0]; // Black background
      }
    }

    // Generate color palette based on complexity
    const colors = this.getColorPalette(colorComplexity);

    // Use fixed shapes but apply current colors
    const shapesToDraw = this.assignColorsToFixedShapes(
      fixedShapes,
      colors,
      shapeComplexity
    );

    // Draw shapes to the image
    this.drawShapes(imageData, shapesToDraw);

    return imageData;
  }

  getColorPalette(complexity) {
    const baseColors = CONFIG.COLORS;

    return baseColors.slice(0, Math.min(complexity, baseColors.length));
  }

  assignColorsToFixedShapes(shapes, colors, shapeComplexity) {
    // Take only the number of shapes we want based on current complexity
    const activeShapes = shapes.slice(
      0,
      Math.min(shapeComplexity, shapes.length)
    );

    // Always reassign colors cyclically to ensure color changes are reflected
    // This ensures that when color complexity changes, all shapes get new color assignments
    return activeShapes.map((shape, index) => {
      const assignedColor =
        colors.length > 0 ? colors[index % colors.length] : [255, 255, 255];
      return {
        ...shape,
        color: assignedColor,
      };
    });
  }

  generateShapes() {
    const shapes = [];
    const shapeTypes = CONFIG.SHAPE_TYPES;

    // Generate up to 10 shapes with fixed positions but no colors yet
    for (let i = 0; i < CONFIG.MAX_SHAPES; i++) {
      // Always generate 10 potential shapes
      const shapeType = shapeTypes[i % shapeTypes.length];

      shapes.push({
        type: shapeType,
        color: null, // Color will be assigned later
        x: Math.floor(Math.random() * (this.imageSize - 40)) + 20,
        y: Math.floor(Math.random() * (this.imageSize - 40)) + 20,
        size: Math.floor(Math.random() * 20) + 15,
        rotation: Math.random() * 2 * Math.PI,
      });
    }

    return shapes;
  }

  drawShapes(imageData, shapes) {
    shapes.forEach((shape) => {
      switch (shape.type) {
        case "circle":
          this.drawCircle(imageData, shape.x, shape.y, shape.size, shape.color);
          break;
        case "rectangle":
          this.drawRectangle(
            imageData,
            shape.x,
            shape.y,
            shape.size,
            shape.size,
            shape.color
          );
          break;
        case "triangle":
          this.drawTriangle(
            imageData,
            shape.x,
            shape.y,
            shape.size,
            shape.color
          );
          break;
        case "diamond":
          this.drawDiamond(
            imageData,
            shape.x,
            shape.y,
            shape.size,
            shape.color
          );
          break;
        case "pentagon":
          this.drawPolygon(
            imageData,
            shape.x,
            shape.y,
            shape.size,
            5,
            shape.color,
            shape.rotation
          );
          break;
        case "hexagon":
          this.drawPolygon(
            imageData,
            shape.x,
            shape.y,
            shape.size,
            6,
            shape.color,
            shape.rotation
          );
          break;
        case "star":
          this.drawStar(imageData, shape.x, shape.y, shape.size, shape.color);
          break;
        case "ellipse":
          this.drawEllipse(
            imageData,
            shape.x,
            shape.y,
            shape.size,
            shape.size * 0.7,
            shape.color
          );
          break;
        case "cross":
          this.drawCross(imageData, shape.x, shape.y, shape.size, shape.color);
          break;
        case "heart":
          this.drawHeart(imageData, shape.x, shape.y, shape.size, shape.color);
          break;
      }
    });
  }
  drawCircle(imageData, cx, cy, radius, color) {
    for (let i = 0; i < this.imageSize; i++) {
      for (let j = 0; j < this.imageSize; j++) {
        const dist = Math.sqrt((i - cy) ** 2 + (j - cx) ** 2);
        if (dist <= radius) {
          imageData[i][j] = color;
        }
      }
    }
  }

  drawRectangle(imageData, x, y, width, height, color) {
    for (
      let i = Math.max(0, Math.floor(y));
      i < Math.min(this.imageSize, Math.ceil(y + height));
      i++
    ) {
      for (
        let j = Math.max(0, Math.floor(x));
        j < Math.min(this.imageSize, Math.ceil(x + width));
        j++
      ) {
        if (i >= 0 && i < this.imageSize && j >= 0 && j < this.imageSize) {
          imageData[i][j] = color;
        }
      }
    }
  }

  drawTriangle(imageData, cx, cy, size, color) {
    for (let i = 0; i < this.imageSize; i++) {
      for (let j = 0; j < this.imageSize; j++) {
        // Simple right triangle
        const relativeI = i - cy;
        const relativeJ = j - cx;
        if (
          relativeJ >= 0 &&
          relativeI >= 0 &&
          relativeJ < size - relativeI &&
          relativeI < size
        ) {
          imageData[i][j] = color;
        }
      }
    }
  }

  drawDiamond(imageData, cx, cy, size, color) {
    for (let i = 0; i < this.imageSize; i++) {
      for (let j = 0; j < this.imageSize; j++) {
        const dx = Math.abs(j - cx);
        const dy = Math.abs(i - cy);
        if (dx + dy <= size) {
          imageData[i][j] = color;
        }
      }
    }
  }

  drawPolygon(imageData, cx, cy, size, sides, color, rotation) {
    for (let i = 0; i < this.imageSize; i++) {
      for (let j = 0; j < this.imageSize; j++) {
        const dx = j - cx;
        const dy = i - cy;
        const angle = Math.atan2(dy, dx) + rotation;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Approximate polygon as circle for simplicity
        const polygonRadius =
          (size * Math.cos(Math.PI / sides)) /
          Math.cos((angle % ((2 * Math.PI) / sides)) - Math.PI / sides);
        if (dist <= Math.abs(polygonRadius) && dist <= size) {
          imageData[i][j] = color;
        }
      }
    }
  }

  drawStar(imageData, cx, cy, size, color) {
    for (let i = 0; i < this.imageSize; i++) {
      for (let j = 0; j < this.imageSize; j++) {
        const dx = j - cx;
        const dy = i - cy;
        const angle = Math.atan2(dy, dx);
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Simple 5-pointed star approximation
        const starAngle =
          ((angle + Math.PI) % ((2 * Math.PI) / 5)) - Math.PI / 5;
        const starRadius = size * (0.5 + 0.5 * Math.cos(5 * starAngle));
        if (dist <= starRadius) {
          imageData[i][j] = color;
        }
      }
    }
  }

  drawEllipse(imageData, cx, cy, width, height, color) {
    for (let i = 0; i < this.imageSize; i++) {
      for (let j = 0; j < this.imageSize; j++) {
        const dx = (j - cx) / width;
        const dy = (i - cy) / height;
        if (dx * dx + dy * dy <= 1) {
          imageData[i][j] = color;
        }
      }
    }
  }

  drawCross(imageData, cx, cy, size, color) {
    const thickness = Math.max(3, Math.floor(size / 4));
    // Horizontal bar
    const hx = Math.floor(cx - size);
    const hy = Math.floor(cy - thickness / 2);
    const hwidth = Math.floor(size * 2);
    const hheight = Math.floor(thickness);
    this.drawRectangle(imageData, hx, hy, hwidth, hheight, color);

    // Vertical bar
    const vx = Math.floor(cx - thickness / 2);
    const vy = Math.floor(cy - size);
    const vwidth = Math.floor(thickness);
    const vheight = Math.floor(size * 2);
    this.drawRectangle(imageData, vx, vy, vwidth, vheight, color);
  }

  drawHeart(imageData, cx, cy, size, color) {
    for (let i = 0; i < this.imageSize; i++) {
      for (let j = 0; j < this.imageSize; j++) {
        const dx = (j - cx) / size;
        const dy = (i - cy) / size;

        // Heart equation approximation
        const heartEq =
          Math.pow(dx * dx + dy * dy - 1, 3) - dx * dx * dy * dy * dy;
        if (heartEq <= 0 && dx * dx + dy * dy <= 2) {
          imageData[i][j] = color;
        }
      }
    }
  }
}
