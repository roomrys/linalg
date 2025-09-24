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
    this.gridRenderer.generateXGridLines();
    this.gridRenderer.generateYGridLines();
    this.vectorRenderer.updateVectorDrawing();
  }
}

document.addEventListener("DOMContentLoaded", () => new LinearAlgebraApp());
