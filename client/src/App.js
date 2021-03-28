import { useState, useRef, useEffect } from 'react';
import { autoDraw } from './services/autodraw-api';

import VideoFeedback from './components/VideoFeedback';

import './App.css';
const VIDEO_FEEDBACK_HEIGHT = 720 + 44;


const imgClasses = (url, selectedImage) => {
  const classes = ['drawing'];
  if (selectedImage && url === selectedImage.url) {
    classes.push('selected');
  }
  return classes.join(' ');
}
function App() {
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
    const newPicks = [ ...imagesPickedRef.current, pick ];
    return setPicks(newPicks);
  };

  const imageToolbarHeight = window.innerHeight - VIDEO_FEEDBACK_HEIGHT;
  const imageHeight = imageToolbarHeight - 50;

  const handleMouseClick = (e) => {
    if (selectedImageRef.current) handleAddPick(selectedImageRef.current);
    selectImage(null);
    setImageSuggestions([]);
  };

  const handleKeyDown = (e) => {
    const getSelectedImageIndex = (selectedUrl) => {
      return imageSuggestionsRef.current.findIndex((suggestion) => {
        return suggestion.url === selectedUrl;
      });
    };

    if (e.code === 'ArrowLeft') {
      const selectedIndex = getSelectedImageIndex(selectedImageRef.url);
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
  }

  const listenersSet = useRef(false);

  const setListenersOnce = () => {
    if (!listenersSet.current) {
      listenersSet.current = true;
      document.addEventListener('click', handleMouseClick);
      document.addEventListener('keydown', handleKeyDown);
    }
  }

  useEffect(() => {
    setListenersOnce();
  });

  return (
    <div className="App">
      <div className="image-toolbar">
        <div className="image-container suggestions" style={{ height: imageToolbarHeight }}>
          <div className="images">
            {imageSuggestions.map(({ url }) => (
              <img
                className={imgClasses(url, selectedImage)}
                style={{ width: `${imageHeight}px`, height: `${imageHeight}px` }}
                src={url}
              />
            ))}
          </div>
        </div>
        <div className="image-container picks" style={{ height: `${imageToolbarHeight}px` }}>
          <div className="images">
            {imagesPicked.map(({url}) => {
              return (<img src={url} className="drawing" />)
            })}
          </div>
        </div>
      </div>
      <VideoFeedback onSubmitLines={handleSubmitLines} />
    </div>
  );
}

export default App;
