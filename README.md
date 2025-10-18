# [Linear Algebra Project](https://roomrys.github.io/linalg)

## Overview

This project focuses on implementing and exploring concepts in linear algebra. The current feature list can be seen below.

## Features

### [SVD in Color Space](https://roomrys.github.io/linalg/svd-color-space.html)

- SVD decomposition of A with spatial rows and color columns

  <img height="200" alt="image" src="https://github.com/user-attachments/assets/78505270-5e8b-4622-aa0e-8538e10ee4e0" />

- RGB decomposition (when hover over A)

  <img height="200" alt="image" src="https://github.com/user-attachments/assets/b23f7971-fba0-4056-bc4c-291474955c73" />

- Rank-k approximation using dominant modes from SVD

  <img height="200" alt="image" src="https://github.com/user-attachments/assets/38584dc5-0298-4520-a4b0-8575149bf72e" />

- Rank-k approximation using dominant RGB channels (when hover over A)

  <img height="200" alt="image" src="https://github.com/user-attachments/assets/a5d3c35a-6c50-4a16-800d-03168f45d952" />




### [Linalg](https://roomrys.github.io/linalg)

- Eigenvector Visualizer (Complex, real, defective)

  <img height="200" alt="image" src="https://github.com/user-attachments/assets/bc0e35bc-f944-44a8-baae-52147412ac77" /> <img height="200" alt="image" src="https://github.com/user-attachments/assets/b84650fe-1cb7-4643-979e-583551356e50" /> <img height="200" alt="image" src="https://github.com/user-attachments/assets/2932415f-1f49-4149-9ec2-b8d5096c724e" />

- Change of basis visualizer

  <img height="300" alt="image" src="https://github.com/user-attachments/assets/e1ffea80-5c9e-4e6f-8cfa-2bf8a108b264" />

## Development

1. Clone the repository:
   ```bash
   git clone https://github.com/roomrys/linalg.git
   ```
2. Run the server:
   (To avoid CORS error)

   ```bash
   python3 -m http.server 8000
   ```

3. Browse to:
   ```bash
   http://[::]:8000/
   ```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
