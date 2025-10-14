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

  initialize() {
    this.uiController.updateMatrix({ a11: 2, a12: 0, a21: 0, a22: 1 });

    // Show the interface after initialization
    document.body.classList.add("app-initialized");

    // Force update vector positions after elements are shown
    setTimeout(() => {
      this.vectorRenderer.updateVectorDrawing();
    }, 10); // Small delay to ensure CSS changes are applied
  }
}

document.addEventListener("DOMContentLoaded", () => new LinearAlgebraApp());
