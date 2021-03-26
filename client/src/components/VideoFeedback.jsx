import { useEffect, useRef } from 'react';
// https://stackoverflow.com/questions/40650306/how-to-draw-a-smooth-continuous-line-with-mouse-using-html-canvas-and-javascript
var simplifyLineRDP = function(points, length = 3) {
  var simplify = function(start, end) { // recursize simplifies points from start to end
      var maxDist, index, i, xx , yy, dx, dy, ddx, ddy, p1, p2, p, t, dist, dist1;
      p1 = points[start];
      p2 = points[end];   
      xx = p1[0];
      yy = p1[1];
      ddx = p2[0] - xx;
      ddy = p2[1] - yy;
      dist1 = (ddx * ddx + ddy * ddy);
      maxDist = length;
      for (var i = start + 1; i < end; i++) {
          p = points[i];
          if (ddx !== 0 || ddy !== 0) {
              t = ((p[0] - xx) * ddx + (p[1] - yy) * ddy) / dist1;
              if (t > 1) {
                  dx = p[0] - p2[0];
                  dy = p[1] - p2[1];
              } else 
              if (t > 0) {
                  dx = p[0] - (xx + ddx * t);
                  dy = p[1] - (yy + ddy * t);
              } else {
                  dx = p[0] - xx;
                  dy = p[1] - yy;
              }
          }else{
              dx = p[0] - xx;
              dy = p[1] - yy;
          }
          dist = dx * dx + dy * dy 
          if (dist > maxDist) {
              index = i;
              maxDist = dist;
          }
      }

      if (maxDist > length) { // continue simplification while maxDist > length
          if (index - start > 1){
              simplify(start, index);
          }
          newLine.push(points[index]);
          if (end - index > 1){
              simplify(index, end);
          }
      }
  }    
  var end = points.length - 1;
  var newLine = [points[0]];
  simplify(0, end);
  newLine.push(points[end]);
  return newLine;
}

var smoothLine = function(points,cornerThres,match){  // adds bezier control points at points if lines have angle less than thres
  var  p1, p2, p3, dist1, dist2, x, y, endP, len, angle, i, newPoints, aLen, closed, bal, cont1, nx1, nx2, ny1, ny2, np;
  function dot(x, y, xx, yy) {  // get do product
      // dist1,dist2,nx1,nx2,ny1,ny2 are the length and  normals and used outside function
      // normalise both vectors
      dist1 = Math.sqrt(x * x + y * y); // get length
      if (dist1  > 0) {  // normalise
          nx1 = x / dist1 ;
          ny1 = y / dist1 ;
      }else {
          nx1 = 1;  // need to have something so this will do as good as anything
          ny1 = 0;
      }
      dist2  = Math.sqrt(xx * xx + yy * yy);
      if (dist2  > 0) {
          nx2 = xx / dist2;
          ny2 = yy / dist2;
      }else {
          nx2 = 1;
          ny2 = 0;
      }
     return Math.acos(nx1 * nx2 + ny1 * ny2 ); // dot product
  }
  newPoints = []; // array for new points
  aLen = points.length;
  if(aLen <= 2){  // nothing to if line too short
      for(i = 0; i < aLen; i ++){  // ensure that the points are copied          
          newPoints.push([points[i][0],points[i][1]]);
      }
      return newPoints;
  }
  p1 = points[0];
  endP =points[aLen-1];
  i = 0;  // start from second poitn if line not closed
  closed = false;
  len = Math.hypot(p1[0]- endP[0], p1[1]-endP[1]);
  if(len < Math.SQRT2){  // end points are the same. Join them in coordinate space
      endP =  p1;
      i = 0;             // start from first point if line closed
      p1 = points[aLen-2];
      closed = true;
  }       
  newPoints.push([points[i][0],points[i][1]])
  for(; i < aLen-1; i++){
      p2 = points[i];
      p3 = points[i + 1];
      angle = Math.abs(dot(p2[0] - p1[0], p2[1] - p1[1], p3[0] - p2[0], p3[1] - p2[1]));
      if(dist1 !== 0){  // dist1 and dist2 come from dot function
          if( angle < cornerThres*3.14){ // bend it if angle between lines is small
                if(match){
                    dist1 = Math.min(dist1,dist2);
                    dist2 = dist1;
                }
                // use the two normalized vectors along the lines to create the tangent vector
                x = (nx1 + nx2) / 2;  
                y = (ny1 + ny2) / 2;
                len = Math.sqrt(x * x + y * y);  // normalise the tangent
                if(len === 0){
                    newPoints.push([p2[0],p2[1]]);                                  
                }else{
                    x /= len;
                    y /= len;
                    if(newPoints.length > 0){
                        var np = newPoints[newPoints.length-1];
                        np.push(p2[0]-x*dist1*0.25);
                        np.push(p2[1]-y*dist1*0.25);
                    }
                    newPoints.push([  // create the new point with the new bezier control points.
                          p2[0],
                          p2[1],
                          p2[0]+x*dist2*0.25,
                          p2[1]+y*dist2*0.25
                    ]);
                }
          }else{
              newPoints.push([p2[0],p2[1]]);            
          }
      }
      p1 = p2;
  }  
  if(closed){ // if closed then copy first point to last.
      p1 = [];
      for(i = 0; i < newPoints[0].length; i++){
          p1.push(newPoints[0][i]);
      }
      newPoints.push(p1);
  }else{
      newPoints.push([points[points.length-1][0],points[points.length-1][1]]);      
  }
  return newPoints;    
}


const drawPaths = (lines, canvasContext, lineColor = 'green') => {
  lines.forEach((pointPositions) => {
    if (pointPositions.length < 1) return;
    const simplified = simplifyLineRDP(pointPositions.map(({ x, y }) => [ x, y ]));

    canvasContext.beginPath();

    let [firstX, firstY ] = simplified.shift()

    canvasContext.moveTo(firstX, firstY);
    simplified.forEach(([ currX, currY ]) => {
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

function VideoFeedback({ onSubmitLines }) {
  let listenersSet = useRef(false);
  let shouldDraw = useRef(false);
  let currentLine = useRef(null);
  let lines = useRef([]);
  let canvasWidth = useRef(0);
  let canvasHeight = useRef(0);
  const canvasRef = useRef('canvas');

  const onKeyDown = (e) => {
    console.log('Pressed:', e.code);
    if (e.repeat) return;

    if (e.code === 'Space') {
      shouldDraw.current = true;
      currentLine.current = [];
      lines.current.push(currentLine.current);
      return;
    }

    if (e.code === 'ArrowDown') {
      const canvasContext = canvasRef.current.getContext('2d');
      console.log('clearing rect', canvasWidth.current, canvasHeight.current);
      canvasContext.clearRect(0, 0, canvasWidth.current, canvasHeight.current);
      lines.current = [];
      return;
    }
  }

  const onKeyUp = (e) => {
    if (e.code === 'Space') {
      shouldDraw.current = false;
      onSubmitLines(lines.current, canvasWidth.current, canvasHeight.current);
    }
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
      listenersSet.current = true;
      document.addEventListener('keydown', onKeyDown);
      document.addEventListener('keyup', onKeyUp);
    }

    const loop = () => {
      requestAnimationFrame(() => {
        if (!canvasWidth.current || !canvasHeight.current) {
          canvasWidth.current = canvasRef.current.width;
          canvasHeight.current = canvasRef.current.height;
        }

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
