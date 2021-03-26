const fp = require('lodash/fp');

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

const sortResultsByConfidence = (a, b) => {
  if (a.confidence === b.confidence) return 0;
  if (a.confidence < b.confidence) return -1;
  if (a.confidence > b.confidence) return 1;
};

const resultMapper = (result) => {
  var escapedName = result[0].replace(/ /g, '-');
  return {
    name: result[0],
    confidence: result[1],
    url: SVG_ENDPOINT + escapedName + '-01.svg',
    url_variant_1: SVG_ENDPOINT + escapedName + '-02.svg',
    url_variant_2: SVG_ENDPOINT + escapedName + '-03.svg'
  }
};


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

  return fp.compose(
    fp.map(resultMapper),
    fp.sortBy(sortResultsByConfidence),
  )(results);
};

const autoDraw = (shapes) => {
  console.log('auto drawing');
  const ink = getInk(shapes);
  const frame = getBoundingRect(shapes);

  return autodrawApiCall(ink, frame);
}
