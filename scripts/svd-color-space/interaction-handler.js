import { CONFIG } from "./constants.js";

export class InteractionHandler {
  constructor(appState, canvasRenderer, regenerateImageAndSVDFunction) {
    this.state = appState;
    this.renderer = canvasRenderer;
    this.imageSize = CONFIG.IMAGE_SIZE;
    this.canvasSize = CONFIG.CANVAS_SIZE;
    this.uCanvasSize = CONFIG.U_CANVAS_SIZE;

    this.regenerateImageAndSVD = regenerateImageAndSVDFunction;

    this.setupAllInteractions();
  }

  setupAllInteractions() {
    this.setupSliderInteractions();
    this.setupCanvasInteractions();
  }

  setupSliderInteractions() {
    // Set up color and shape sliders
    document
      .getElementById("colorSlider")
      .addEventListener("input", () => this.updateSliders());
    document
      .getElementById("shapeSlider")
      .addEventListener("input", () => this.updateSliders());
    document
      .getElementById("rankSlider")
      .addEventListener("input", () => this.updateRankSlider());

    this.setupRankSliderInteraction();
  }

  setupCanvasInteractions() {
    this.setupOriginalImageInteraction();
    this.setupUMatrixInteraction();
    this.setupSigmaMatrixInteraction();
    this.setupVMatrixInteraction();
  }

  setupRankSliderInteraction() {
    const rankSlider = document.getElementById("rankSlider");

    // Mouse events
    rankSlider.addEventListener("mousedown", () => {
      this.state.isRankSliderActive = true;
      this.renderer.drawUMatrix();
      this.renderer.drawSigmaMatrix();
      this.renderer.drawVMatrix();
      this.renderer.updateULabels();
    });

    rankSlider.addEventListener("mouseup", () => {
      this.state.isRankSliderActive = false;
      this.renderer.drawUMatrix();
      this.renderer.drawSigmaMatrix();
      this.renderer.drawVMatrix();
      this.renderer.updateULabels();
    });

    // Touch events for mobile
    rankSlider.addEventListener("touchstart", () => {
      this.state.isRankSliderActive = true;
      this.renderer.drawUMatrix();
      this.renderer.drawSigmaMatrix();
      this.renderer.drawVMatrix();
      this.renderer.updateULabels();
    });

    rankSlider.addEventListener("touchend", () => {
      this.state.isRankSliderActive = false;
      this.renderer.drawUMatrix();
      this.renderer.drawSigmaMatrix();
      this.renderer.drawVMatrix();
      this.renderer.updateULabels();
    });
  }

  updateSliders() {
    const newColorComplexity = parseInt(
      document.getElementById("colorSlider").value
    );
    const newShapeComplexity = parseInt(
      document.getElementById("shapeSlider").value
    );

    // Auto-adjust logic: ensure we have enough shapes to support the color complexity
    let adjustedColorComplexity = newColorComplexity;
    let adjustedShapeComplexity = newShapeComplexity;

    // If user increases color complexity beyond shape complexity, increase shapes too
    if (
      newColorComplexity > this.state.shapeComplexity &&
      newColorComplexity !== this.state.colorComplexity
    ) {
      adjustedShapeComplexity = Math.max(
        newShapeComplexity,
        newColorComplexity
      );
      document.getElementById("shapeSlider").value = adjustedShapeComplexity;
      document.getElementById("shapeValue").textContent =
        adjustedShapeComplexity;

      // Visual feedback for auto-adjustment
      document
        .getElementById("shapeSliderGroup")
        .classList.add("slider-auto-adjusted");
      setTimeout(() => {
        document
          .getElementById("shapeSliderGroup")
          .classList.remove("slider-auto-adjusted");
      }, CONFIG.ANIMATION_DURATION);

      // Show brief notification
      this.showSliderNotification(
        `Shape complexity automatically increased to ${adjustedShapeComplexity} to support ${newColorComplexity} colors`
      );
    }

    // If user decreases shape complexity below color complexity, decrease colors too
    if (
      newShapeComplexity < this.state.colorComplexity &&
      newShapeComplexity !== this.state.shapeComplexity
    ) {
      adjustedColorComplexity = Math.min(
        newColorComplexity,
        newShapeComplexity
      );
      document.getElementById("colorSlider").value = adjustedColorComplexity;
      document.getElementById("colorValue").textContent =
        adjustedColorComplexity;

      // Visual feedback for auto-adjustment
      document
        .getElementById("colorSliderGroup")
        .classList.add("slider-auto-adjusted");
      setTimeout(() => {
        document
          .getElementById("colorSliderGroup")
          .classList.remove("slider-auto-adjusted");
      }, CONFIG.ANIMATION_DURATION);

      // Show brief notification
      this.showSliderNotification(
        `Color complexity automatically decreased to ${adjustedColorComplexity} to match ${newShapeComplexity} shapes`
      );
    }

    // Update display values
    document.getElementById("colorValue").textContent = adjustedColorComplexity;
    document.getElementById("shapeValue").textContent = adjustedShapeComplexity;

    // Add or remove shapes if shape complexity changed
    if (adjustedShapeComplexity !== this.state.shapeComplexity) {
      if (adjustedShapeComplexity > this.state.shapeComplexity) {
        this.addShapesToPattern(
          adjustedShapeComplexity - this.state.shapeComplexity
        );
      }
    }

    this.state.colorComplexity = adjustedColorComplexity;
    this.state.shapeComplexity = adjustedShapeComplexity;

    // Regenerate image and SVD (this should probably be moved to a service class later)
    this.regenerateImageAndSVD();

    // Update rank slider limits and preserve current rank if still valid
    this.updateRankSliderLimits();
  }

  updateRankSlider() {
    const newRank = parseInt(document.getElementById("rankSlider").value);
    this.state.currentRank = newRank;

    // Update display value
    document.getElementById("rankValue").textContent = this.state.currentRank;

    // Update the title based on rank
    this.renderer.updateImageTitle();

    // Redraw with current highlighting state (depends on isRankSliderActive)
    this.renderer.drawOriginalImageWithRank();
    this.renderer.drawUMatrix();
    this.renderer.drawSigmaMatrix();
    this.renderer.drawVMatrix();
    this.renderer.updateULabels();
  }

  // Move the canvas interaction methods from CanvasRenderer to here
  setupOriginalImageInteraction() {
    const canvas = document.getElementById("originalImage");

    // Remove existing listeners to prevent duplicates
    canvas.onmouseenter = null;
    canvas.onmouseleave = null;

    canvas.onmouseenter = () => {
      if (!this.state.hoveredOriginalImage) {
        this.state.hoveredOriginalImage = true;
        this.renderer.drawRGBChannelsInMainMatrices();
        this.renderer.drawOriginalImageWithRank();
      }
    };

    canvas.onmousemove = (event) => {
      if (this.state.hoveredOriginalImage) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const imgX = Math.floor((x * this.imageSize) / this.canvasSize);
        const imgY = Math.floor((y * this.imageSize) / this.canvasSize);

        if (
          imgX >= 0 &&
          imgX < this.imageSize &&
          imgY >= 0 &&
          imgY < this.imageSize
        ) {
          const [r, g, b] = this.renderer.getRankApproximationRGBAt(imgX, imgY);
          this.renderer.drawRGBChannelsWithHighlight(imgX, imgY, r, g, b);
          this.renderer.drawOriginalImageWithRank();
        }
      }
    };

    canvas.onmouseleave = () => {
      if (this.state.hoveredOriginalImage) {
        this.state.hoveredOriginalImage = false;
        this.exitRGBMode();
      }
    };
  }

  exitRGBMode() {
    // Restore all UI elements after leaving RGB mode
    this.renderer.drawOriginalImageWithRank();

    // Restore original titles and UI
    const mainTitle = document.querySelector("h1");
    mainTitle.textContent = "SVD in Color Space";

    const equation = document.querySelector(".equation");
    if (equation) {
      equation.innerHTML = "A<sub>f</sub> = U × Σ × V<sup>T</sup> &nbsp;&nbsp;";
    }

    // Restore matrix titles
    this.restoreMatrixTitles();

    // Remove RGB mode class
    document.body.classList.remove("rgb-mode");

    // Clear RGB highlighting state
    window.rgbHighlightRows = null;

    // Restore original matrices
    this.renderer.drawUMatrix();
    this.renderer.drawSigmaMatrix();
    this.renderer.drawVMatrix();
    this.renderer.updateULabels();
  }

  setupUMatrixInteraction() {
    for (let col = 0; col < 3; col++) {
      const canvas = document.getElementById(`uMatrix${col}`);

      // Remove existing listeners to prevent duplicates
      canvas.onmouseover = null;
      canvas.onmouseleave = null;

      canvas.onmouseover = () => {
        if (this.state.hoveredVTRow !== col) {
          this.state.hoveredVTRow = col;
          this.renderer.drawUMatrix(); // Redraw U matrix with coloring
          this.renderer.drawSigmaMatrix(); // Redraw sigma matrix with coloring
          this.renderer.drawVMatrix(); // Redraw V matrix with highlighting
          this.renderer.updateULabels(); // Update labels to show principal component
        }
      };

      canvas.onmouseleave = () => {
        if (this.state.hoveredVTRow === col) {
          this.state.hoveredVTRow = -1;
          this.renderer.drawUMatrix(); // Redraw U matrix without coloring
          this.renderer.drawSigmaMatrix(); // Redraw sigma matrix without coloring
          this.renderer.drawVMatrix(); // Redraw V matrix without highlighting
          this.renderer.updateULabels(); // Reset labels to original text
        }
      };
    }
  }

  setupSigmaMatrixInteraction() {
    const canvas = document.getElementById("sigmaMatrix");

    // Remove existing listeners to prevent duplicates
    canvas.onmousemove = null;
    canvas.onmouseleave = null;

    canvas.onmousemove = (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;

      // Determine which bar is being hovered
      const barWidth = this.canvasSize / this.state.svdResult.sigma.length;
      const col = Math.floor(x / barWidth);

      if (col >= 0 && col < 3 && col !== this.state.hoveredVTRow) {
        this.state.hoveredVTRow = col;
        this.renderer.drawUMatrix(); // Redraw U matrix with coloring
        this.renderer.drawSigmaMatrix(); // Redraw sigma matrix with coloring
        this.renderer.drawVMatrix(); // Redraw V matrix with highlighting
        this.renderer.updateULabels(); // Update labels to show principal component
      }
    };

    canvas.onmouseleave = () => {
      if (this.state.hoveredVTRow !== -1) {
        this.state.hoveredVTRow = -1;
        this.renderer.drawUMatrix(); // Redraw U matrix without coloring
        this.renderer.drawSigmaMatrix(); // Redraw sigma matrix without coloring
        this.renderer.drawVMatrix(); // Redraw V matrix without highlighting
        this.renderer.updateULabels(); // Reset labels to original text
      }
    };
  }

  setupVMatrixInteraction() {
    const canvas = document.getElementById("vMatrix");
    const cellSize = this.canvasSize / 3;

    // Remove existing listeners to prevent duplicates
    canvas.onmousemove = null;
    canvas.onmouseleave = null;

    canvas.onmousemove = (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Determine which row is being hovered
      const row = Math.floor(y / cellSize);

      if (row >= 0 && row < 3 && row !== this.state.hoveredVTRow) {
        this.state.hoveredVTRow = row;
        this.renderer.drawUMatrix(); // Redraw U matrix with coloring
        this.renderer.drawSigmaMatrix(); // Redraw sigma matrix with coloring
        this.renderer.drawVMatrix(); // Redraw V matrix with highlighting
        this.renderer.updateULabels(); // Update labels to show principal component
      }
    };

    canvas.onmouseleave = () => {
      if (this.state.hoveredVTRow !== -1) {
        this.state.hoveredVTRow = -1;
        this.renderer.drawUMatrix(); // Redraw U matrix without coloring
        this.renderer.drawSigmaMatrix(); // Redraw sigma matrix without coloring
        this.renderer.drawVMatrix(); // Redraw V matrix without highlighting
        this.renderer.updateULabels(); // Reset labels to original text
      }
    };
  }

  // Utility methods
  showSliderNotification(message) {
    // Create notification element if it doesn't exist
    let notification = document.getElementById("sliderNotification");
    if (!notification) {
      notification = document.createElement("div");
      notification.id = "sliderNotification";
      notification.style.cssText = `
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #007bff;
                    color: white;
                    padding: 10px 20px;
                    border-radius: 5px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    z-index: 10000;
                    font-size: 14px;
                    max-width: 400px;
                    text-align: center;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                `;
      document.body.appendChild(notification);
    }

    // Show notification
    notification.textContent = message;
    notification.style.opacity = "1";

    // Hide after 2.5 seconds
    setTimeout(() => {
      notification.style.opacity = "0";
    }, 2500);
  }

  addShapesToPattern(numNewShapes) {
    const shapeTypes = CONFIG.SHAPE_TYPES;

    // Add new shapes to the existing pattern
    for (
      let i = 0;
      i < numNewShapes && this.state.fixedShapes.length < CONFIG.MAX_SHAPES;
      i++
    ) {
      const currentShapeIndex = this.state.fixedShapes.length;
      const shapeType = shapeTypes[currentShapeIndex % shapeTypes.length];

      this.state.fixedShapes.push({
        type: shapeType,
        color: null, // Color will be assigned later
        x: Math.floor(Math.random() * (imageSize - 40)) + 20,
        y: Math.floor(Math.random() * (imageSize - 40)) + 20,
        size: Math.floor(Math.random() * 20) + 15,
        rotation: Math.random() * 2 * Math.PI,
      });
    }
  }

  // Update rank slider limits based on current color complexity
  updateRankSliderLimits() {
    const actualRank = Math.min(this.state.colorComplexity, 3);
    const rankSlider = document.getElementById("rankSlider");

    // Update max value to match actual rank
    rankSlider.max = actualRank;

    // If current rank is higher than the new max, adjust it
    if (this.state.currentRank > actualRank) {
      this.state.currentRank = actualRank;
      rankSlider.value = this.state.currentRank;
      document.getElementById("rankValue").textContent = this.state.currentRank;
    }
  }

  restoreMatrixTitles() {
    // Then restore all the other UI elements
    // Restore U matrix display
    const uMatrixContainer = document.querySelector(
      ".matrix-section:nth-child(2) .matrix-canvas-container"
    );
    const originalUDisplay = uMatrixContainer.querySelector(
      'div[style*="display: flex"], div[style*="display: none"]'
    );
    if (originalUDisplay) {
      originalUDisplay.style.display = "flex";
    }

    // Hide the red overlay canvas
    const redOverlayCanvas = document.getElementById("redOverlayCanvas");
    if (redOverlayCanvas) {
      redOverlayCanvas.style.display = "none";
    }
    const uTitle = document.querySelector(
      ".matrix-section:nth-child(2) .matrix-title"
    );
    const uSubtitle = document.querySelector(
      ".matrix-section:nth-child(2) .matrix-subtitle"
    );
    const sigmaTitle = document.querySelector(
      ".matrix-section:nth-child(3) .matrix-title"
    );
    const sigmaSubtitle = document.querySelector(
      ".matrix-section:nth-child(3) .matrix-subtitle"
    );
    const vTitle = document.querySelector(
      ".matrix-section:nth-child(4) .matrix-title"
    );
    const vSubtitle = document.querySelector(
      ".matrix-section:nth-child(4) .matrix-subtitle"
    );

    uTitle.innerHTML = "U";
    uTitle.style.color = "";
    uSubtitle.innerHTML = "Spatial Activations [10,000 × 3]";

    sigmaTitle.innerHTML = "Σ";
    sigmaTitle.style.color = "";
    sigmaSubtitle.innerHTML = "Importance Weights [3 x 3]";

    vTitle.innerHTML = "V<sup>T</sup>";
    vTitle.style.color = "";
    vSubtitle.innerHTML = "Principal Color Axes [3 x 3]";
  }
}
