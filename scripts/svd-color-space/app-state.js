export class AppState {
  constructor() {
    // Image and SVD data
    this.imageData = null;
    this.svdResult = null;

    // Complexity settings
    this.colorComplexity = 3;
    this.shapeComplexity = 3;
    this.currentRank = 3;

    // Shape data
    this.fixedShapes = null;

    // UI interaction state
    this.hoveredVTRow = -1;
    this.hoveredOriginalImage = false;
    this.isRankSliderActive = false;
  }
}
