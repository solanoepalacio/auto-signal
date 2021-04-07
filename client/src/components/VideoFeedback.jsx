import { useEffect, useRef, useState } from 'react';
import simplify from 'simplify-js';

import { Button } from '@material-ui/core';

import './styles/video-feedback.css';

const drawPaths = (lines, canvasContext, lineColor = 'green') => {
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

const drawLandmark = ({ x, y }, canvasContext, color = 'red') => {
  canvasContext.fillStyle = color;
  canvasContext.fillRect(x, y, 10, 10);
};

const handsfree = new window.Handsfree({
  hands: true,
  maxNumHands: 1
});

function VideoFeedback({ onSubmitLines }) {
  let listenersSet = useRef(false);
  let shouldDraw = useRef(false);
  let currentLine = useRef(null);
  let lines = useRef([]);
  let canvasWidth = useRef(0);
  let canvasHeight = useRef(0);
  let videoRunning = useRef(false);
  const canvasRef = useRef('canvas');

  const onKeyDown = (e) => {
    if (e.repeat) return;

    if (e.code === 'Space') { // handles drawing
      shouldDraw.current = true;
      currentLine.current = [];
      lines.current.push(currentLine.current);
      return;
    }

    if (e.code === 'ArrowUp') { // removes all lines
      const canvasContext = canvasRef.current.getContext('2d');
      canvasContext.clearRect(0, 0, canvasWidth.current, canvasHeight.current);
      lines.current = [];
      return;
    }

    if (e.code === 'ArrowDown') { // removes last line
      const copy = [...lines.current];
      copy.pop();
      lines.current = copy;
    }
  }

  const onKeyUp = (e) => {
    if (e.code === 'Space') {
      shouldDraw.current = false;
      // TODO: Perform simplifying and smoothing of the line
      console.log('submiting lines', lines.current);
      onSubmitLines(lines.current, canvasWidth.current, canvasHeight.current);
    }
  };

  const onClick = () => {
    lines.current = [];
  }

  const handleStart = () => {
    handsfree.start();
    loop();
    videoRunning.current = true;
    setVideoFeedbackRunning(true);
  };

  const handleStop = () => {
    videoRunning.current = false;
    handsfree.stop();
    setVideoFeedbackRunning(false);
  }

  const toggleVideoRunning = () => {
    if (videoRunning.current) handleStop();
    else handleStart();

    document.activeElement.blur();
  }

  const setListenersOnce = () => {
    if (!listenersSet.current) {
      listenersSet.current = true;
      document.addEventListener('keydown', onKeyDown);
      document.addEventListener('keyup', onKeyUp);
      document.addEventListener('click', onClick);
    }
  }

  const setCanvasDimensions = () => {
    if (!canvasWidth.current || !canvasHeight.current) {
      canvasWidth.current = canvasRef.current.width;
      canvasHeight.current = canvasRef.current.height;
    }
  }

  const [ videoFeedbackLoaded, setVideoFeedbackLoaded ] = useState(false);
  const [ videoFeedbackRunning, setVideoFeedbackRunning ] = useState(false);

  const loop = () => {
    const canvasContext = canvasRef.current.getContext('2d');
    requestAnimationFrame(() => {
      canvasContext.drawImage(
        handsfree.debug.$video,
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );

      const landmarks = handsfree.data.hands?.landmarks;

      let landmark;
      if (landmarks && landmarks.length) {
        const rightHand = landmarks[1];
        if (rightHand.length) {
          landmark = rightHand[8];
        }
      };

      if (landmark) {
        const currentLandmark = {
          x: landmark.x * canvasRef.current.width,
          y: landmark.y * canvasRef.current.height
        };

        drawLandmark(currentLandmark, canvasContext);
        if (shouldDraw.current) currentLine.current.push(currentLandmark);
      }

      drawPaths(lines.current, canvasContext);
      if (videoRunning.current) loop();
    });
  };

  useEffect(() => {
    setListenersOnce()
    setCanvasDimensions()
    setVideoFeedbackLoaded(true);
  });

  return (
    <div class="video-container" tabIndex="0">
      <div style={{width: '1280px'}}>
        <canvas style={{ transform: 'scale(-1, 1)' }} ref={canvasRef} width="1280" height="720"></canvas>
      </div>
      <div className="controls">
        <Button variant="contained" color="secondary" disabled={!videoFeedbackLoaded} onClick={toggleVideoRunning}>
          { videoFeedbackRunning ? 'stop' : 'start' }
        </Button>
      </div>
    </div>
  );
}

export default VideoFeedback;
