
const getHandLandmarks = (handsfree) => handsfree.data.hands && handsfree.data.hands.landmarks || [];

function getIndexPinch (handsfree) {
  const pinchState = handsfree.data.hands &&
    handsfree.data.hands.pinchState ||
    null;

  if (!pinchState) return null;
  const [_, rightHandPinches] = pinchState;
  
  return rightHandPinches[0] === 'held';
}

function getPinchFingers (handsfree) {
  const rightHand = getRightHand(handsfree);
  if (rightHand) {
    const pinch = getIndexPinch(handsfree);
    return [ rightHand[4], rightHand[8], pinch ];
  }

  else return [ null, null, null ];
};

const getRightHand = (handsfree) => {
  const landmarks = getHandLandmarks(handsfree);
  return landmarks.length ? landmarks[1] : null;
};


export default { getPinchFingers };