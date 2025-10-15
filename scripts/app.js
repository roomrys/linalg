import { DOMManager } from "./dom-manager.js";
import { GridRenderer } from "./grid-renderer.js";
import { VectorRenderer } from "./vector-renderer.js";
import { UIController } from "./ui-controller.js";

class LinearAlgebraApp {
  constructor() {
    this.dom = new DOMManager();
    this.gridRenderer = new GridRenderer(
      this.dom.elements.grid.xContainer,
      this.dom.elements.grid.yContainer
    );
    this.vectorRenderer = new VectorRenderer({
      v: this.dom.elements.vectors.v,
      Av: this.dom.elements.vectors.Av,
      matrix: this.dom.elements.matrix,
    });
    this.uiController = new UIController(
      this.dom,
      this.gridRenderer,
      this.vectorRenderer
    );

    this.initialize();
  }

  parseURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);

    // Default values
    let matrix = { a11: 1, a12: 0, a21: 0, a22: 1 };
    let vector = { v1: 3, v2: -3 };

    // Parse matrix from URL
    const matrixParam = urlParams.get("matrix");
    if (matrixParam) {
      const values = matrixParam.split(",").map((v) => parseFloat(v));
      if (values.length === 4 && values.every((v) => !isNaN(v))) {
        matrix = {
          a11: values[0],
          a12: values[1],
          a21: values[2],
          a22: values[3],
        };
        console.log("Matrix loaded from URL:", matrix);
      } else {
        console.warn("Invalid matrix parameter in URL, using defaults");
      }
    }

    // Parse vector from URL
    const vectorParam = urlParams.get("vector");
    if (vectorParam) {
      const values = vectorParam.split(",").map((v) => parseFloat(v));
      if (values.length === 2 && values.every((v) => !isNaN(v))) {
        vector = {
          v1: values[0],
          v2: values[1],
        };
        console.log("Vector loaded from URL:", vector);
      } else {
        console.warn("Invalid vector parameter in URL, using defaults");
      }
    }

    return { matrix, vector };
  }

  initialize() {
    // Parse URL parameters first
    const { matrix, vector } = this.parseURLParameters();
    this.uiController.updateMatrix(matrix);
    this.uiController.updateVector(vector);

    // Show the interface after initialization
    document.body.classList.add("app-initialized");

    // Force update vector positions after elements are shown
    setTimeout(() => {
      this.vectorRenderer.updateVectorDrawing();
    }, 10); // Small delay to ensure CSS changes are applied
  }
}

document.addEventListener("DOMContentLoaded", () => new LinearAlgebraApp());
