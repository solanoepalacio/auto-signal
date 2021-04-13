import _ from 'lodash';
import simplify from 'simplify-js';

const transformRelativePosition = (canvasWidth, canvasHeight, { x, y }) => {
  return { x: x * canvasWidth, y: y * canvasHeight };
};

function point(x = 0, y = 0) {
  return { x, y };
}

function drawPath(line, canvasContext, lineColor = 'green') {
  canvasContext.beginPath();

  let { x: firstX, y: firstY } = line.shift()

  canvasContext.moveTo(firstX, firstY);
  line.forEach(({ x: currX, y: currY }) => {
    canvasContext.lineTo(currX, currY);
    canvasContext.strokeStyle = lineColor;
    canvasContext.lineWidth = 3;
    canvasContext.lineCap = 'round';
    canvasContext.stroke();
  });

  canvasContext.closePath();
};

function drawLandmark({ x, y }, canvasContext, color = 'red') {
  canvasContext.fillStyle = color;
  canvasContext.fillRect(x, y, 10, 10);
};

function drawImages(images, canvasContext) {
  images.forEach((imageData) => {
    const element = document.createElement('img');
    element.src = imageData.url;
    canvasContext.drawImage(
      element,
      imageData.position.x,
      imageData.position.y,
      imageData.size,
      imageData.size,
    );
  });
};

function getDefaultPosition(canvasWidth, canvasHeight, size) {
  return {
    x: 0 + canvasWidth / 3 - size,
    y: 0 + canvasHeight / 2 - size / 2,
  }
}

function midpoint({ x: x0, y: y0 }, { x: x1, y: y1 }) {
  return {
    x: (x1 + x0) / 2,
    y: (y1 + y0) / 2,
  };
}

export default { point, drawLandmark, drawPath, drawImages, getDefaultPosition, transformRelativePosition, midpoint };