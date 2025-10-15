import { MatrixMath } from "./matrix-math.js";

export class UIController {
  constructor(domManager, gridRenderer, vectorRenderer) {
    this.dom = domManager;
    this.gridRenderer = gridRenderer;
    this.vectorRenderer = vectorRenderer;
    this.setupEventListeners();
  }

  updateURL() {
    const matrix = this.getCurrentMatrix();
    const vector = this.getCurrentVector();

    const params = new URLSearchParams();
    params.set(
      "matrix",
      `${matrix.a11},${matrix.a12},${matrix.a21},${matrix.a22}`
    );
    params.set("vector", `${vector.v1},${vector.v2}`);

    const newURL = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", newURL);
  }

  getCurrentMatrix() {
    return {
      a11: parseFloat(this.dom.elements.matrix.inputs.a11.value) || 0,
      a12: parseFloat(this.dom.elements.matrix.inputs.a12.value) || 0,
      a21: parseFloat(this.dom.elements.matrix.inputs.a21.value) || 0,
      a22: parseFloat(this.dom.elements.matrix.inputs.a22.value) || 0,
    };
  }

  getCurrentVector() {
    return {
      v1: parseFloat(this.dom.elements.vectors.v.inputs.v1.value) || 0,
      v2: parseFloat(this.dom.elements.vectors.v.inputs.v2.value) || 0,
    };
  }

  setupEventListeners() {
    // Rotation sliders
    this.dom.elements.rotation.sliders.x.addEventListener("input", (e) => {
      this.handleRotationSliderChange(e.target, e.target.value, "x");
    });
    this.dom.elements.rotation.sliders.y.addEventListener("input", (e) => {
      this.handleRotationSliderChange(e.target, e.target.value, "y");
    });

    // Scale sliders
    this.dom.elements.scale.sliders.x.addEventListener("input", (e) => {
      this.handleScaleSliderChange(e.target, e.target.value, "x");
    });
    this.dom.elements.scale.sliders.y.addEventListener("input", (e) => {
      this.handleScaleSliderChange(e.target, e.target.value, "y");
    });

    // Matrix sliders
    this.dom.elements.matrix.sliders.a11.addEventListener("input", (e) => {
      this.handleMatrixSliderChange(e.target, e.target.value, "a11");
    });
    this.dom.elements.matrix.sliders.a12.addEventListener("input", (e) => {
      this.handleMatrixSliderChange(e.target, e.target.value, "a12");
    });
    this.dom.elements.matrix.sliders.a21.addEventListener("input", (e) => {
      this.handleMatrixSliderChange(e.target, e.target.value, "a21");
    });
    this.dom.elements.matrix.sliders.a22.addEventListener("input", (e) => {
      this.handleMatrixSliderChange(e.target, e.target.value, "a22");
    });

    // Matrix input fields
    this.dom.elements.matrix.inputs.a11.addEventListener("change", (e) => {
      this.handleMatrixSliderChange(e.target, e.target.value, "a11");
    });
    this.dom.elements.matrix.inputs.a12.addEventListener("change", (e) => {
      this.handleMatrixSliderChange(e.target, e.target.value, "a12");
    });
    this.dom.elements.matrix.inputs.a21.addEventListener("change", (e) => {
      this.handleMatrixSliderChange(e.target, e.target.value, "a21");
    });
    this.dom.elements.matrix.inputs.a22.addEventListener("change", (e) => {
      this.handleMatrixSliderChange(e.target, e.target.value, "a22");
    });

    // Vector sliders and inputs
    this.dom.elements.vectors.v.sliders.v1.addEventListener("input", (e) => {
      this.handleVectorChange(e.target, e.target.value, "v1");
    });
    this.dom.elements.vectors.v.sliders.v2.addEventListener("input", (e) => {
      this.handleVectorChange(e.target, e.target.value, "v2");
    });
    this.dom.elements.vectors.v.inputs.v1.addEventListener("input", (e) => {
      this.handleVectorChange(e.target, e.target.value, "v1");
    });
    this.dom.elements.vectors.v.inputs.v2.addEventListener("input", (e) => {
      this.handleVectorChange(e.target, e.target.value, "v2");
    });
  }

  handleRotationSliderChange(element, value, axis) {
    // Update rotation value display
    let rotationX = parseFloat(this.dom.elements.rotation.sliders.x.value);
    let rotationY = parseFloat(this.dom.elements.rotation.sliders.y.value);
    if (axis === "x") {
      this.dom.elements.rotation.values.x.textContent = `${value}°`;
      rotationX = parseFloat(value);
    } else {
      this.dom.elements.rotation.values.y.textContent = `${value}°`;
      rotationY = parseFloat(value);
    }

    // Get current scales
    const scaleX = parseFloat(this.dom.elements.scale.sliders.x.value);
    const scaleY = parseFloat(this.dom.elements.scale.sliders.y.value);

    // Update the matrix inputs based on the new transforms.
    const { a11, a12, a21, a22 } = this.updateMatrixInputsFromTransforms(
      rotationX,
      rotationY,
      scaleX,
      scaleY
    );

    // Extract basis vectors and update the grid.
    const { basisX, basisY } = MatrixMath.extractBasisVectors(
      a11,
      a12,
      a21,
      a22
    );
    this.updateGridTransforms(rotationX, rotationY, basisX, basisY);
  }

  handleScaleSliderChange(element, value, axis) {
    // Update scale value display
    let scaleX = parseFloat(this.dom.elements.scale.sliders.x.value);
    let scaleY = parseFloat(this.dom.elements.scale.sliders.y.value);
    if (axis === "x") {
      this.dom.elements.scale.values.x.textContent = value;
      scaleX = parseFloat(value);
    } else {
      this.dom.elements.scale.values.y.textContent = value;
      scaleY = parseFloat(value);
    }

    // Get current rotations
    const rotationX = parseFloat(this.dom.elements.rotation.sliders.x.value);
    const rotationY = parseFloat(this.dom.elements.rotation.sliders.y.value);

    const { a11, a12, a21, a22 } = this.updateMatrixInputsFromTransforms(
      rotationX,
      rotationY,
      scaleX,
      scaleY
    );
    const { basisX, basisY } = MatrixMath.extractBasisVectors(
      a11,
      a12,
      a21,
      a22
    );
    this.updateGridTransforms(rotationX, rotationY, basisX, basisY);
  }

  handleMatrixSliderChange(element, value, matrixElement) {
    value = parseFloat(value);

    // Update slider position
    this.dom.elements.matrix.sliders[matrixElement].value = value.toFixed(2);

    // Update matrix element value display
    this.dom.elements.matrix.values[matrixElement].textContent =
      value.toFixed(1);

    // Update input fields
    this.dom.elements.matrix.inputs[matrixElement].value = value.toFixed(1);

    // Apply the matrix transformation
    const { a11, a12, a21, a22 } = this.getCurrentMatrix();
    this.applyMatrixTransformation(a11, a12, a21, a22);
  }

  handleVectorChange(element, value, vectorComponent) {
    value = parseFloat(value);

    // Update slider position
    this.dom.elements.vectors.v.sliders[vectorComponent].value = value;

    // Update value display
    this.dom.elements.vectors.v.values[vectorComponent].textContent =
      value.toFixed(1);

    // Update input field
    this.dom.elements.vectors.v.inputs[vectorComponent].value = value;

    // Update vector drawing
    this.vectorRenderer.updateVectorDrawing();
    this.updateURL();
  }

  updateVector({ v1, v2 }) {
    this.dom.elements.vectors.v.inputs.v1.value = v1;
    this.dom.elements.vectors.v.inputs.v2.value = v2;

    this.dom.elements.vectors.v.sliders.v1.value = v1;
    this.dom.elements.vectors.v.sliders.v2.value = v2;

    this.dom.elements.vectors.v.values.v1.textContent = v1.toFixed(1);
    this.dom.elements.vectors.v.values.v2.textContent = v2.toFixed(1);

    this.vectorRenderer.updateVectorDrawing();
  }

  updateGridTransforms(
    rotationX = 0,
    rotationY = 0,
    basisX = { x: 1, y: 0 },
    basisY = { x: 0, y: 1 }
  ) {
    this.gridRenderer.generateXGridLines(rotationX, basisY);
    this.gridRenderer.generateYGridLines(rotationY, basisX);
    this.vectorRenderer.updateVectorDrawing(true);

    // Calculate the eigenvectors
    this.vectorRenderer.eigenData = MatrixMath.calculateEigenvectors(
      basisX.x,
      basisY.x,
      basisX.y,
      basisY.y
    );
    this.vectorRenderer.updateEigenvectorDrawings({
      ...this.vectorRenderer.eigenData,
    });
  }

  updateMatrixInputsFromTransforms(rotationX, rotationY, scaleX, scaleY) {
    const matrix = MatrixMath.calculateFromTransforms(
      rotationX,
      rotationY,
      scaleX,
      scaleY
    );

    // Update input fields
    this.updateMatrix(matrix, false);

    return matrix;
  }

  updateMatrix({ a11, a12, a21, a22 }, propagate = true) {
    this.dom.elements.matrix.inputs.a11.value = a11.toFixed(2);
    this.dom.elements.matrix.inputs.a12.value = a12.toFixed(2);
    this.dom.elements.matrix.inputs.a21.value = a21.toFixed(2);
    this.dom.elements.matrix.inputs.a22.value = a22.toFixed(2);

    this.dom.elements.matrix.sliders.a11.value = a11.toFixed(2);
    this.dom.elements.matrix.sliders.a12.value = a12.toFixed(2);
    this.dom.elements.matrix.sliders.a21.value = a21.toFixed(2);
    this.dom.elements.matrix.sliders.a22.value = a22.toFixed(2);

    this.dom.elements.matrix.values.a11.textContent = a11.toFixed(1);
    this.dom.elements.matrix.values.a12.textContent = a12.toFixed(1);
    this.dom.elements.matrix.values.a21.textContent = a21.toFixed(1);
    this.dom.elements.matrix.values.a22.textContent = a22.toFixed(1);

    // Also updates other elements if propagate is true.
    if (propagate) {
      this.applyMatrixTransformation(a11, a12, a21, a22);
    }
  }

  applyMatrixTransformation(a11, a12, a21, a22) {
    const transform = MatrixMath.calculateTransformation(a11, a12, a21, a22);

    // Update the grid transforms
    const rotationX = transform.rotationX;
    const rotationY = transform.rotationY;
    const basisX = transform.basisX;
    const basisY = transform.basisY;
    const scaleX = basisX.x;
    const scaleY = basisY.y;

    // Update sliders to reflect the calculated values
    this.dom.elements.rotation.sliders.x.value = rotationX;
    this.dom.elements.rotation.sliders.y.value = rotationY;
    this.dom.elements.scale.sliders.x.value = Math.min(
      3,
      Math.max(0.1, scaleX)
    ); // Clamp to slider range
    this.dom.elements.scale.sliders.y.value = Math.min(
      3,
      Math.max(0.1, scaleY)
    ); // Clamp to slider range

    // Update display values
    this.dom.elements.rotation.values.x.textContent = `${rotationX.toFixed(
      1
    )}°`;
    this.dom.elements.rotation.values.y.textContent = `${rotationY.toFixed(
      1
    )}°`;
    this.dom.elements.scale.values.x.textContent = scaleX.toFixed(1);
    this.dom.elements.scale.values.y.textContent = scaleY.toFixed(1);

    this.updateURL();

    // Apply the transformations to the grids
    this.updateGridTransforms(rotationX, rotationY, basisX, basisY);
  }
}
