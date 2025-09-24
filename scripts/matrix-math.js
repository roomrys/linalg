export class MatrixMath {
  static extractBasisVectors(a11, a12, a21, a22) {
    /**
     * Extracts the basis vectors from a 2x2 matrix.
     * @param {number} a11 - Element at row 1, column 1.
     * @param {number} a12 - Element at row 1, column 2.
     * @param {number} a21 - Element at row 2, column 1.
     * @param {number} a22 - Element at row 2, column 2.
     * @returns {Object} An object containing basisX and basisY vectors.
     */
    const basisX = { x: a11, y: a21 }; // First column
    const basisY = { x: a12, y: a22 }; // Second column
    return { basisX, basisY };
  }

  static calculateTransformation(a11, a12, a21, a22) {
    /**
     * Calculates rotation angles and determinant from a 2x2 matrix.
     * @param {number} a11 - Element at row 1, column 1.
     * @param {number} a12 - Element at row 1, column 2.
     * @param {number} a21 - Element at row 2, column 1.
     * @param {number} a22 - Element at row 2, column 2.
     * @returns {Object} An object containing basis vectors, rotation angles, and determinant.
     */
    // Calculate determinant
    const det = a11 * a22 - a12 * a21;

    // Extract basis vectors
    let { basisX, basisY } = MatrixMath.extractBasisVectors(a11, a12, a21, a22);

    // Calculate rotation angles in degrees
    let rotationX = -Math.atan2(basisX.y, basisX.x) * (180 / Math.PI);
    let rotationY = Math.atan2(basisY.x, basisY.y) * (180 / Math.PI);

    // Normalize angles to 0-360 range
    if (rotationX < 0) rotationX += 360;
    if (rotationY < 0) rotationY += 360;

    return {
      basisX: basisX,
      basisY: basisY,
      rotationX: rotationX,
      rotationY: rotationY,
      determinant: det,
    };
  }

  static calculateFromTransforms(xRotation, yRotation, xScale, yScale) {
    /**
     * Calculates the 2x2 matrix elements from rotation angles and scaling factors.
     * @param {number} xRotation - Rotation angle around the X-axis in degrees.
     * @param {number} yRotation - Rotation angle around the Y-axis in degrees.
     * @param {number} xScale - Scaling factor along the X-axis.
     * @param {number} yScale - Scaling factor along the Y-axis.
     * @returns {Object} An object containing the matrix elements a11, a12, a21, a22.
     */
    // Convert rotation angles from degrees to radians
    const thetaX = (xRotation * Math.PI) / 180;
    const thetaY = (yRotation * Math.PI) / 180;

    // Determine quadrant adjustments
    const a11Sign = xRotation >= 90 && xRotation < 270 ? -1 : 1;
    const a22Sign = yRotation >= 90 && yRotation < 270 ? -1 : 1;

    // Calculate matrix elements based on rotation and scale
    const a11 = a11Sign * xScale;
    const a21 = -Math.tan(thetaX) * a11;
    const a22 = a22Sign * yScale;
    const a12 = Math.tan(thetaY) * a22;

    return {
      a11: a11,
      a12: a12,
      a21: a21,
      a22: a22,
    };
  }
}
