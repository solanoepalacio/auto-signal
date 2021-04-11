import simplify from 'simplify-js';

function debouncedListener (event, callback) {
  let execution;
  const listener = (e) => {
    if (execution) window.cancelAnimationFrame(execution);

    execution = requestAnimationFrame(() => callback(e));
  };

  window.addEventListener(event, listener);

  return function unregister() {
    window.removeEventListener(event, listener);
  }
};

function point (x = 0, y = 0) {
  return { x, y };
}


function drawPaths (lines, canvasContext, lineColor = 'green') {
  lines.forEach((pointPositions) => {
    if (pointPositions.length < 1) return;
    const simplified = simplify(pointPositions.map(({ x, y }) => ({ x, y })), 5);

    canvasContext.beginPath();

    let { x: firstX, y: firstY } = simplified.shift()

    canvasContext.moveTo(firstX, firstY);
    simplified.forEach(({ x: currX, y: currY }) => {
      canvasContext.lineTo(currX, currY);
      canvasContext.strokeStyle = lineColor;
      canvasContext.lineWidth = 3;
      canvasContext.lineCap = 'round';
      canvasContext.stroke();
    });

    canvasContext.closePath();
  });
};

function drawLandmark ({ x, y }, canvasContext, color = 'red') {
  canvasContext.fillStyle = color;
  canvasContext.fillRect(x, y, 10, 10);
};

function drawImages (images, canvasContext) {
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

function getDefaultPosition (canvasWidth, canvasHeight, size) {
  return {
    x: 0 + canvasWidth - size,
    y: 0 + canvasHeight / 2 - size / 2,
  }
}



export default { debouncedListener, point, drawLandmark, drawPaths, drawImages, getDefaultPosition };