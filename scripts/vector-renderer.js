import { CONFIG } from "./constants.js";

export class VectorRenderer {
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

  updateVectorDrawing() {
    const v1 = parseFloat(this.v.inputs.v1.value) || 0;
    const v2 = parseFloat(this.v.inputs.v2.value) || 0;
    const vectorLine = this.v.line;
    const vectorLabel = this.v.label;

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
      vectorLine.setAttribute("marker-end", "url(#arrowhead)");
    } else {
      // For very small vectors, don't adjust for arrowhead and hide it
      lineEndX = endX;
      lineEndY = endY;

      // Hide the arrowhead for very small vectors
      vectorLine.setAttribute("marker-end", "none");
    }

    // Update vector line (ends at base of arrowhead)
    vectorLine.setAttribute("x2", lineEndX);
    vectorLine.setAttribute("y2", lineEndY);

    // Update vector label position (at midpoint of vector)
    const labelX = this.centerX + v1 * this.scale * 0.5;
    const labelY = this.centerY - v2 * this.scale * 0.5 - 5; // Offset up slightly
    vectorLabel.setAttribute("x", labelX);
    vectorLabel.setAttribute("y", labelY);

    // Update transformed vector Av
    this.updateTransformedVectorDrawing();
  }

  updateTransformedVectorDrawing() {
    const avVectorLine = this.Av.line;
    const avVectorLabel = this.Av.label;
    // Get matrix values
    const a11 = parseFloat(this.matrix.inputs.a11.value) || 0;
    const a12 = parseFloat(this.matrix.inputs.a12.value) || 0;
    const a21 = parseFloat(this.matrix.inputs.a21.value) || 0;
    const a22 = parseFloat(this.matrix.inputs.a22.value) || 0;

    const v1 = parseFloat(this.v.inputs.v1.value) || 0;
    const v2 = parseFloat(this.v.inputs.v2.value) || 0;

    // Calculate transformed vector Av = [a11*v1 + a12*v2, a21*v1 + a22*v2]
    const av1 = a11 * v1 + a12 * v2;
    const av2 = a21 * v1 + a22 * v2;

    // Convert transformed vector components to screen coordinates
    const avEndX = this.centerX + av1 * this.scale;
    const avEndY = this.centerY - av2 * this.scale; // Negative because SVG Y increases downward

    // Calculate transformed vector length
    const avVectorLength = Math.sqrt(
      (avEndX - this.centerX) ** 2 + (avEndY - this.centerY) ** 2
    );

    // Calculate where the transformed vector line should end
    let avLineEndX, avLineEndY;

    if (avVectorLength > this.minVectorLength) {
      // Unit vector in the direction of the transformed vector
      const avUnitX = (avEndX - this.centerX) / avVectorLength;
      const avUnitY = (avEndY - this.centerY) / avVectorLength;

      // Stop the line at the base of the arrowhead
      avLineEndX = avEndX - this.arrowheadLength * avUnitX;
      avLineEndY = avEndY - this.arrowheadLength * avUnitY;

      // Show the arrowhead
      avVectorLine.setAttribute("marker-end", "url(#av-arrowhead)");
    } else {
      // For very small transformed vectors, don't adjust for arrowhead and hide it
      avLineEndX = avEndX;
      avLineEndY = avEndY;

      // Hide the arrowhead for very small transformed vectors
      avVectorLine.setAttribute("marker-end", "none");
    }

    // Update transformed vector line
    avVectorLine.setAttribute("x2", avLineEndX);
    avVectorLine.setAttribute("y2", avLineEndY);

    // Update transformed vector label position (at midpoint of transformed vector)
    const avLabelX = this.centerX + av1 * this.scale * 0.5;
    const avLabelY = this.centerY - av2 * this.scale * 0.5 - 15; // Offset up more to avoid overlap with v label
    avVectorLabel.setAttribute("x", avLabelX);
    avVectorLabel.setAttribute("y", avLabelY);
  }
}
