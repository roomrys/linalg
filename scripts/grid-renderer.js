import { CONFIG } from "./constants.js";

export class GridRenderer {
  constructor(xContainer, yContainer) {
    this.xContainer = xContainer;
    this.yContainer = yContainer;
    this.svgWidth = CONFIG.SVG.WIDTH;
    this.svgHeight = CONFIG.SVG.HEIGHT;

    this.lineLength = Math.sqrt(
      this.svgWidth * this.svgWidth + this.svgHeight * this.svgHeight
    );
    this.spacing = CONFIG.GRID.BASE_SPACING;
    this.centerX = CONFIG.SVG.CENTER_X;
    this.centerY = CONFIG.SVG.CENTER_Y;
    this.yColor = "blue";
    this.xColor = "red";
  }

  generateXGridLines(spacing, rotation, basisY) {
    // Your generateXGridLines function
  }

  generateYGridLines(rotation = 0, basisX = { x: 1, y: 0 }) {
    // Clear existing lines
    this.yContainer.innerHTML = "";

    // Generate the main Y-axis line
    this._createYGridLine(0, true, rotation, basisX, {
      strokeWidth: 3,
      opacity: 1,
    });

    // Generate lines to the left of center (x < 200)
    const numLines = Math.floor(this.centerX / this.spacing);
    for (let i = 1; i <= numLines; i++) {
      this._createYGridLine(i, false, rotation, basisX);
    }

    // Generate lines to the right of center (x > 200)
    for (let i = 1; i <= numLines; i++) {
      this._createYGridLine(i, true, rotation, basisX);
    }
  }

  _createYGridLine(
    i,
    positive = true,
    rotation = 0,
    basisX = { x: 1, y: 0 },
    options = {}
  ) {
    // Calculate offset from center based on basis vector and spacing
    const offsetX = basisX.x * i * this.spacing;
    const offsetY = basisX.y * i * this.spacing;

    // Determine intersection point with the X-axis
    let intersectionX, intersectionY;
    if (positive) {
      intersectionX = offsetX + this.centerX;
      intersectionY = -offsetY + this.centerY;
    } else {
      intersectionX = -offsetX + this.centerX;
      intersectionY = offsetY + this.centerY;
    }

    // Calculate line endpoints based on rotation
    const radians = ((90 + rotation) * Math.PI) / 180;
    const dx = Math.cos(radians) * this.lineLength;
    const dy = Math.sin(radians) * this.lineLength;

    let x1 = intersectionX - dx;
    let y1 = intersectionY - dy;
    let x2 = intersectionX + dx;
    let y2 = intersectionY + dy;

    // Also cap X boundaries
    if (x1 < 0) {
      const t = -intersectionX / (x1 - intersectionX);
      x1 = 0;
      y1 = intersectionY + t * (y1 - intersectionY);
    }
    if (x1 > this.svgWidth) {
      const t = (this.svgWidth - intersectionX) / (x1 - intersectionX);
      x1 = this.svgWidth;
      y1 = intersectionY + t * (y1 - intersectionY);
    }
    if (x2 < 0) {
      const t = -intersectionX / (x2 - intersectionX);
      x2 = 0;
      y2 = intersectionY + t * (y2 - intersectionY);
    }
    if (x2 > this.svgWidth) {
      const t = (this.svgWidth - intersectionX) / (x2 - intersectionX);
      x2 = this.svgWidth;
      y2 = intersectionY + t * (y2 - intersectionY);
    }

    // Create and append the line
    options.stroke = options.stroke || this.yColor;
    options.opacity = options.opacity || 0.5;
    const line = this._createLine(x1, y1, x2, y2, options);
    this.yContainer.appendChild(line);

    // Add a circle at the intersection point for debugging
    const debugCircle = this._createDebugCircle(
      intersectionX,
      intersectionY,
      3,
      this.yColor
    );
    this.yContainer.appendChild(debugCircle);

    // Add the i basis vector line
    if (i === 1 && positive && !(basisX.x === 0 && basisX.y === 0)) {
      const iLine = this._createUnitVector(intersectionX, intersectionY, true);
      this.yContainer.appendChild(iLine);
    }

    return line;
  }

  _createLine(x1, y1, x2, y2, options = {}) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("stroke", options.stroke || "black");
    line.setAttribute("stroke-width", options.strokeWidth || "1");
    line.setAttribute("opacity", options.opacity || "0.5");
    return line;
  }

  _createDebugCircle(cx, cy, r = 3, color = "red") {
    const circle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    circle.setAttribute("cx", cx);
    circle.setAttribute("cy", cy);
    circle.setAttribute("r", r);
    circle.setAttribute("fill", color);
    return circle;
  }

  _createUnitVector(x, y, isI = true) {
    let color, markerEnd;
    if (isI) {
      color = this.xColor;
      markerEnd = "url(#i-arrowhead)";
    } else {
      color = this.yColor;
      markerEnd = "url(#j-arrowhead)";
    }

    const options = { strokeWidth: 3, opacity: 1, stroke: color };
    const line = this._createLine(this.centerX, this.centerY, x, y, options);
    line.setAttribute("marker-end", markerEnd);

    return line;
  }
}
