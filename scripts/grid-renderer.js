import { CONFIG } from "./constants.js";

export class GridRenderer {
  /**
   * Class to render grid lines in an SVG container.
   * @param {SVGElement} xContainer - The SVG container for X grid lines.
   * @param {SVGElement} yContainer - The SVG container for Y grid lines.
   */
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

  generateXGridLines(rotation = 0, basisY = { x: 0, y: 1 }) {
    /**
     * Generate X grid lines in the specified SVG container.
     * @param {number} rotation - The rotation angle in degrees.
     * @param {object} basisY - The complementary basis vector (e.g., the y-axis basis for x-axis lines).
     */
    this._generateGridLines({
      container: this.xContainer,
      basis: basisY,
      rotation: rotation,
      isI: false,
      color: this.xColor,
      center: this.centerY,
    });
  }

  generateYGridLines(rotation = 0, basisX = { x: 1, y: 0 }) {
    /**
     * Generate Y grid lines in the specified SVG container.
     * @param {number} rotation - The rotation angle in degrees.
     * @param {object} basisX - The complementary basis vector (e.g., the x-axis basis for y-axis lines).
     */
    this._generateGridLines({
      container: this.yContainer,
      basis: basisX,
      rotation: rotation + 90,
      isI: true,
      color: this.yColor,
      center: this.centerX,
    });
  }

  _generateGridLines({
    container,
    basis,
    rotation = 0,
    isI = false,
    color = "blue",
    center,
  }) {
    /**
     * Generate grid lines in the specified SVG container.
     * @param {SVGElement} container - The SVG container to append the lines to.
     * @param {object} basis - The complementary basis vector (e.g., the y-axis basis for x-axis lines).
     * @param {number} rotation - The rotation angle in degrees.
     * @param {boolean} isI - Whether to draw the i unit vector (or the j unit vector). The complementary basis is used to determine this.
     * @param {string} color - The color of the lines.
     * @param {number} center - The center coordinate (centerX for y-lines, centerY for x-lines).
     */

    // Clear existing lines
    container.innerHTML = "";

    // Generate the main Y-axis line
    this._createGridLine({
      index: 0,
      positive: true,
      rotation: rotation,
      basis: basis,
      container: container,
      isI: isI,
      color: color,
      options: {
        strokeWidth: 3,
        opacity: 1,
      },
    });

    const numLines = Math.floor(center / this.spacing);
    for (const positive of [false, true]) {
      for (let i = 1; i <= numLines; i++) {
        this._createGridLine({
          index: i,
          positive: positive,
          rotation: rotation,
          basis: basis,
          container: container,
          isI: isI,
          color: color,
        });
      }
    }
  }

  _createGridLine({
    index,
    positive = true,
    rotation = 0,
    basis,
    container,
    isI = false,
    color,
    options = {},
  }) {
    /**
     * Create and append a grid line to the SVG container.
     * @param {number} index - The index of the grid line (0 for center, positive/negative for others).
     * @param {boolean} positive - Whether the line is on the positive side of the axis.
     * @param {number} rotation - The rotation angle in degrees.
     * @param {object} basis - The complementary basis vector (e.g., the y-axis basis for x-axis lines).
     * @param {SVGElement} container - The SVG container to append the line to.
     * @param {boolean} isI - Whether the line is along the i (x) axis.
     * @param {string} color - The color of the line.
     * @param {object} options - Additional options (strokeWidth, opacity).
     * @returns {SVGLineElement} - The created SVG line element.
     */
    const { x1, y1, x2, y2, intersectionX, intersectionY } =
      this._calculateLineParameters({
        basis: basis,
        index: index,
        positive: positive,
        rotation: rotation,
      });

    // Create and append the line
    options.stroke = options.stroke || color;
    options.opacity = options.opacity || 0.5;
    const line = this._createLine(x1, y1, x2, y2, options);
    container.appendChild(line);

    // // Add a circle at the intersection point for debugging
    // const debugCircle = this._createDebugCircle(
    //   intersectionX,
    //   intersectionY,
    //   3,
    //   color
    // );
    // container.appendChild(debugCircle);

    // Add the unit vector line
    if (index === 1 && positive && !(basis.x === 0 && basis.y === 0)) {
      const uLine = this._createUnitVector(intersectionX, intersectionY, isI);
      container.appendChild(uLine);
    }

    return line;
  }

  _calculateLineParameters({
    basis: basis,
    index: index,
    positive: positive,
    rotation: rotation,
  }) {
    /**
     * Calculate the endpoints and intersection point of a grid line.
     * @param {object} basis - The basis vector (e.g., {x: 1, y: 0} for x-axis).
     * @param {number} index - The index of the grid line (0 for center, positive/negative for others).
     * @param {boolean} positive - Whether the line is on the positive side of the axis.
     * @param {number} rotation - The rotation angle in degrees.
     * @returns {object} - The calculated line endpoints and intersection point.
     */

    // Calculate offset from center based on basis vector and spacing
    const offsetX = basis.x * index * this.spacing;
    const offsetY = basis.y * index * this.spacing;

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
    const radians = (rotation * Math.PI) / 180;
    const dx = Math.cos(radians) * this.lineLength;
    const dy = Math.sin(radians) * this.lineLength;

    let x1 = intersectionX - dx;
    let y1 = intersectionY - dy;
    let x2 = intersectionX + dx;
    let y2 = intersectionY + dy;

    // TODO: Extend to x and y boundaries.
    ({ x: x1, y: y1 } = this._clipBoundaries(
      x1,
      y1,
      intersectionX,
      intersectionY
    ));
    ({ x: x2, y: y2 } = this._clipBoundaries(
      x2,
      y2,
      intersectionX,
      intersectionY
    ));

    return { x1, y1, x2, y2, intersectionX, intersectionY };
  }

  _clipBoundaries(x, y, intersectionX, intersectionY) {
    /**
     * Clip the line to the SVG boundaries (x=0, x=svgWidth, y=0, y=svgHeight).
     * @param {number} x - The x-coordinate of the line endpoint.
     * @param {number} y - The y-coordinate of the line endpoint.
     * @param {number} intersectionX - The x-coordinate of the intersection point with the axis.
     * @param {number} intersectionY - The y-coordinate of the intersection point with the axis.
     * @returns {object} - The clipped (x, y) coordinates.
     */

    ({ x, y } = this._clipYBoundaries(x, y, intersectionX, intersectionY));
    ({ x, y } = this._clipXBoundaries(x, y, intersectionX, intersectionY));
    return { x, y };
  }

  _clipYBoundaries(x, y, intersectionX, intersectionY) {
    /**
     * Clip the line to the SVG boundaries (y=0 and y=svgHeight) using similar triangles.
     * @param {number} x - The x-coordinate of the line endpoint.
     * @param {number} y - The y-coordinate of the line endpoint.
     * @param {number} intersectionX - The x-coordinate of the intersection point with the axis.
     * @param {number} intersectionY - The y-coordinate of the intersection point with the axis.
     * @returns {object} - The clipped (x, y) coordinates.
     */
    if (y < 0) {
      const t = -intersectionY / (y - intersectionY);
      y = 0;
      x = intersectionX + t * (x - intersectionX);
    }
    if (y > this.svgHeight) {
      const t = (this.svgHeight - intersectionY) / (y - intersectionY);
      y = this.svgHeight;
      x = intersectionX + t * (x - intersectionX);
    }
    return { x, y };
  }

  _clipXBoundaries(x, y, intersectionX, intersectionY) {
    /**
     * Clip the line to the SVG boundaries (x=0 and x=svgWidth) using similar triangles.
     * @param {number} x - The x-coordinate of the line endpoint.
     * @param {number} y - The y-coordinate of the line endpoint.
     * @param {number} intersectionX - The x-coordinate of the intersection point with the axis.
     * @param {number} intersectionY - The y-coordinate of the intersection point with the axis.
     * @returns {object} - The clipped (x, y) coordinates.
     */
    if (x < 0) {
      const t = -intersectionX / (x - intersectionX);
      x = 0;
      y = intersectionY + t * (y - intersectionY);
    }
    if (x > this.svgWidth) {
      const t = (this.svgWidth - intersectionX) / (x - intersectionX);
      x = this.svgWidth;
      y = intersectionY + t * (y - intersectionY);
    }
    return { x, y };
  }

  _createLine(x1, y1, x2, y2, options = {}) {
    /**
     * Create an SVG line element.
     * @param {number} x1 - The x-coordinate of the start point.
     * @param {number} y1 - The y-coordinate of the start point.
     * @param {number} x2 - The x-coordinate of the end point.
     * @param {number} y2 - The y-coordinate of the end point.
     * @param {object} options - Additional options (stroke, strokeWidth, opacity).
     * @returns {SVGLineElement} - The created SVG line element.
     */
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
    /**
     * Create an SVG circle element for debugging.
     * @param {number} cx - The x-coordinate of the circle center.
     * @param {number} cy - The y-coordinate of the circle center.
     * @param {number} r - The radius of the circle.
     * @param {string} color - The fill color of the circle.
     * @returns {SVGCircleElement} - The created SVG circle element.
     */
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
    /**
     * Create an SVG line element representing a unit vector with an arrowhead.
     * @param {number} x - The x-coordinate of the vector endpoint.
     * @param {number} y - The y-coordinate of the vector endpoint.
     * @param {boolean} isI - Whether the vector is along the i (x) axis.
     * @returns {SVGLineElement} - The created SVG line element with an arrowhead.
     */
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
