

const logOnce = () => {
  let logged = false;
  return (...args) => {
    if (!logged) {
      console.log('logging once:', ...args);
    }
    logged = true;
  }
}

const doOnce = (fn) => {
  let done = false;
  return (...args) => {
    if (!done) fn(...args);
    done = true;
  }
}

const log = logOnce();

window.onload = () => {
  setTimeout(() => {
    if (window.drawConnectors) window.drawConnectors = () => { };

    if (window.drawLandmarks) {
      const drawLandmark = (canvas, { x, y }) => {
        canvas.fillStyle = 'red';
        canvas.fillRect(
          x * canvas.canvas.width,
          y * canvas.canvas.height,
          10, 10
        );
      };

      let shouldDraw = false, currentLine = null, lines = [], canvasWidth = 0, canvasHeight = 0;

      document.addEventListener('keydown', (e) => {
        if (e.repeat) return;

        if (e.code === 'Space') {
          shouldDraw = true;
          currentLine = [];
          lines.push(currentLine);
          return;
        }
      });

      document.addEventListener('keyup', () => {
        shouldDraw = false;
      });

      const drawPath = (canvas, { x, y }) => {
        if (!canvasWidth || canvasHeight) {
          canvasWidth = canvas.canvas.width;
          canvasHeight = canvas.canvas.height;
        }

        currX = x * canvasWidth;
        currY = y * canvasHeight;
        if (lines.length < 1) return;
        if (shouldDraw) currentLine.push({ x: currX, y: currY });

        lines.forEach((pointPositions) => {
          if (pointPositions.length < 1) return;
          const clone = pointPositions.map(({ x, y }) => ({ x, y }));

          canvas.beginPath();

          let { x: firstX, y: firstY } = clone.shift()

          canvas.moveTo(firstX, firstY);
          clone.forEach(({ x: currX, y: currY }) => {
            canvas.lineTo(currX, currY);
            canvas.strokeStyle = 'green';
            canvas.lineWidth = 3;
            canvas.lineCap = 'round';
            canvas.stroke();
          });

          canvas.closePath();
        });
      }

      window.drawLandmarks = (canvas, landmarks, lineStyles) => {
        const landmark = landmarks[8];
        if (landmark) {
          drawLandmark(canvas, landmark);
          drawPath(canvas, landmark);
        }
      };
    }
  }, 3000)
}

