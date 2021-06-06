
const getHandLandmarks = (handsfree) => handsfree.data.hands && handsfree.data.hands.landmarks || [];

function getIndexPinch (handsfree) {
  const pinchState = handsfree.data.hands &&
    handsfree.data.hands.pinchState ||
    null;

  if (!pinchState) return null;
  const [_, handPinches] = pinchState;
  
  return handPinches[0] === 'held';
}

function getPinchFingers (handsfree, rightOrLeft, landmarkIndex) {
  const hand = getHand(handsfree, rightOrLeft);
  if (hand) {
    const pinch = getIndexPinch(handsfree, rightOrLeft);
    return [ hand[4], hand[landmarkIndex], pinch ];
  }

  else return [ null, null, null ];
};

const getHand = (handsfree, rightOrLeft) => {
  const landmarks = getHandLandmarks(handsfree);
  if (!landmarks.length) return null;
  const handIndex = rightOrLeft === 'right' ? 1 : 0;
  return landmarks[handIndex];
};


export default { getPinchFingers };