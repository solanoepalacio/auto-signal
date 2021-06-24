import _ from 'lodash';
import { useState, useRef, useEffect } from 'react';
import { LazyBrush } from 'lazy-brush';

import { autoDraw } from './services/autodraw-api';
import Utils from './utils/index';
import DrawUtils from './utils/draw';
import HandsFreeUtils from './utils/handsfree'
import CircularProgress from '@material-ui/core/CircularProgress';
import { Button, Typography } from '@material-ui/core';
import HelpDialog from './components/HelpDialog';
import ConfigDialog from './components/ConfigDialog';

import './App.css';
import './components/styles/video-feedback.css';

const handsfree = new window.Handsfree({
  hands: true,
  maxNumHands: 1
});

const topBarHeight = 100; // px
const imageHeight = topBarHeight - 16;
const imagesSuggestionsToDisplay = Math.floor(window.innerWidth / (imageHeight + 12));
const bottomBarHeight = 56; // px
const canvasHeight = window.innerHeight - topBarHeight - bottomBarHeight;
const aspectRatio = 16 / 9;
const canvasWidth = canvasHeight * aspectRatio;
const renderedImageDefaultSize = 160;
const BRUSH_RADIUS_CONFIG = 12;

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

const DrawableImage = (image) => {
  // get position from drawing that triggered the search
  return {
    ...image,
    size: renderedImageDefaultSize,
    id: `${Date.now()}`,
    position: DrawUtils.getDefaultPosition(canvasWidth, canvasHeight, renderedImageDefaultSize),
  };
};

const pointIntersectsImage = (point, drawableImage) => {
  const { size, position: { x, y } } = drawableImage;

  return point.x >= x && point.x <= x + size && point.y >= y && point.y <= y + size;
};

const getRectPoints = (origin, size) => {
  return [
    origin,
    { x: origin.x + size, y: origin.y },
    { x: origin.x + size, y: origin.y + size },
    { x: origin.x, y: origin.y + size },
    origin,
  ];
};

const drawImageRect = (drawableImage, canvasContext) => {
  DrawUtils.drawPath(
    getRectPoints(drawableImage.position, drawableImage.size),
    canvasContext,
    'grey',
  )
};

function App() {
  let lines = useRef([]);

  let listenersSet = useRef(false);
  let shouldDraw = useRef(false);
  let currentLine = useRef(null);

  let videoRunning = useRef(false);
  const canvasRef = useRef('canvas');

  const [modelsLoading, setModelsLoading] = useState(true);
  const modelsLoadingRef = useRef(true);

  const setModelsLoaded = () => {
    modelsLoadingRef.current = false;
    setModelsLoading(false);
  };

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
    const suggestions = imageSuggestions.slice(0, imagesSuggestionsToDisplay);
    setSuggestions(suggestions);
    if (suggestions.length) {
      selectImage(imageSuggestions[0]);
    }
  };

  const imagesPickedRef = useRef([]);
  const [imagesPicked, setImagesPicked] = useState([]);

  const setPicks = (picks) => {
    setImagesPicked(picks);
    imagesPickedRef.current = picks;
  };

  const handleAddPick = (pick) => {
    const newPicks = [...imagesPickedRef.current, DrawableImage(pick)];
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
      handleSubmitLines(lines.current, canvasWidth, canvasHeight);
      brushRef.current = null;
    }
  };

  const ifModelsLoaded = (fn) => (...args) => !modelsLoadingRef.current && fn(...args);

  const setListenersOnce = () => {
    if (!listenersSet.current) {
      listenersSet.current = true;
      Utils.debouncedListener('click', ifModelsLoaded(handleMouseClick));
      Utils.debouncedListener('keydown', ifModelsLoaded(handleKeyDown));
      Utils.debouncedListener('keyup', ifModelsLoaded(handleKeyUp));
      document.addEventListener('handsfree-modelReady', () => {
        setModelsLoaded();
      });
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

  const [ videoFeedbackLoaded, setVideoFeedbackLoaded ] = useState(false);
  const [ videoFeedbackRunning, setVideoFeedbackRunning ] = useState(false);

  const brushRef = useRef(null);

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

      const [ thumb, customFinger, pinch ] = HandsFreeUtils.getPinchFingers(handsfree, handConfigRef.current, landmarkConfigRef.current);


      lines.current.forEach((line) => {
        if (line.length < 1) return;
        // const simplified = simplify(, 5);
        DrawUtils.drawPath(line.map(({ x, y }) => ({ x, y })), canvasContext);
      });

      if (imagesPickedRef.current.length) {
        DrawUtils.drawImages(imagesPickedRef.current, canvasContext);

        if (!shouldDraw.current && imagesPickedRef.current.length && customFinger) {
          const intersectedImages = [thumb, customFinger].reduce((intersectedImages, finger) => {
            const fingerPosition = DrawUtils.transformRelativePosition(canvasWidth, canvasHeight, finger);
            const fingerIntersections = imagesPickedRef.current.reduce((fingerIntersections, drawableImage) => {
              if (
                pointIntersectsImage(fingerPosition, drawableImage) &&
                !intersectedImages.find(({ id }) => id === drawableImage.id)
              ) {
                fingerIntersections.push(drawableImage);
              };
              return fingerIntersections
            }, []);
            return intersectedImages.concat(fingerIntersections);
          }, []);

          intersectedImages.forEach((drawableImage) => {
            drawImageRect(drawableImage, canvasContext)
          });

          const pinchRelativePosition = DrawUtils.midpoint(customFinger, thumb);
          const pinchPosition = DrawUtils.transformRelativePosition(canvasWidth, canvasHeight, pinchRelativePosition);

          if (pinch && intersectedImages.length) {
            const moving = intersectedImages[0];

            moving.position.x = pinchPosition.x - moving.size / 2;
            moving.position.y = pinchPosition.y - moving.size / 2;
          }
        }
      };

      if (customFinger) {
        const landmark = DrawUtils.transformRelativePosition(canvasWidth, canvasHeight, customFinger);
        DrawUtils.drawLandmark(landmark, canvasContext);
        if (shouldDraw.current) {
          if (!currentLine.current.length) {
            brushRef.current = new LazyBrush({
              enabled: true,
              radius: BRUSH_RADIUS_CONFIG,
              initialPoint: landmark,
            });
            currentLine.current.push(landmark);
          }

          else {
            const lineUpdated = brushRef.current.update(landmark);
            if (lineUpdated) {
              currentLine.current.push(brushRef.current.getBrushCoordinates());
            }
            
          }
          
        }
      }

      if (thumb && !shouldDraw.current && pinchConfigRef.current && landmarkConfigRef.current === 8) {
        DrawUtils.drawLandmark(
          DrawUtils.transformRelativePosition(canvasWidth, canvasHeight, thumb),
          canvasContext,
          'blue',
        );
      }

      if (videoRunning.current) loop();
    });
  };

  const landmarkConfigRef = useRef(8);
  const [landmarkConfig, setLandmarkConfig] = useState(8);
  const setLandmark = (landmark) => {
    setLandmarkConfig(landmark);
    landmarkConfigRef.current = landmark;
  };
  
  const [ pinchConfig, setPinchConfig ] = useState(true);
  const pinchConfigRef = useRef(true);
  const setPinch = () => {
    const newConfig = !pinchConfigRef.current;
    setPinchConfig(newConfig);
    pinchConfigRef.current = newConfig;
  };

  const handConfigRef = useRef('right');
  const [ handConfig, setHandConfig ] = useState('right');
  const setHand = (selectedHand) => {
    setHandConfig(selectedHand);
    handConfigRef.current = selectedHand;
  };

  return (
    <div className="App">
        <div className="image-toolbar">
          <div className="image-container" style={{ height: `${topBarHeight}px` }}>
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
        <div style={{width: '100vw', height: canvasHeight}} className="video-container">
          <canvas style={{ transform: 'scale(-1, 1)' }} ref={canvasRef} width={canvasWidth} height={canvasHeight}></canvas>
          { videoFeedbackRunning && modelsLoading ? (
            <div className="model-loading" style={{ width: canvasWidth, height: canvasHeight }}>
              <Typography>Loading Models</Typography>&nbsp;&nbsp;&nbsp;<CircularProgress color="secondary"/>
            </div> ) : null
          }
        </div>
        <div className="controls">
          <Button variant="contained" color="secondary" disabled={!videoFeedbackLoaded} onClick={toggleVideoRunning}>
            {videoFeedbackRunning ? 'stop' : 'start'}
          </Button>
          <div className="secondary">
            <ConfigDialog
              onLandmarkChange={setLandmark}
              onPinchConfigSwitch={setPinch}
              pinchConfig={pinchConfig}
              landmarkConfig={landmarkConfig}
              handConfig={handConfig}
              onHandConfigChange={setHand}
            />
            <HelpDialog />
          </div>
        </div>

      </div>
  );
}

export default App;
