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

  static calculateEigenvectors(a11, a12, a21, a22) {
    /**
     * Calculates the eigenvectors of a 2x2 matrix.
     * @param {number} a11 - Element at row 1, column 1.
     * @param {number} a12 - Element at row 1, column 2.
     * @param {number} a21 - Element at row 2, column 1.
     * @param {number} a22 - Element at row 2, column 2.
     * @returns {Object} An object containing eigenvector1 and eigenvector2.
     */
    // Calculate the eigenvalues using the quadratic formula
    // Eigenvalues: λ = [trace ± sqrt(trace^2 - 4*det)] / 2
    const trace = a11 + a22; // b in characteristic polynomial
    const determinant = a11 * a22 - a12 * a21; // c in characteristic polynomial
    const discriminant = trace * trace - 4 * determinant; // b^2 - 4ac
    const realValue = trace / 2; // -b/(2a) (always real part of eigenvalue)
    const complex = discriminant < 0;

    // Return eigenvectors and eigenvalues for real cases.
    let eigenvalue1, eigenvalue2;
    let eigenvector1, eigenvector2;
    let defective = discriminant === 0; // True if eigenvectors are linearly dependent.

    // For complex eigenvalues, return the real and imaginary parts separately for a
    // single eigenvalue/vector pair (complex conjugate).
    let imagValue;
    let realVector, imagVector;
    if (complex) {
      imagValue = Math.sqrt(Math.abs(discriminant)) / 2; // Multiplied by i

      // Calculate eigenvectors based on complex eigenvalues
      let a11_real = a11 - realValue; // a - λ
      let a22_real = a22 - realValue; // d - λ
      if (a12 !== 0) {
        realVector = { x: 1, y: -a11_real / a12 };
        imagVector = { x: 0, y: imagValue / a12 };
      } else if (a21 !== 0) {
        realVector = { x: -a22_real / a21, y: 1 };
        imagVector = { x: imagValue / a21, y: 0 };
      } else {
        // Raise error.
        throw new Error(
          "Cannot compute eigenvectors for this matrix. Expected non-zero off-diagonal element."
        );
      }
    } else {
      eigenvalue1 = realValue + Math.sqrt(discriminant) / 2;
      eigenvalue2 = realValue - Math.sqrt(discriminant) / 2;

      // Calculate eigenvectors
      if (a12 !== 0) {
        eigenvector1 = { x: 1, y: (eigenvalue1 - a11) / a12 };
        eigenvector2 = { x: 1, y: (eigenvalue2 - a11) / a12 };
      } else if (a21 !== 0) {
        eigenvector1 = { x: (eigenvalue1 - a22) / a21, y: 1 };
        eigenvector2 = { x: (eigenvalue2 - a22) / a21, y: 1 };
      } else {
        // Diagonal matrix case, ensure scale lines up with basis vectors.
        eigenvalue1 = a11;
        eigenvalue2 = a22;
        eigenvector1 = { x: 1, y: 0 };
        eigenvector2 = { x: 0, y: 1 };
        defective = false;
      }

      // Normalize eigenvectors
      const norm1 = Math.hypot(eigenvector1.x, eigenvector1.y);
      eigenvector1 = {
        x: (eigenvalue1 * eigenvector1.x) / norm1,
        y: (eigenvalue1 * eigenvector1.y) / norm1,
      };
      const norm2 = Math.hypot(eigenvector2.x, eigenvector2.y);
      eigenvector2 = {
        x: (eigenvalue2 * eigenvector2.x) / norm2,
        y: (eigenvalue2 * eigenvector2.y) / norm2,
      };
    }

    const result = {
      defective: defective,
      eigenvalue1: eigenvalue1,
      eigenvalue2: eigenvalue2,
      eigenvector1: eigenvector1,
      eigenvector2: eigenvector2,
      complex: complex,
      realValue: realValue,
      imagValue: imagValue,
      realVector: realVector,
      imagVector: imagVector,
    };
    console.log(`eigenvectors1: ${JSON.stringify(result)} `);
    return result;
  }

  static calculateContinuousTimeTransformTrajectory(
    realValue,
    imagValue,
    realVector,
    imagVector
  ) {
    /** Calculate the trajectory for complex eigenvalues and eigenvectors.
     * @param {number} realValue - The real part of the eigenvalue (for complex case).
     * @param {number} imagValue - The imaginary part of the eigenvalue (for complex case).
     * @param {Object} realVector - The real part of the eigenvector (for complex case).
     * @param {Object} imagVector - The imaginary part of the eigenvector (for complex case).
     * @returns {Array} An array of points representing the trajectory.
     */

    const points = [];
    const numPoints = 100;
    const timeRange = 1; // Time from 0 to 4 (adjust to see more/less of spiral)

    // Complex eigenvalue case: use real and imaginary parts
    for (let i = 0; i <= numPoints; i++) {
      const t = (i / numPoints) * timeRange;

      // x(t) = e^(a + ib)t * (realVector + i * imagVector)
      //      = e^(at) * (cos(bt) + i sin(bt)) * (realVector + i * imagVector)
      //      = e^(at) * [(cos(bt) * realVector - sin(bt) * imagVector) +
      //                  i (cos(bt) * imagVector + sin(bt) * realVector)]
      const exp_part = Math.exp(realValue * t); // e^(at)
      const cos_part = Math.cos(imagValue * t);
      const sin_part = Math.sin(imagValue * t);

      const x = exp_part * (cos_part * realVector.x - sin_part * imagVector.x);
      const y = exp_part * (cos_part * realVector.y - sin_part * imagVector.y);

      points.push({ x: x, y: y });
    }

    return points;
  }

  static calculateDiscreteTrajectory(
    realValue,
    imagValue,
    realVector,
    imagVector,
    initial_vector = { x: 1, y: 0 }
  ) {
    /**
     * Compute smooth trajectory for a discrete-time linear system x_{k+1} = A x_k.
     * Interpolates via fractional powers A^t.
     *
     * @param {number} realValue - The real part of the eigenvalue (for complex case).
     * @param {number} imagValue - The imaginary part of the eigenvalue (for complex case).
     * @param {Object} realVector - The real part of the eigenvector (for complex case).
     * @param {Object} imagVector - The imaginary part of the eigenvector (for complex case).
     * @returns {Array} An array of points representing the trajectory.
     */
    const magnitude = Math.sqrt(realValue * realValue + imagValue * imagValue);
    const theta = Math.atan2(imagValue, realValue);

    // Calculate coefficients for the initial vector
    const det = -realVector.x * imagVector.y + realVector.y * imagVector.x;
    if (Math.abs(det) < 1e-10) {
      throw new Error(
        "Real and imaginary eigenvectors are linearly dependent."
      );
    }
    const alpha =
      (-initial_vector.x * imagVector.y + initial_vector.y * imagVector.x) /
      det;
    const beta =
      (-initial_vector.x * realVector.y + initial_vector.y * realVector.x) /
      det;

    const points = [];
    const numPoints = 100;
    const timeRange = (2 * Math.PI) / theta; // Time from 0 to one full rotation (adjust to see more/less of spiral)
    for (let i = 0; i <= numPoints; i++) {
      const t = (i / numPoints) * timeRange;
      let x, y;
      // Complex eigenvalues -> use spiral formula
      const exp_r = Math.pow(magnitude, t);
      const cos_term = Math.cos(theta * t);
      const sin_term = Math.sin(theta * t);

      // Calculate coefficients for U and W
      const coeffU = alpha * cos_term - beta * sin_term;
      const coeffW = -(alpha * sin_term + beta * cos_term);

      // Combine to get position at time t
      x = exp_r * (coeffU * realVector.x + coeffW * imagVector.x);
      y = exp_r * (coeffU * realVector.y + coeffW * imagVector.y);

      points.push({ x, y });
    }
    return points;
  }
}
