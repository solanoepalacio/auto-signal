import { useEffect, useRef } from 'react';
import './App.css';

var API_ENDPOINT = 'https://inputtools.google.com/request?ime=handwriting&app=autodraw&dbg=1&cs=1&oe=UTF-8'
var SVG_ENDPOINT = 'https://storage.googleapis.com/artlab-public.appspot.com/stencils/selman/'


const getBoundingRect = (shapes) => {
  var res = shapes.reduce(function (prev, shape) {
    return shape.reduce(function (prev2, point) {
      if (point.x > prev2.maxX) {
        prev2.maxX = point.x
      } else if (point.x < prev2.minX) {
        prev2.minX = point.x
      }
      if (point.y > prev2.maxY) {
        prev2.maxY = point.y
      } else if (point.y < prev2.minY) {
        prev2.minY = point.y
      }
      return prev2
    }, prev)
  }, {
    minX: Infinity,
    maxX: -Infinity,
    minY: Infinity,
    maxY: -Infinity
  })

  return {
    width: res.maxX - res.minX,
    height: res.maxY - res.minY
  }
};

const getInk = (shapes) => {
  return shapes.map((shape) => {
    return shape.reduce(([xPoints, yPoints], { x, y }) => {
      xPoints.push(x)
      yPoints.push(y)

      return [xPoints, yPoints];
    }, [[], []]);
  });
};

const parseApiResults = (data) => {
  var regex = /SCORESINKS: (.*) Service_Recognize:/
  return JSON.parse(data[1][0][3].debug_info.match(regex)[1])
}

const autodrawApiCall = async (ink, width, height) => {
  const body = {
    input_type: 0,
    requests: [{
      language: 'autodraw',
      writing_guide: { width, height },
      ink: ink
    }]
  }

  const res = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  })

  const response = await res.json();
  if (response[0] !== 'SUCCESS') {
    alert('Google API Error. Check the console');
    console.error(response);
    return {};
  }

  const results = parseApiResults(response);

  const orderedResults = results.map(function (result) {
    var escapedName = result[0].replace(/ /g, '-')
    const url = SVG_ENDPOINT + escapedName + '-01.svg';
    return {
      name: result[0],
      confidence: result[1],
      url: SVG_ENDPOINT + escapedName + '-01.svg',
      url_variant_1: SVG_ENDPOINT + escapedName + '-02.svg',
      url_variant_2: SVG_ENDPOINT + escapedName + '-03.svg'
    }
  });
  console.log('ordered', orderedResults);
  return orderedResults;
};

const autoDraw = (shapes) => {
  console.log('auto drawing');
  const ink = getInk(shapes);
  const frame = getBoundingRect(shapes);

  return autodrawApiCall(ink, frame);
};



function App() {
  let listenersSet = useRef(false);
  let shouldDraw = useRef(false);
  let currentLine = useRef(null);
  let lines = useRef([]);
  let canvasWidth = useRef(0);
  let canvasHeight = useRef(0);

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
      autoDraw(lines.current, canvasWidth.current, canvasHeight.current).then((results) => {
        console.log('autodraw results', results);
      });
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
          handsfree.debug.$canvas.video.width,
          handsfree.debug.$canvas.video.height
        );
        const drawLandmark = (canvas, { x, y }) => {
          canvasContext.fillStyle = 'red';
          canvasContext.fillRect(
            x * canvasRef.current.width,
            y * canvasRef.current.height,
            10, 10
          );
        };


        const drawPath = (canvas, { x, y }) => {
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

            console.log('cline', clone);

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
            drawLandmark(canvasRef.current, rightIndexFinger);
            drawPath(canvasRef.current, rightIndexFinger);
          }
        }

        loop();
      });
    };

    loop();
  });

  const canvasRef = useRef('canvas');

  return (
    <div className="App">
      <div onKeyDown={onKeyDown} onKeyUp={onKeyUp} class="video-container" tabIndex="0">
        <canvas  ref={canvasRef} width="1280" height="720"></canvas>
      </div>
      <p>Hello</p>
    </div>
  );
}

export default App;
