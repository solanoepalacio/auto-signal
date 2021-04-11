import _ from 'lodash';
import { useState, useRef, useEffect } from 'react';
import { autoDraw } from './services/autodraw-api';
import Utils from './utils';

import { Button } from '@material-ui/core';
import HelpDialog from './components/HelpDialog';
import simplify from 'simplify-js';

import './App.css';
import './components/styles/video-feedback.css';
import utils from './utils';

const handsfree = new window.Handsfree({
  hands: true,
  maxNumHands: 1
});

const track = () => {
  const referrer = document.referrer;
  const browser = _.get(window, 'navigator.appName');
  const platform = _.get(window, 'navigator.platform');
  fetch('https://sf27prmmu5.execute-api.us-east-1.amazonaws.com/dev/session/start', {
    method: 'POST',
    body: JSON.stringify({
      referrer, platform, browser,
    }),
  })
};

const imgClasses = (url, selectedImage) => {
  const classes = ['drawing'];
  if (selectedImage && url === selectedImage.url) {
    classes.push('selected');
  }
  return classes.join(' ');
};

const drawableImage = (image) => {
  // get position from drawing that triggered the search
  return {
    ...image,
    size: imageHeight,
    position: Utils.getDefaultPosition(canvasWidth, canvasHeight, imageHeight),
  };
};

const topBarHeight = 100; // px
const imageHeight = topBarHeight - 16;
const bottomBarHeight = 56; // px
const canvasHeight = window.innerHeight - topBarHeight - bottomBarHeight;
const aspectRatio = 16 / 9;
const canvasWidth = canvasHeight * aspectRatio;
const renderedImageDefaultSize = 150;

function App() {
  let lines = useRef([]);

  let listenersSet = useRef(false);
  let shouldDraw = useRef(false);
  let currentLine = useRef(null);

  let videoRunning = useRef(false);
  const canvasRef = useRef('canvas');

  const selectedImageRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const selectImage = (img) => {
    selectedImageRef.current = img;
    setSelectedImage(img);
  };

  const imageSuggestionsRef = useRef([]);
  const [imageSuggestions, setImageSuggestions] = useState([]);
  const setSuggestions = (suggestions) => {
    setImageSuggestions(suggestions);
    imageSuggestionsRef.current = suggestions;
  };

  const handleSubmitLines = async (...args) => {
    const imageSuggestions = await autoDraw(...args);
    setSuggestions(imageSuggestions);
    if (imageSuggestions.length) {
      selectImage(imageSuggestions[0]);
    }
  };

  const imagesPickedRef = useRef([]);
  const [imagesPicked, setImagesPicked] = useState([]);

  const setPicks = (picks) => {
    setImagesPicked(picks);
    imagesPickedRef.current = picks;
  };

  // const handleCleanPickedImages = () => setPicks([]);
  const handleAddPick = (pick) => {
    const newPicks = [...imagesPickedRef.current, drawableImage(pick)];
    return setPicks(newPicks);
  };


  const handleMouseClick = (e) => {
    if (selectedImageRef.current) handleAddPick(selectedImageRef.current);
    selectImage(null);
    setImageSuggestions([]);
    lines.current = [];
  };

  const handleKeyDown = (e) => {
    if (e.repeat) return;

    const getSelectedImageIndex = (selectedUrl) => {
      return imageSuggestionsRef.current.findIndex((suggestion) => {
        return suggestion.url === selectedUrl;
      });
    };

    if (e.code === 'ArrowLeft') {
      const selectedIndex = getSelectedImageIndex(selectedImageRef.current.url);
      const newSelection = imageSuggestionsRef.current[selectedIndex - 1];
      if (newSelection) {
        selectImage(newSelection);
      }
    }

    if (e.code === 'ArrowRight') {
      const selectedIndex = getSelectedImageIndex(selectedImageRef.current.url);
      const newSelection = imageSuggestionsRef.current[selectedIndex + 1];
      if (newSelection) {
        selectImage(newSelection);
      }
    }

    if (e.code === 'Space') { // handles drawing
      shouldDraw.current = true;
      currentLine.current = [];
      lines.current.push(currentLine.current);
      return;
    }

    if (e.code === 'ArrowUp') { // removes all lines
      lines.current = [];
      return;
    }

    if (e.code === 'ArrowDown') { // removes last line
      const copy = [...lines.current];
      copy.pop();
      lines.current = copy;
    }
  }

  const handleKeyUp = (e) => {
    if (e.code === 'Space') {
      shouldDraw.current = false;
      const simplified = lines.current.map((pointPositions) => simplify(pointPositions.map(({ x, y }) => ({ x, y })), 5));
      handleSubmitLines(simplified, canvasWidth, canvasHeight);
    }
  };

  const setListenersOnce = () => {
    if (!listenersSet.current) {
      listenersSet.current = true;
      Utils.debouncedListener('click', handleMouseClick);
      Utils.debouncedListener('keydown', handleKeyDown);
      Utils.debouncedListener('keyup', handleKeyUp);
    }
  }

  useEffect(() => {
    setListenersOnce();
    setVideoFeedbackLoaded(true);
    if (process.env.NODE_ENV !== 'development') track();
  });

  const handleStart = () => {
    handsfree.start();

    videoRunning.current = true;
    setVideoFeedbackRunning(true);

    loop();
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

  const [videoFeedbackLoaded, setVideoFeedbackLoaded] = useState(false);
  const [videoFeedbackRunning, setVideoFeedbackRunning] = useState(false);

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

        Utils.drawLandmark(currentLandmark, canvasContext);
        if (shouldDraw.current) currentLine.current.push(currentLandmark);
      }

      Utils.drawPaths(lines.current, canvasContext);

      if (imagesPickedRef.current.length) {
        Utils.drawImages(imagesPickedRef.current, canvasContext);
      };
      if (videoRunning.current) loop();
    });
  };

  return (
    <div className="App">
      <div className="video-container" tabIndex="0">
        <div className="image-toolbar">
          <div className="image-container suggestions" style={{ height: `${topBarHeight}px` }}>
            <div className="images">
              {imageSuggestions.map(({ url }) => (
                <img
                  className={imgClasses(url, selectedImage)}
                  key={url}
                  src={url}
                  style={{ width: `${imageHeight}px`, height: `${imageHeight}px` }}
                />
              ))}
            </div>
          </div>
        </div>

        <canvas style={{ transform: 'scale(-1, 1)' }} ref={canvasRef} width={canvasWidth} height={canvasHeight}></canvas>

        <div className="controls">
          <Button variant="contained" color="secondary" disabled={!videoFeedbackLoaded} onClick={toggleVideoRunning}>
            {videoFeedbackRunning ? 'stop' : 'start'}
          </Button>
          <HelpDialog />
        </div>

      </div>
    </div>
  );
}

export default App;
