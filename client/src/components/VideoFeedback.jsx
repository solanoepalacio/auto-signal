import { useEffect, useRef } from 'react';

import { autoDraw } from '../services/autodraw-api';

function VideoFeedback({ onSubmitLines }) {
  let listenersSet = useRef(false);
  let shouldDraw = useRef(false);
  let currentLine = useRef(null);
  let lines = useRef([]);
  let canvasWidth = useRef(0);
  let canvasHeight = useRef(0);
  const canvasRef = useRef('canvas');

  const onKeyDown = (e) => {
    console.log('repeat', e.repeat);
    if (e.repeat) return;

    if (e.code === 'Space') {
      shouldDraw.current = true;
      currentLine.current = [];
      lines.current.push(currentLine.current);
      return;
    }

    if (e.code === 'Enter' && canvasWidth.current && canvasHeight.current) {
      console.log('about to autodraw');
      onSubmitLines(lines.current, canvasWidth.current, canvasHeight.current)
    }

  }

  const onKeyUp = () => {
    shouldDraw.current = false;
  };

  useEffect(() => {
    const handsfree = new window.Handsfree({
      hands: true,
      maxNumHands: 1
    });
    window.h = handsfree

    handsfree.start();
    const canvasContext = canvasRef.current.getContext('2d');

    if (!listenersSet.current) {
      console.log('setting listeners');
      listenersSet.current = true;
      document.addEventListener('keydown', onKeyDown);
      document.addEventListener('keyup', onKeyUp);
    }

    const loop = () => {
      requestAnimationFrame(() => {
        canvasContext.drawImage(
          handsfree.debug.$video,
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );

        const drawLandmark = ({ x, y }) => {
          canvasContext.fillStyle = 'red';
          canvasContext.fillRect(
            x * canvasRef.current.width,
            y * canvasRef.current.height,
            10, 10
          );
        };

        const drawPath = ({ x, y }) => {
          if (!canvasWidth.current || !canvasHeight.current) {
            console.log('canvasref', canvasRef);
            canvasWidth.current = canvasRef.current.width;
            canvasHeight.current = canvasRef.current.height;
          }

          const currX = x * canvasWidth.current;
          const currY = y * canvasHeight.current;

          if (lines.current.length < 1) return;
          if (shouldDraw.current) currentLine.current.push({ x: currX, y: currY });

          lines.current.forEach((pointPositions) => {
            if (pointPositions.length < 1) return;
            const clone = pointPositions.map(({ x, y }) => ({ x, y }));

            canvasContext.beginPath();

            let { x: firstX, y: firstY } = clone.shift()

            canvasContext.moveTo(firstX, firstY);
            clone.forEach(({ x: currX, y: currY }) => {
              canvasContext.lineTo(currX, currY);
              canvasContext.strokeStyle = 'green';
              canvasContext.lineWidth = 3;
              canvasContext.lineCap = 'round';
              canvasContext.stroke();
            });

            canvasContext.closePath();
          });
        }

        const landmarks = handsfree.data.hands?.landmarks;

        if (landmarks && landmarks.length) {
          const rightHand = landmarks[1];
          if (rightHand.length) {
            const rightIndexFinger = rightHand[8];
            drawLandmark(rightIndexFinger);
            drawPath(rightIndexFinger);
          }
        }

        loop();
      });
    };

    loop();
  });



  return (
    <div class="video-container" tabIndex="0">
      <canvas style={{ transform: 'scale(-1, 1)'}} ref={canvasRef} width="1280" height="720"></canvas>
    </div>
  );
}

export default VideoFeedback;
