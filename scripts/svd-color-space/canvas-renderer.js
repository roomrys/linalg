import { CONFIG } from "./constants.js";

export class CanvasRenderer {
  constructor(appState) {
    this.state = appState;
    this.canvasSize = CONFIG.CANVAS_SIZE;
    this.uCanvasSize = CONFIG.U_CANVAS_SIZE;
    this.imageSize = CONFIG.IMAGE_SIZE;
  }

  drawAll() {
    this.drawOriginalImageWithRank();
    this.drawUMatrix();
    this.drawSigmaMatrix();
    this.drawVMatrix();
    this.updateImageTitle();
  }

  drawOriginalImageWithRank() {
    const canvas = document.getElementById("originalImage");
    const ctx = canvas.getContext("2d");
    const imageData = ctx.createImageData(this.canvasSize, this.canvasSize);

    // Check if we're hovering over A and should use top-k RGB components
    const useTopKRGBComponents = this.state.hoveredOriginalImage;

    if (this.state.currentRank === 0) {
      // Black image for rank 0
      for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] = 0; // Red
        imageData.data[i + 1] = 0; // Green
        imageData.data[i + 2] = 0; // Blue
        imageData.data[i + 3] = 255; // Alpha
      }
    } else {
      // Check if we're hovering over A and should use top-k RGB components
      const useTopKRGBComponents = this.state.hoveredOriginalImage;
      let componentsToUse;

      if (useTopKRGBComponents) {
        // In RGB mode, use top k RGB channels based on their standard deviations
        const rgbChannels = this.getRGBChannelsByStdDev();
        const topKChannels = rgbChannels.slice(0, this.state.currentRank);

        // Reconstruct using only selected RGB channels (not SVD components)
        for (let i = 0; i < this.canvasSize; i++) {
          for (let j = 0; j < this.canvasSize; j++) {
            // Map canvas coordinates to image coordinates
            const imgI = Math.floor((i * this.imageSize) / this.canvasSize);
            const imgJ = Math.floor((j * this.imageSize) / this.canvasSize);

            // Get original RGB values
            const [originalR, originalG, originalB] =
              this.state.imageData[imgI][imgJ];

            // Start with black and add only the selected RGB channels
            let r = 0,
              g = 0,
              b = 0;

            // Add contributions from the top k RGB channels only
            topKChannels.forEach((channel) => {
              if (channel.channel === "R") r = originalR;
              if (channel.channel === "G") g = originalG;
              if (channel.channel === "B") b = originalB;
            });

            const pixelIndex = (i * this.canvasSize + j) * 4;
            imageData.data[pixelIndex] = r; // Red
            imageData.data[pixelIndex + 1] = g; // Green
            imageData.data[pixelIndex + 2] = b; // Blue
            imageData.data[pixelIndex + 3] = 255; // Alpha
          }
        }

        // Skip the SVD reconstruction since we did RGB reconstruction above
        ctx.putImageData(imageData, 0, 0);
        this.setupOriginalImageInteraction();
        return;
      } else {
        // Use the first k components in order (normal SVD behavior)
        componentsToUse = [];
        for (let k = 0; k < this.state.currentRank; k++) {
          componentsToUse.push({ index: k });
        }
      }

      // Compute rank-k approximation
      for (let i = 0; i < this.canvasSize; i++) {
        for (let j = 0; j < this.canvasSize; j++) {
          // Map canvas coordinates to image coordinates
          const imgI = Math.floor((i * this.imageSize) / this.canvasSize);
          const imgJ = Math.floor((j * this.imageSize) / this.canvasSize);
          const flatIndex = imgI * this.imageSize + imgJ;

          // Compute rank-k approximation: sum of selected components
          let r = 0,
            g = 0,
            b = 0;
          componentsToUse.forEach((comp) => {
            const k = comp.index;
            const sigma = this.state.svdResult.sigma[k];
            const u_val = this.state.svdResult.U[flatIndex][k];
            const v_r = this.state.svdResult.VT[k][0];
            const v_g = this.state.svdResult.VT[k][1];
            const v_b = this.state.svdResult.VT[k][2];

            r += u_val * sigma * v_r;
            g += u_val * sigma * v_g;
            b += u_val * sigma * v_b;
          });

          // Scale and clamp to [0, 255]
          r = Math.max(0, Math.min(255, r * 255));
          g = Math.max(0, Math.min(255, g * 255));
          b = Math.max(0, Math.min(255, b * 255));

          const pixelIndex = (i * this.canvasSize + j) * 4;
          imageData.data[pixelIndex] = r; // Red
          imageData.data[pixelIndex + 1] = g; // Green
          imageData.data[pixelIndex + 2] = b; // Blue
          imageData.data[pixelIndex + 3] = 255; // Alpha
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Setup hover interaction for original image A
    this.setupOriginalImageInteraction();
  }

  drawUMatrix() {
    // Draw each U column as a separate square canvas
    for (let col = 0; col < 3; col++) {
      const canvas = document.getElementById(`uMatrix${col}`);
      const ctx = canvas.getContext("2d");

      // Clear canvas
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, this.uCanvasSize, this.uCanvasSize);

      // Find min/max for normalization for this column
      let minVal = Infinity,
        maxVal = -Infinity;
      for (let i = 0; i < this.state.svdResult.U.length; i++) {
        const val = this.state.svdResult.U[i][col];
        minVal = Math.min(minVal, val);
        maxVal = Math.max(maxVal, val);
      }

      // Determine if this column should be colored based on V^T hover or rank approximation
      const shouldColor =
        this.state.hoveredVTRow === col ||
        (this.state.isRankSliderActive && col < this.state.currentRank) ||
        (window.showFullRankHighlight && col < 3); // Draw column as square heatmap (unsquished)
      for (let i = 0; i < this.imageSize; i++) {
        for (let j = 0; j < this.imageSize; j++) {
          const idx = i * this.imageSize + j;
          const val = this.state.svdResult.U[idx][col];

          if (shouldColor) {
            // Use the exact same calculation as rank-1 components
            const sigma = this.state.svdResult.sigma[col];
            const vRow = this.state.svdResult.VT[col];
            const uValue = this.state.svdResult.U[idx][col];

            // Calculate u_i * sigma_i * v_i^T for this pixel (same as rank-1 components)
            const r = Math.max(
              0,
              Math.min(255, uValue * sigma * vRow[0] * 255)
            );
            const g = Math.max(
              0,
              Math.min(255, uValue * sigma * vRow[1] * 255)
            );
            const b = Math.max(
              0,
              Math.min(255, uValue * sigma * vRow[2] * 255)
            );

            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          } else {
            // Default grayscale
            const normalized = (val - minVal) / (maxVal - minVal);
            const intensity = Math.floor(normalized * 255);
            ctx.fillStyle = `rgb(${intensity}, ${intensity}, ${intensity})`;
          }

          // Map to square canvas coordinates
          const x = (j / this.imageSize) * this.uCanvasSize;
          const y = (i / this.imageSize) * this.uCanvasSize;
          const w = this.uCanvasSize / this.imageSize;
          const h = this.uCanvasSize / this.imageSize;

          ctx.fillRect(x, y, w + 1, h + 1);
        }
      }
    }

    // Set up hover interactions for each U matrix canvas
    this.setupUMatrixInteraction();
  }

  drawSigmaMatrix() {
    const canvas = document.getElementById("sigmaMatrix");
    const ctx = canvas.getContext("2d");

    // Clear canvas
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, this.canvasSize, this.canvasSize);

    // Draw singular values as bars
    const maxSigma = Math.max(...this.state.svdResult.sigma);
    const barWidth = this.canvasSize / this.state.svdResult.sigma.length;
    const margin = 20;

    for (let i = 0; i < this.state.svdResult.sigma.length; i++) {
      const height =
        (this.state.svdResult.sigma[i] / maxSigma) *
        (this.canvasSize - 2 * margin);
      const x = i * barWidth + barWidth * 0.1;
      const y = this.canvasSize - margin - height;
      const w = barWidth * 0.8;

      // Calculate the color for this singular value based on corresponding V^T row
      let barColor = "#999"; // Default gray
      if (
        this.state.hoveredVTRow === i ||
        (this.state.isRankSliderActive && i < this.state.currentRank) ||
        (window.showFullRankHighlight && i < 3)
      ) {
        // Get the RGB values for this V^T row (how this component mixes colors)
        const row = this.state.svdResult.VT[i];
        const rVal = Math.abs(row[0]);
        const gVal = Math.abs(row[1]);
        const bVal = Math.abs(row[2]);

        // Normalize to 0-255 range for color display
        const maxVal = Math.max(rVal, gVal, bVal);
        const r = Math.floor((rVal / maxVal) * 255);
        const g = Math.floor((gVal / maxVal) * 255);
        const b = Math.floor((bVal / maxVal) * 255);

        barColor = `rgb(${r}, ${g}, ${b})`;
      }

      ctx.fillStyle = barColor;
      ctx.fillRect(x, y, w, height);

      // Add value label
      ctx.fillStyle = "black";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        this.state.svdResult.sigma[i].toFixed(1),
        i * barWidth + barWidth / 2,
        this.canvasSize - 5
      );
      ctx.fillText(`σ${i + 1}`, i * barWidth + barWidth / 2, y - 5);
    }

    // Set up hover interactions for sigma matrix
    this.setupSigmaMatrixInteraction(canvas, barWidth);
  }

  drawVMatrix() {
    const canvas = document.getElementById("vMatrix");
    const ctx = canvas.getContext("2d");

    // Clear canvas
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, this.canvasSize, this.canvasSize);

    const cellSize = this.canvasSize / 3;

    // Find global min/max for consistent coloring
    let minVal = Infinity,
      maxVal = -Infinity;
    for (let i = 0; i < this.state.svdResult.VT.length; i++) {
      for (let j = 0; j < this.state.svdResult.VT[i].length; j++) {
        minVal = Math.min(minVal, this.state.svdResult.VT[i][j]);
        maxVal = Math.max(maxVal, this.state.svdResult.VT[i][j]);
      }
    }

    // Calculate row colors first for consistent coloring
    const rowColors = [];
    const rowNames = [];

    for (let i = 0; i < 3; i++) {
      const row = this.state.svdResult.VT[i];

      // Get the RGB values for this row (how this component mixes colors)
      const rVal = Math.abs(row[0]);
      const gVal = Math.abs(row[1]);
      const bVal = Math.abs(row[2]);

      // Normalize to 0-255 range for color display
      const maxVal = Math.max(rVal, gVal, bVal);
      const r = Math.floor((rVal / maxVal) * 255);
      const g = Math.floor((gVal / maxVal) * 255);
      const b = Math.floor((bVal / maxVal) * 255);

      // Create a lighter version of the color for background (add transparency effect)
      const lightRowColor = `rgba(${r}, ${g}, ${b}, 0.3)`;
      const rowColor = `rgb(${r}, ${g}, ${b})`;

      rowColors.push({ light: lightRowColor, full: rowColor });

      // Determine the dominant color name
      if (rVal > gVal && rVal > bVal) {
        rowNames.push("Red");
      } else if (gVal > rVal && gVal > bVal) {
        rowNames.push("Green");
      } else {
        rowNames.push("Blue");
      }
    }

    // Draw matrix cells with colored row backgrounds
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const val = this.state.svdResult.VT[i][j];

        // Use the row's light color as background (no color changes)
        ctx.fillStyle = rowColors[i].light;
        ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);

        // Draw normal border for all cells
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 1;
        ctx.strokeRect(j * cellSize, i * cellSize, cellSize, cellSize);

        // Add value text (always black since we use light colors)
        ctx.fillStyle = "black";
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          val.toFixed(3),
          j * cellSize + cellSize / 2,
          i * cellSize + cellSize / 2 + 5
        );
      }
    }

    // Draw shadow box around hovered row or active rank components
    for (let i = 0; i < 3; i++) {
      // Check for RGB-specific highlighting when displaying RGB identity matrix
      const isRGBHighlighted =
        window.rgbHighlightRows &&
        ((i === 0 && window.rgbHighlightRows.red) ||
          (i === 1 && window.rgbHighlightRows.green) ||
          (i === 2 && window.rgbHighlightRows.blue));

      const shouldHighlight =
        this.state.hoveredVTRow === i ||
        (this.state.isRankSliderActive && i < this.state.currentRank) ||
        (window.showFullRankHighlight && i < 3) ||
        isRGBHighlighted;
      if (shouldHighlight) {
        const rowY = i * cellSize;
        const margin = 6; // Margin to keep shadow within canvas bounds

        // Create shadow effect
        ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        // Draw shadow box around the entire row, inset by margin
        ctx.strokeStyle = "rgba(0, 123, 255, 0.8)";
        ctx.lineWidth = 3;
        ctx.strokeRect(
          margin,
          rowY + margin,
          this.canvasSize - 2 * margin,
          cellSize - 2 * margin
        );

        // Reset shadow
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
    }

    // Draw row labels with full color backgrounds
    ctx.textAlign = "right";
    ctx.font = "12px Arial";

    for (let i = 0; i < 3; i++) {
      // Draw colored background for the row label
      const labelX = -45;
      const labelY = i * cellSize + cellSize / 2 - 7;
      const labelWidth = 40;
      const labelHeight = 14;

      ctx.fillStyle = rowColors[i].full;
      ctx.fillRect(labelX, labelY, labelWidth, labelHeight);

      // Draw contrasting text
      const r = parseInt(rowColors[i].full.match(/\d+/g)[0]);
      const g = parseInt(rowColors[i].full.match(/\d+/g)[1]);
      const b = parseInt(rowColors[i].full.match(/\d+/g)[2]);
      const brightness = r * 0.299 + g * 0.587 + b * 0.114;
      ctx.fillStyle = brightness > 127 ? "black" : "white";
      ctx.font = "bold 10px Arial";
      ctx.textAlign = "center";
      ctx.fillText(rowNames[i], labelX + labelWidth / 2, labelY + 10);
    }

    // Add mouse event listeners for hover interaction
    this.setupVMatrixInteraction(canvas, cellSize);
  }

  updateImageTitle() {
    const subtitleElement = document.querySelector(".matrix-subtitle");
    const actualRank = Math.min(this.state.colorComplexity, 3); // Actual rank of the image

    if (this.state.currentRank === actualRank) {
      subtitleElement.innerHTML = "Original [100×100×3]";
    } else if (this.state.currentRank === 0) {
      subtitleElement.innerHTML = "Zero [100×100×3]";
    } else {
      subtitleElement.innerHTML = `Rank-${this.state.currentRank} Approximation [100×100×3]`;
    }
  }

  updateULabels() {
    for (let i = 0; i < 3; i++) {
      const label = document.getElementById(`uLabel${i}`);
      const shapeInfo = document.getElementById(`uShapeInfo${i}`);
      const isActive =
        this.state.hoveredVTRow === i ||
        (this.state.isRankSliderActive && i < this.state.currentRank) ||
        (window.showFullRankHighlight && i < 3);
      if (isActive) {
        // Calculate dynamic color based on V^T row (same as sigma bars)
        const row = this.state.svdResult.VT[i];
        const rVal = Math.abs(row[0]);
        const gVal = Math.abs(row[1]);
        const bVal = Math.abs(row[2]);

        // Normalize to 0-255 range for color display
        const maxVal = Math.max(rVal, gVal, bVal);
        let r = Math.floor((rVal / maxVal) * 255);
        let g = Math.floor((gVal / maxVal) * 255);
        let b = Math.floor((bVal / maxVal) * 255);

        // Calculate luminance using standard formula
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

        // If the color is too light (luminance > 127), darken it for better contrast
        if (luminance > 127) {
          // Darken more aggressively by reducing all components proportionally
          const darkenFactor = 0.7;
          r = Math.floor(r * darkenFactor);
          g = Math.floor(g * darkenFactor);
          b = Math.floor(b * darkenFactor);
        }

        const dynamicColor = `rgb(${r}, ${g}, ${b})`;

        label.innerHTML = `σ<sub>${i + 1}</sub>u<sub>${i + 1}</sub>v<sub>${
          i + 1
        }</sub><sup>T</sup>`;
        label.style.color = dynamicColor;
        shapeInfo.innerHTML = `[100 × 100 x 3]`;
        shapeInfo.style.color = dynamicColor;
      } else {
        label.innerHTML = `U<sub>:,${i + 1}</sub>`;
        label.style.color = "#333";
        shapeInfo.innerHTML = `→ [100 × 100]`;
        shapeInfo.style.color = "#666";
      }
    }
  }

  setupOriginalImageInteraction() {
    const canvas = document.getElementById("originalImage");

    // Remove existing listeners to prevent duplicates
    canvas.onmouseenter = null;
    canvas.onmouseleave = null;

    canvas.onmouseenter = () => {
      if (!this.state.hoveredOriginalImage) {
        this.state.hoveredOriginalImage = true;
        this.drawRGBChannelsInMainMatrices();
        // Also update matrix A to show rank-k approximation using top RGB channels
        this.drawOriginalImageWithRank();
      }
    };

    canvas.onmousemove = (event) => {
      if (this.state.hoveredOriginalImage) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Convert canvas coordinates to image coordinates
        const imgX = Math.floor((x * this.imageSize) / this.canvasSize);
        const imgY = Math.floor((y * this.imageSize) / this.canvasSize);

        // Get the RGB values from the displayed rank-k approximation at this position
        if (
          imgX >= 0 &&
          imgX < this.imageSize &&
          imgY >= 0 &&
          imgY < this.imageSize
        ) {
          const [r, g, b] = this.getRankApproximationRGBAt(imgX, imgY);
          this.drawRGBChannelsWithHighlight(imgX, imgY, r, g, b);
          // Keep the rank-k approximation in A updated
          this.drawOriginalImageWithRank();
        }
      }
    };

    canvas.onmouseleave = () => {
      if (this.state.hoveredOriginalImage) {
        // First restore the original image display in A (while still hovering)
        this.state.hoveredOriginalImage = false;
        this.drawOriginalImageWithRank();

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

        // Restore original titles and subtitles
        const mainTitle = document.querySelector("h1");
        mainTitle.textContent = "SVD in Color Space";

        // Restore original SVD equation
        const equation = document.querySelector(".equation");
        if (equation) {
          equation.innerHTML =
            "A<sub>f</sub> = U × Σ × V<sup>T</sup> &nbsp;&nbsp;";
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

        // Remove RGB mode class for mobile
        document.body.classList.remove("rgb-mode");

        // Clear RGB highlighting state
        window.rgbHighlightRows = null;

        // Restore original matrices
        this.drawUMatrix();
        this.drawSigmaMatrix();
        this.drawVMatrix();
        this.updateULabels();
      }
    };
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
          this.drawUMatrix(); // Redraw U matrix with coloring
          this.drawSigmaMatrix(); // Redraw sigma matrix with coloring
          this.drawVMatrix(); // Redraw V matrix with highlighting
          this.updateULabels(); // Update labels to show principal component
        }
      };

      canvas.onmouseleave = () => {
        if (this.state.hoveredVTRow === col) {
          this.state.hoveredVTRow = -1;
          this.drawUMatrix(); // Redraw U matrix without coloring
          this.drawSigmaMatrix(); // Redraw sigma matrix without coloring
          this.drawVMatrix(); // Redraw V matrix without highlighting
          this.updateULabels(); // Reset labels to original text
        }
      };
    }
  }

  setupSigmaMatrixInteraction(canvas, barWidth) {
    // Remove existing listeners to prevent duplicates
    canvas.onmousemove = null;
    canvas.onmouseleave = null;

    canvas.onmousemove = (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;

      // Determine which bar is being hovered
      const col = Math.floor(x / barWidth);

      if (col >= 0 && col < 3 && col !== this.state.hoveredVTRow) {
        this.state.hoveredVTRow = col;
        this.drawUMatrix(); // Redraw U matrix with coloring
        this.drawSigmaMatrix(); // Redraw sigma matrix with coloring
        this.drawVMatrix(); // Redraw V matrix with highlighting
        this.updateULabels(); // Update labels to show principal component
      }
    };

    canvas.onmouseleave = () => {
      if (this.state.hoveredVTRow !== -1) {
        this.state.hoveredVTRow = -1;
        this.drawUMatrix(); // Redraw U matrix without coloring
        this.drawSigmaMatrix(); // Redraw sigma matrix without coloring
        this.drawVMatrix(); // Redraw V matrix without highlighting
        this.updateULabels(); // Reset labels to original text
      }
    };
  }

  setupVMatrixInteraction(canvas, cellSize) {
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
        this.drawUMatrix(); // Redraw U matrix with coloring
        this.drawSigmaMatrix(); // Redraw sigma matrix with coloring
        this.drawVMatrix(); // Redraw V matrix with highlighting
        this.updateULabels(); // Update labels to show principal component
      }
    };

    canvas.onmouseleave = () => {
      if (this.state.hoveredVTRow !== -1) {
        this.state.hoveredVTRow = -1;
        this.drawUMatrix(); // Redraw U matrix without coloring
        this.drawSigmaMatrix(); // Redraw sigma matrix without coloring
        this.drawVMatrix(); // Redraw V matrix without highlighting
        this.updateULabels(); // Reset labels to original text
      }
    };
  }

  drawRGBChannelsInMainMatrices() {
    // Update main page title
    const mainTitle = document.querySelector("h1");
    mainTitle.textContent = "RGB Channel Decomposition";

    // Change equation to show RGB identity decomposition
    const equation = document.querySelector(".equation");
    if (equation) {
      equation.innerHTML = "A<sub>f</sub> = A<sub>f</sub> × I &nbsp;&nbsp;";
    }

    // Show the individual U column matrices and draw RGB channels in them
    const uMatrixContainer = document.querySelector(
      ".matrix-section:nth-child(2) .matrix-canvas-container"
    );

    // Make sure the original U matrix display is visible
    const originalUDisplay = uMatrixContainer.querySelector(
      'div[style*="display: flex"], div[style*="display: none"]'
    );
    if (originalUDisplay) {
      originalUDisplay.style.display = "flex";
    }

    // Hide any existing red overlay canvas
    const redOverlayCanvas = document.getElementById("redOverlayCanvas");
    if (redOverlayCanvas) {
      redOverlayCanvas.style.display = "none";
    }

    const uCanvasSize = CONFIG.U_CANVAS_SIZE;

    // Draw Red channel in first U column (uMatrix0)
    const redCanvas = document.getElementById("uMatrix0");
    const redCtx = redCanvas.getContext("2d");
    const redImageData = redCtx.createImageData(uCanvasSize, uCanvasSize);

    // Draw Green channel in second U column (uMatrix1)
    const greenCanvas = document.getElementById("uMatrix1");
    const greenCtx = greenCanvas.getContext("2d");
    const greenImageData = greenCtx.createImageData(uCanvasSize, uCanvasSize);

    // Draw Blue channel in third U column (uMatrix2)
    const blueCanvas = document.getElementById("uMatrix2");
    const blueCtx = blueCanvas.getContext("2d");
    const blueImageData = blueCtx.createImageData(uCanvasSize, uCanvasSize);

    for (let i = 0; i < uCanvasSize; i++) {
      for (let j = 0; j < uCanvasSize; j++) {
        const imgI = Math.floor((i * this.imageSize) / uCanvasSize);
        const imgJ = Math.floor((j * this.imageSize) / uCanvasSize);
        const pixelIndex = (i * uCanvasSize + j) * 4;
        const [r, g, b] = this.state.imageData[imgI][imgJ];

        // Red channel (color-tinted)
        redImageData.data[pixelIndex] = r; // Red component
        redImageData.data[pixelIndex + 1] = 0; // No green
        redImageData.data[pixelIndex + 2] = 0; // No blue
        redImageData.data[pixelIndex + 3] = 255; // Alpha

        // Green channel (color-tinted)
        greenImageData.data[pixelIndex] = 0; // No red
        greenImageData.data[pixelIndex + 1] = g; // Green component
        greenImageData.data[pixelIndex + 2] = 0; // No blue
        greenImageData.data[pixelIndex + 3] = 255; // Alpha

        // Blue channel (color-tinted)
        blueImageData.data[pixelIndex] = 0; // No red
        blueImageData.data[pixelIndex + 1] = 0; // No green
        blueImageData.data[pixelIndex + 2] = b; // Blue component
        blueImageData.data[pixelIndex + 3] = 255; // Alpha
      }
    }

    redCtx.putImageData(redImageData, 0, 0);
    greenCtx.putImageData(greenImageData, 0, 0);
    blueCtx.putImageData(blueImageData, 0, 0);

    // Update U matrix labels to show RGB channels
    document.getElementById("uLabel0").innerHTML = "A<sub>R</sub>";
    document.getElementById("uShapeInfo0").innerHTML = "→ [100 × 100]";
    document.getElementById("uLabel1").innerHTML = "A<sub>G</sub>";
    document.getElementById("uShapeInfo1").innerHTML = "→ [100 × 100]";
    document.getElementById("uLabel2").innerHTML = "A<sub>B</sub>";
    document.getElementById("uShapeInfo2").innerHTML = "→ [100 × 100]";

    // Update U matrix title and subtitle
    const uTitle = document.querySelector(
      ".matrix-section:nth-child(2) .matrix-title"
    );
    const uSubtitle = document.querySelector(
      ".matrix-section:nth-child(2) .matrix-subtitle"
    );
    uTitle.innerHTML = "A<sub>f</sub>";
    uTitle.style.color = "#333";
    uSubtitle.innerHTML = "Channel Activations [10,000 x 3]";

    // Calculate variance squared for each color channel
    const sigmaCanvas = document.getElementById("sigmaMatrix");
    const sigmaCtx = sigmaCanvas.getContext("2d");

    // Clear canvas with white background (same as original)
    sigmaCtx.fillStyle = "white";
    sigmaCtx.fillRect(0, 0, this.canvasSize, this.canvasSize);

    // Calculate variance for each channel across all pixels
    let redSum = 0,
      greenSum = 0,
      blueSum = 0;
    let redSumSq = 0,
      greenSumSq = 0,
      blueSumSq = 0;
    const totalPixels = this.imageSize * this.imageSize;

    for (let i = 0; i < this.imageSize; i++) {
      for (let j = 0; j < this.imageSize; j++) {
        const [r, g, b] = this.state.imageData[i][j];

        redSum += r;
        greenSum += g;
        blueSum += b;

        redSumSq += r * r;
        greenSumSq += g * g;
        blueSumSq += b * b;
      }
    }

    // Calculate variance = E[X²] - (E[X])²
    const redMean = redSum / totalPixels;
    const greenMean = greenSum / totalPixels;
    const blueMean = blueSum / totalPixels;

    const redVariance = redSumSq / totalPixels - redMean * redMean;
    const greenVariance = greenSumSq / totalPixels - greenMean * greenMean;
    const blueVariance = blueSumSq / totalPixels - blueMean * blueMean;

    // Take square root to get standard deviation (analogous to singular values)
    const redStdDev = Math.sqrt(redVariance);
    const greenStdDev = Math.sqrt(greenVariance);
    const blueStdDev = Math.sqrt(blueVariance);

    // Use same drawing style as original sigma matrix
    const stdDevs = [redStdDev, greenStdDev, blueStdDev];
    const colors = ["#e74c3c", "#27ae60", "#3498db"];
    const labels = ["R", "G", "B"];

    const maxStdDev = Math.max(...stdDevs);
    const barWidth = this.canvasSize / stdDevs.length;
    const margin = 20;

    for (let i = 0; i < stdDevs.length; i++) {
      const height = (stdDevs[i] / maxStdDev) * (this.canvasSize - 2 * margin);
      const x = i * barWidth + barWidth * 0.1;
      const y = this.canvasSize - margin - height;
      const w = barWidth * 0.8;

      // Use channel colors instead of blue/gray
      sigmaCtx.fillStyle = colors[i];
      sigmaCtx.fillRect(x, y, w, height);

      // Add value label (same style as original)
      sigmaCtx.fillStyle = "black";
      sigmaCtx.font = "12px Arial";
      sigmaCtx.textAlign = "center";
      sigmaCtx.fillText(
        stdDevs[i].toFixed(1),
        i * barWidth + barWidth / 2,
        this.canvasSize - 5
      );
      sigmaCtx.fillText(`σ${labels[i]}`, i * barWidth + barWidth / 2, y - 5);
    }

    // Temporarily replace state.svdResult.VT with RGB identity matrix and reuse drawVMatrix()
    const originalVT = this.state.svdResult.VT;

    // Set RGB identity matrix: [1,0,0], [0,1,0], [0,0,1]
    this.state.svdResult.VT = [
      [1, 0, 0], // Red row
      [0, 1, 0], // Green row
      [0, 0, 1], // Blue row
    ];

    // Call the existing drawVMatrix function to maintain consistent styling
    this.drawVMatrix();

    // Restore original VT matrix
    this.state.svdResult.VT = originalVT;

    // Update Sigma matrix title and subtitle
    const sigmaTitle = document.querySelector(
      ".matrix-section:nth-child(3) .matrix-title"
    );
    const sigmaSubtitle = document.querySelector(
      ".matrix-section:nth-child(3) .matrix-subtitle"
    );
    sigmaTitle.innerHTML = "Σ<sub>RGB</sub>";
    sigmaTitle.style.color = "#333";
    sigmaSubtitle.innerHTML = "Standard Deviation [R, G, B]";

    // Update V^T matrix title and subtitle
    const vTitle = document.querySelector(
      ".matrix-section:nth-child(4) .matrix-title"
    );
    const vSubtitle = document.querySelector(
      ".matrix-section:nth-child(4) .matrix-subtitle"
    );
    vTitle.innerHTML = "I";
    vTitle.style.color = "#333";
    vSubtitle.innerHTML = "RGB Color Axes [3 x 3]";

    // Add special class for mobile RGB display
    document.body.classList.add("rgb-mode");
  }

  getRankApproximationRGBAt(imgX, imgY) {
    // Calculate the RGB values at the specified position based on the current rank-k approximation
    // This should match what's being displayed in matrix A during hover mode

    if (this.state.currentRank === 0) {
      return [0, 0, 0]; // Black for rank 0
    }

    // When hovering, we're in RGB channel mode, so use top k RGB channels
    const rgbChannels = this.getRGBChannelsByStdDev();
    const topKChannels = rgbChannels.slice(0, this.state.currentRank);

    // Get original RGB values at this position
    const [originalR, originalG, originalB] = this.state.imageData[imgY][imgX];

    // Start with black and add only the selected RGB channels
    let r = 0,
      g = 0,
      b = 0;

    // Add contributions from the top k RGB channels only
    topKChannels.forEach((channel) => {
      if (channel.channel === "R") r = originalR;
      if (channel.channel === "G") g = originalG;
      if (channel.channel === "B") b = originalB;
    });

    return [r, g, b];
  }

  getRGBChannelsByStdDev() {
    // Calculate standard deviations for each RGB channel (same as RGB mode)
    let redSum = 0,
      greenSum = 0,
      blueSum = 0;
    let redSumSq = 0,
      greenSumSq = 0,
      blueSumSq = 0;
    const totalPixels = this.imageSize * this.imageSize;

    for (let i = 0; i < this.imageSize; i++) {
      for (let j = 0; j < this.imageSize; j++) {
        const [r, g, b] = this.state.imageData[i][j];

        redSum += r;
        greenSum += g;
        blueSum += b;

        redSumSq += r * r;
        greenSumSq += g * g;
        blueSumSq += b * b;
      }
    }

    // Calculate variance = E[X²] - (E[X])²
    const redMean = redSum / totalPixels;
    const greenMean = greenSum / totalPixels;
    const blueMean = blueSum / totalPixels;

    const redVariance = redSumSq / totalPixels - redMean * redMean;
    const greenVariance = greenSumSq / totalPixels - greenMean * greenMean;
    const blueVariance = blueSumSq / totalPixels - blueMean * blueMean;

    // Take square root to get standard deviation
    const redStdDev = Math.sqrt(redVariance);
    const greenStdDev = Math.sqrt(greenVariance);
    const blueStdDev = Math.sqrt(blueVariance);

    // Create array of RGB channels with their standard deviations
    const channels = [
      { channel: "R", stdDev: redStdDev },
      { channel: "G", stdDev: greenStdDev },
      { channel: "B", stdDev: blueStdDev },
    ];

    // Sort by standard deviation (descending)
    channels.sort((a, b) => b.stdDev - a.stdDev);
    return channels;
  }

  drawRGBChannelsWithHighlight(hoverX, hoverY, hoverR, hoverG, hoverB) {
    // Determine which channels have significant contribution (non-zero or above threshold)
    const threshold = CONFIG.HOVER_THRESHOLD; // Minimum value to consider "contributing"
    const redActive = hoverR > threshold;
    const greenActive = hoverG > threshold;
    const blueActive = hoverB > threshold;

    const uCanvasSize = CONFIG.U_CANVAS_SIZE;

    // Draw Red channel in first U column (uMatrix0) with conditional highlighting
    const redCanvas = document.getElementById("uMatrix0");
    const redCtx = redCanvas.getContext("2d");
    const redImageData = redCtx.createImageData(uCanvasSize, uCanvasSize);

    // Draw Green channel in second U column (uMatrix1) with conditional highlighting
    const greenCanvas = document.getElementById("uMatrix1");
    const greenCtx = greenCanvas.getContext("2d");
    const greenImageData = greenCtx.createImageData(uCanvasSize, uCanvasSize);

    // Draw Blue channel in third U column (uMatrix2) with conditional highlighting
    const blueCanvas = document.getElementById("uMatrix2");
    const blueCtx = blueCanvas.getContext("2d");
    const blueImageData = blueCtx.createImageData(uCanvasSize, uCanvasSize);

    for (let i = 0; i < uCanvasSize; i++) {
      for (let j = 0; j < uCanvasSize; j++) {
        const imgI = Math.floor((i * this.imageSize) / uCanvasSize);
        const imgJ = Math.floor((j * this.imageSize) / uCanvasSize);
        const pixelIndex = (i * uCanvasSize + j) * 4;
        const [r, g, b] = this.state.imageData[imgI][imgJ];

        // Red channel with conditional highlighting
        if (redActive) {
          // Full red channel display
          redImageData.data[pixelIndex] = r; // Red component
          redImageData.data[pixelIndex + 1] = 0; // No green
          redImageData.data[pixelIndex + 2] = 0; // No blue
          redImageData.data[pixelIndex + 3] = 255; // Alpha
        } else {
          // Grayscale representation showing intensity (white = high intensity)
          redImageData.data[pixelIndex] = r; // Red = intensity
          redImageData.data[pixelIndex + 1] = r; // Green = intensity
          redImageData.data[pixelIndex + 2] = r; // Blue = intensity
          redImageData.data[pixelIndex + 3] = 255; // Alpha
        }

        // Green channel with conditional highlighting
        if (greenActive) {
          // Full green channel display
          greenImageData.data[pixelIndex] = 0; // No red
          greenImageData.data[pixelIndex + 1] = g; // Green component
          greenImageData.data[pixelIndex + 2] = 0; // No blue
          greenImageData.data[pixelIndex + 3] = 255; // Alpha
        } else {
          // Grayscale representation showing intensity (white = high intensity)
          greenImageData.data[pixelIndex] = g; // Red = intensity
          greenImageData.data[pixelIndex + 1] = g; // Green = intensity
          greenImageData.data[pixelIndex + 2] = g; // Blue = intensity
          greenImageData.data[pixelIndex + 3] = 255; // Alpha
        }

        // Blue channel with conditional highlighting
        if (blueActive) {
          // Full blue channel display
          blueImageData.data[pixelIndex] = 0; // No red
          blueImageData.data[pixelIndex + 1] = 0; // No green
          blueImageData.data[pixelIndex + 2] = b; // Blue component
          blueImageData.data[pixelIndex + 3] = 255; // Alpha
        } else {
          // Grayscale representation showing intensity (white = high intensity)
          blueImageData.data[pixelIndex] = b; // Red = intensity
          blueImageData.data[pixelIndex + 1] = b; // Green = intensity
          blueImageData.data[pixelIndex + 2] = b; // Blue = intensity
          blueImageData.data[pixelIndex + 3] = 255; // Alpha
        }
      }
    }

    redCtx.putImageData(redImageData, 0, 0);
    greenCtx.putImageData(greenImageData, 0, 0);
    blueCtx.putImageData(blueImageData, 0, 0);

    // Add highlight cursors at hover position for active channels
    const cursorX = (hoverX * uCanvasSize) / this.imageSize;
    const cursorY = (hoverY * uCanvasSize) / this.imageSize;

    if (redActive) {
      redCtx.strokeStyle = "#fff";
      redCtx.lineWidth = 2;
      redCtx.strokeRect(cursorX - 2, cursorY - 2, 4, 4);
    }

    if (greenActive) {
      greenCtx.strokeStyle = "#fff";
      greenCtx.lineWidth = 2;
      greenCtx.strokeRect(cursorX - 2, cursorY - 2, 4, 4);
    }

    if (blueActive) {
      blueCtx.strokeStyle = "#fff";
      blueCtx.lineWidth = 2;
      blueCtx.strokeRect(cursorX - 2, cursorY - 2, 4, 4);
    }

    // Update labels to show current pixel values and activity status
    const redLabel = document.getElementById("uLabel0");
    const greenLabel = document.getElementById("uLabel1");
    const blueLabel = document.getElementById("uLabel2");

    // Also update shape info
    const redShapeInfo = document.getElementById("uShapeInfo0");
    const greenShapeInfo = document.getElementById("uShapeInfo1");
    const blueShapeInfo = document.getElementById("uShapeInfo2");

    // Calculate dynamic colors based on RGB identity matrix (same as sigma bars)
    const rgbIdentityRows = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];
    const labels = [redLabel, greenLabel, blueLabel];
    const shapeInfos = [redShapeInfo, greenShapeInfo, blueShapeInfo];
    const activeStates = [redActive, greenActive, blueActive];
    const values = [hoverR, hoverG, hoverB];
    const subscripts = ["R", "G", "B"];

    for (let i = 0; i < 3; i++) {
      let labelColor = "#333";
      let shapeInfoColor = "#666";
      if (activeStates[i]) {
        const row = rgbIdentityRows[i];
        const rVal = Math.abs(row[0]);
        const gVal = Math.abs(row[1]);
        const bVal = Math.abs(row[2]);

        // Normalize to 0-255 range for color display
        const maxVal = Math.max(rVal, gVal, bVal);
        let r = Math.floor((rVal / maxVal) * 255);
        let g = Math.floor((gVal / maxVal) * 255);
        let b = Math.floor((bVal / maxVal) * 255);

        // Calculate luminance using standard formula
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

        // If the color is too light (luminance > 127), darken it for better contrast
        if (luminance > 127) {
          // Darken more aggressively by reducing all components proportionally
          const darkenFactor = 0.7;
          r = Math.floor(r * darkenFactor);
          g = Math.floor(g * darkenFactor);
          b = Math.floor(b * darkenFactor);
        }

        labelColor = `rgb(${r}, ${g}, ${b})`;

        labels[i].innerHTML = `a<sub>f${i + 1}</sub>e<sub>${
          i + 1
        }</sub><sup>T</sup>`;
        shapeInfos[i].innerHTML = `[100 × 100 x 3]`;
        shapeInfos[i].style.color = labelColor;
      } else {
        labels[i].innerHTML = `A<sub>f [:,${i + 1}]</sub>`;
        shapeInfos[i].innerHTML = "→ [100 × 100]";
        shapeInfos[i].style.color = shapeInfoColor;
      }
      labels[i].style.color = labelColor;
    }

    // Update sigma bars with highlighting based on active channels
    this.drawRGBSigmaWithHighlight(
      redActive,
      greenActive,
      blueActive,
      hoverR,
      hoverG,
      hoverB
    );

    // Update V^T matrix with highlighting based on active channels
    // Save the original hoveredVTRow state
    const originalHoveredVTRow = this.state.hoveredVTRow;

    // Set highlighting based on which color channels are active
    // Since hoveredVTRow can only highlight one row at a time, we need a different approach
    // Let's create a custom highlighting system for multiple rows
    window.rgbHighlightRows = {
      red: redActive,
      green: greenActive,
      blue: blueActive,
    };

    // For now, set hoveredVTRow to -1 and modify drawVMatrix to check our custom highlighting
    this.state.hoveredVTRow = -1;

    // Draw V^T matrix with RGB identity and highlighting
    const originalVT = this.state.svdResult.VT;
    this.state.svdResult.VT = [
      [1, 0, 0], // Red row
      [0, 1, 0], // Green row
      [0, 0, 1], // Blue row
    ];
    this.drawVMatrix();
    this.state.svdResult.VT = originalVT;

    // Restore original hoveredVTRow state
    this.state.hoveredVTRow = originalHoveredVTRow;
  }

  drawRGBSigmaWithHighlight(
    redActive,
    greenActive,
    blueActive,
    hoverR,
    hoverG,
    hoverB
  ) {
    // Get the sigma canvas and recalculate the RGB standard deviations
    const sigmaCanvas = document.getElementById("sigmaMatrix");
    const sigmaCtx = sigmaCanvas.getContext("2d");

    // Clear canvas with white background
    sigmaCtx.fillStyle = "white";
    sigmaCtx.fillRect(0, 0, this.canvasSize, this.canvasSize);

    // Recalculate RGB standard deviations (same as in drawRGBChannelsInMainMatrices)
    let redSum = 0,
      greenSum = 0,
      blueSum = 0;
    let redSumSq = 0,
      greenSumSq = 0,
      blueSumSq = 0;
    const totalPixels = this.imageSize * this.imageSize;

    for (let i = 0; i < this.imageSize; i++) {
      for (let j = 0; j < this.imageSize; j++) {
        const [r, g, b] = this.state.imageData[i][j];

        redSum += r;
        greenSum += g;
        blueSum += b;

        redSumSq += r * r;
        greenSumSq += g * g;
        blueSumSq += b * b;
      }
    }

    const redMean = redSum / totalPixels;
    const greenMean = greenSum / totalPixels;
    const blueMean = blueSum / totalPixels;

    const redVariance = redSumSq / totalPixels - redMean * redMean;
    const greenVariance = greenSumSq / totalPixels - greenMean * greenMean;
    const blueVariance = blueSumSq / totalPixels - blueMean * blueMean;

    const redStdDev = Math.sqrt(redVariance);
    const greenStdDev = Math.sqrt(greenVariance);
    const blueStdDev = Math.sqrt(blueVariance);

    const stdDevs = [redStdDev, greenStdDev, blueStdDev];
    const activeStates = [redActive, greenActive, blueActive];
    const labels = ["R", "G", "B"];

    const maxStdDev = Math.max(...stdDevs);
    const barWidth = this.canvasSize / stdDevs.length;
    const margin = 20;

    for (let i = 0; i < stdDevs.length; i++) {
      const height = (stdDevs[i] / maxStdDev) * (this.canvasSize - 2 * margin);
      const x = i * barWidth + barWidth * 0.1;
      const y = this.canvasSize - margin - height;
      const w = barWidth * 0.8;

      // Calculate dynamic color based on RGB identity matrix (same approach as SVD sigma bars)
      let barColor = "#999"; // Default gray
      if (activeStates[i]) {
        // For RGB mode, we use the RGB identity matrix rows: [1,0,0], [0,1,0], [0,0,1]
        const rgbIdentityRows = [
          [1, 0, 0],
          [0, 1, 0],
          [0, 0, 1],
        ];
        const row = rgbIdentityRows[i];
        const rVal = Math.abs(row[0]);
        const gVal = Math.abs(row[1]);
        const bVal = Math.abs(row[2]);

        // Normalize to 0-255 range for color display
        const maxVal = Math.max(rVal, gVal, bVal);
        const r = Math.floor((rVal / maxVal) * 255);
        const g = Math.floor((gVal / maxVal) * 255);
        const b = Math.floor((bVal / maxVal) * 255);

        barColor = `rgb(${r}, ${g}, ${b})`;
      }

      sigmaCtx.fillStyle = barColor;
      sigmaCtx.fillRect(x, y, w, height);

      // Add value label (same style as original)
      sigmaCtx.fillStyle = "black";
      sigmaCtx.font = "12px Arial";
      sigmaCtx.textAlign = "center";
      sigmaCtx.fillText(
        stdDevs[i].toFixed(1),
        i * barWidth + barWidth / 2,
        this.canvasSize - 5
      );
      sigmaCtx.fillText(`σ${labels[i]}`, i * barWidth + barWidth / 2, y - 5);
    }
  }
}
