import { CONFIG } from "./constants.js";
import { AppState } from "./app-state.js";
import { ImageGenerator } from "./image-generator.js";
import { CanvasRenderer } from "./canvas-renderer.js";
import { InteractionHandler } from "./interaction-handler.js";

export class SVDColorSpaceApp {
  constructor() {
    this.imageSize = CONFIG.IMAGE_SIZE;

    // Initialize all modules
    this.state = new AppState();
    this.imageGenerator = new ImageGenerator();
    this.renderer = new CanvasRenderer(this.state);

    // Pass regeneration callback to interaction handler
    this.interactionHandler = new InteractionHandler(
      this.state,
      this.renderer,
      () => this.regenerateImageAndSVD() // Single callback for everything
    );
  }

  init() {
    // Generate initial data
    this.state.fixedShapes = this.imageGenerator.generateShapes();
    this.regenerateImageAndSVD();

    console.log("SVD App initialized");
  }

  regenerateImageAndSVD() {
    // Generate new image
    this.state.imageData = this.imageGenerator.generateComplexImage(
      this.state.colorComplexity,
      this.state.shapeComplexity,
      this.state.fixedShapes
    );

    // Perform SVD
    this.performSVD();

    // Render everything
    this.renderer.drawAll();
  }

  performSVD() {
    // Convert the 3D image array (100x100x3) into a 2D matrix (10000x3)
    const imageMatrix = [];
    for (let i = 0; i < this.imageSize; i++) {
      for (let j = 0; j < this.imageSize; j++) {
        // Normalize to 0-1 range for better numerical stability
        const [r, g, b] = this.state.imageData[i][j];
        imageMatrix.push([r / 255, g / 255, b / 255]);
      }
    }

    // Perform actual SVD computation
    this.state.svdResult = this.computeSVDFromScratch(imageMatrix);
    console.log(this.state.svdResult);
  }

  computeSVDFromScratch(matrix) {
    let A = new mlMatrix.Matrix(matrix);

    // Perform SVD
    const svd = new mlMatrix.SingularValueDecomposition(A);

    // Extract components
    const U = svd.leftSingularVectors.to2DArray();
    const sigma = svd.diagonal;
    const V = svd.rightSingularVectors.to2DArray();

    // Transpose V to get V^T (ML-Matrix returns V, but we need V^T)
    const VT = [];
    for (let i = 0; i < V[0].length; i++) {
      VT[i] = [];
      for (let j = 0; j < V.length; j++) {
        VT[i][j] = V[j][i];
      }
    }

    // Fix sign ambiguity: make the largest absolute value in each V^T row positive
    for (let i = 0; i < VT.length; i++) {
      const row = VT[i];
      let maxAbsIdx = 0;
      let maxAbsVal = Math.abs(row[0]);

      for (let j = 1; j < row.length; j++) {
        if (Math.abs(row[j]) > maxAbsVal) {
          maxAbsVal = Math.abs(row[j]);
          maxAbsIdx = j;
        }
      }

      // If the largest element is negative, flip the sign of the entire row
      // and corresponding column in U
      if (row[maxAbsIdx] < 0) {
        for (let j = 0; j < row.length; j++) {
          VT[i][j] = -VT[i][j];
        }
        for (let k = 0; k < U.length; k++) {
          U[k][i] = -U[k][i];
        }
      }
    }

    return { U, sigma, VT };
  }
}
