export class DOMManager {
  constructor() {
    this.elements = this.getAllElements();
  }

  getAllElements() {
    return {
      grid: {
        xContainer: document.getElementById("x-grid-lines"),
        yContainer: document.getElementById("y-grid-lines"),
      },
      rotation: {
        sliders: {
          x: document.getElementById("x-rotation"),
          y: document.getElementById("y-rotation"),
        },
        values: {
          x: document.getElementById("x-value"),
          y: document.getElementById("y-value"),
        },
      },
      scale: {
        sliders: {
          x: document.getElementById("x-scale"),
          y: document.getElementById("y-scale"),
        },
        values: {
          x: document.getElementById("x-scale-value"),
          y: document.getElementById("y-scale-value"),
        },
      },
      vectors: {
        v: {
          sliders: {
            v1: document.getElementById("v1-slider"),
            v2: document.getElementById("v2-slider"),
          },
          inputs: {
            v1: document.getElementById("v1"),
            v2: document.getElementById("v2"),
          },
          values: {
            v1: document.getElementById("v1-value"),
            v2: document.getElementById("v2-value"),
          },
          line: document.getElementById("vector-line"),
          label: document.getElementById("vector-label"),
        },
        Av: {
          line: document.getElementById("av-vector-line"),
          label: document.getElementById("av-vector-label"),
        },
      },
      matrix: {
        sliders: {
          a11: document.getElementById("a11-slider"),
          a12: document.getElementById("a12-slider"),
          a21: document.getElementById("a21-slider"),
          a22: document.getElementById("a22-slider"),
        },
        inputs: {
          a11: document.getElementById("a11"),
          a12: document.getElementById("a12"),
          a21: document.getElementById("a21"),
          a22: document.getElementById("a22"),
        },
        values: {
          a11: document.getElementById("a11-value"),
          a12: document.getElementById("a12-value"),
          a21: document.getElementById("a21-value"),
          a22: document.getElementById("a22-value"),
        },
      },
    };
  }
}
