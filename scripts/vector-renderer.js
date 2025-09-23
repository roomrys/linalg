import { CONFIG } from "./constants.js";

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
