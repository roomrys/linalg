import { CONFIG } from "./constants.js";
import { MatrixMath } from "./matrix-math.js";

export class VectorRenderer {
  /**
   * Creates an instance of the VectorRenderer class.
   * @param {Object} params - The parameters for the vector renderer.
   * @param {Object} params.v - The original vector elements.
   * @param {Object} params.Av - The transformed vector elements.
   * @param {Object} params.matrix - The matrix elements.
   */
  constructor({
    v: vectorElements,
    Av: avVectorElements,
    matrix: matrixElements,
  }) {
    this.scale = CONFIG.GRID.SCALE;
    this.centerX = CONFIG.SVG.CENTER_X;
    this.centerY = CONFIG.SVG.CENTER_Y;
    this.arrowheadLength = CONFIG.VECTOR.ARROWHEAD_LENGTH;
    this.minVectorLength = CONFIG.VECTOR.MIN_VECTOR_LENGTH;

    this.v = vectorElements;
    this.Av = avVectorElements;
    this.matrix = matrixElements;

    this.eigenData = MatrixMath.calculateEigenvectors(
      parseFloat(this.matrix.inputs.a11.value) || 0,
      parseFloat(this.matrix.inputs.a12.value) || 0,
      parseFloat(this.matrix.inputs.a21.value) || 0,
      parseFloat(this.matrix.inputs.a22.value) || 0
    );
  }

  updateEigenvectorDrawings({
    defective,
    eigenvalue1,
    eigenvalue2,
    eigenvector1,
    eigenvector2,
    complex,
    realValue,
    imagValue,
    realVector,
    imagVector,
  }) {
    /**
     * Updates the drawing of the eigenvectors.
     * @param {number} eigenvalue1 - The first eigenvalue.
     * @param {number} eigenvalue2 - The second eigenvalue.
     * @param {Object} eigenvector1 - The first eigenvector with x and y components.
     * @param {Object} eigenvector2 - The second eigenvector with x and y components.
     * @param {boolean} complex - Whether the eigenvalues are complex.
     * @param {number} realValue - The real part of the eigenvalue (for complex case).
     * @param {number} imagValue - The imaginary part of the eigenvalue (for complex case).
     * @param {Object} realVector - The real part of the eigenvector (for complex case).
     * @param {Object} imagVector - The imaginary part of the eigenvector (for complex case).
     * @returns {void}
     */
    const markerEnd = "url(#eigen-arrowhead)";
    const eigen1Label = document.getElementById("eigen-1-vector-label");

    // Remove any existing trajectory
    const existingTrajectory = document.getElementById("complex-trajectory");
    if (existingTrajectory) {
      existingTrajectory.remove();
    }

    // Check if complex eigenvalues
    if (complex) {
      const points = [];

      // Reset eigen-1 label
      eigen1Label.innerHTML = `e<tspan baseline-shift="sub" font-size="0.8em">1</tspan>`;

      // Hide eigenvector lines
      document
        .getElementById("eigen-1-vector-line")
        .setAttribute("display", "none");
      document
        .getElementById("eigen-2-vector-line")
        .setAttribute("display", "none");
      document
        .getElementById("eigen-2-vector-label")
        .setAttribute("display", "none");

      // Calculate trajectory points
      MatrixMath.calculateDiscreteTrajectory(
        realValue,
        imagValue,
        realVector,
        imagVector,
        { x: this.v.inputs.v1.value, y: this.v.inputs.v2.value }
      ).forEach((point) => {
        const screenX = this.centerX + point.x * this.scale;
        const screenY = this.centerY - point.y * this.scale; // Negative because SVG Y increases downward

        points.push(`${screenX},${screenY}`);
      });

      // Draw trajectory
      const polyline = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "polyline"
      );
      polyline.setAttribute("id", "complex-trajectory");
      polyline.setAttribute("points", points.join(" "));
      polyline.setAttribute("fill", "none");
      polyline.setAttribute("stroke", "orange");
      polyline.setAttribute("stroke-width", "2");
      polyline.setAttribute("opacity", "0.8");

      this.v.line.parentNode.appendChild(polyline);

      // Move eigen-1 label starting point to end of trajectory
      const lastPoint = points[parseInt(points.length / 4)].split(",");
      const labelX = parseFloat(lastPoint[0]);
      const labelY = parseFloat(lastPoint[1]) - 5; // Offset up slightly
      eigen1Label.setAttribute("x", labelX);
      eigen1Label.setAttribute("y", labelY);
    } else {
      // Always show and update eigenvector 1 drawing
      this._updateVectorDrawing(
        eigenvector1.x,
        eigenvector1.y,
        document.getElementById("eigen-1-vector-line"),
        document.getElementById("eigen-1-vector-label"),
        markerEnd
      );
      document
        .getElementById("eigen-1-vector-line")
        .setAttribute("display", "block");

      // Only show second eigenvector if not defective
      if (defective) {
        document
          .getElementById("eigen-2-vector-line")
          .setAttribute("display", "none");
        document
          .getElementById("eigen-2-vector-label")
          .setAttribute("display", "none");

        // Set eigen-1 label to denote defective case
        eigen1Label.innerHTML = `e<tspan baseline-shift="sub" font-size="0.8em">1&2</tspan>`;
      } else {
        document
          .getElementById("eigen-2-vector-line")
          .setAttribute("display", "block");
        document
          .getElementById("eigen-2-vector-label")
          .setAttribute("display", "block");

        // Update eigenvector 2 drawing
        this._updateVectorDrawing(
          eigenvector2.x,
          eigenvector2.y,
          document.getElementById("eigen-2-vector-line"),
          document.getElementById("eigen-2-vector-label"),
          markerEnd
        );

        // Reset eigen-1 label
        eigen1Label.innerHTML = `e<tspan baseline-shift="sub" font-size="0.8em">1</tspan>`;
      }
    }
  }

  updateVectorDrawing(transformed = false) {
    /**
     * Updates the drawing of the vector or its transformed version.
     * @param {boolean} transformed - If true, updates the transformed vector (Av); otherwise, updates the original vector (v).
     * @returns {void}
     */
    let v1 = parseFloat(this.v.inputs.v1.value) || 0;
    let v2 = parseFloat(this.v.inputs.v2.value) || 0;
    let markerEnd, line, label;

    if (transformed) {
      // Get matrix values
      const a11 = parseFloat(this.matrix.inputs.a11.value) || 0;
      const a12 = parseFloat(this.matrix.inputs.a12.value) || 0;
      const a21 = parseFloat(this.matrix.inputs.a21.value) || 0;
      const a22 = parseFloat(this.matrix.inputs.a22.value) || 0;

      // Calculate transformed vector Av = [a11*v1 + a12*v2, a21*v1 + a22*v2]
      [v1, v2] = [a11 * v1 + a12 * v2, a21 * v1 + a22 * v2];

      markerEnd = "url(#av-arrowhead)";
      line = this.Av.line;
      label = this.Av.label;

      // Also update the eigenvector drawings based on new matrix
      if (this.eigenData.complex) {
        this.updateEigenvectorDrawings({ ...this.eigenData });
      }
    } else {
      markerEnd = "url(#arrowhead)";
      line = this.v.line;
      label = this.v.label;
    }
    this._updateVectorDrawing(v1, v2, line, label, markerEnd);

    // Always update transformed vector drawing after updating original vector.
    if (!transformed) {
      this.updateVectorDrawing(true);
    }
  }

  _updateVectorDrawing(v1, v2, line, label, markerEnd) {
    /**
     * Internal method to update the vector drawing.
     * @param {number} v1 - The x-component of the vector.
     * @param {number} v2 - The y-component of the vector.
     * @param {SVGLineElement} line - The SVG line element representing the vector.
     * @param {SVGTextElement} label - The SVG text element for the vector label.
     * @param {string} markerEnd - The marker end URL for the arrowhead.
     * @returns {void}
     */
    // Convert vector components to screen coordinates
    const endX = this.centerX + v1 * this.scale;
    const endY = this.centerY - v2 * this.scale; // Negative because SVG Y increases downward

    // Calculate vector length and direction
    const vectorLength = Math.sqrt(
      (endX - this.centerX) ** 2 + (endY - this.centerY) ** 2
    );

    // Calculate where the line should end (at the base of the arrowhead)
    let lineEndX, lineEndY;
    if (vectorLength > this.minVectorLength) {
      // Unit vector in the direction of the vector
      const unitX = (endX - this.centerX) / vectorLength;
      const unitY = (endY - this.centerY) / vectorLength;

      // Stop the line at the base of the arrowhead
      lineEndX = endX - this.arrowheadLength * unitX;
      lineEndY = endY - this.arrowheadLength * unitY;

      // Show the arrowhead
      line.setAttribute("marker-end", markerEnd);
    } else {
      // For very small vectors, don't adjust for arrowhead and hide it
      lineEndX = endX;
      lineEndY = endY;

      // Hide the arrowhead for very small vectors
      line.setAttribute("marker-end", "none");
    }

    // Update vector line (ends at base of arrowhead)
    line.setAttribute("x2", lineEndX);
    line.setAttribute("y2", lineEndY);

    // Update vector label position (at midpoint of vector)
    const labelX = this.centerX + v1 * this.scale * 0.5;
    const labelY = this.centerY - v2 * this.scale * 0.5 - 5; // Offset up slightly
    label.setAttribute("x", labelX);
    label.setAttribute("y", labelY);
  }
}
