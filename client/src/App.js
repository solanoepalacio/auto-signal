import { useState } from 'react';
import { autoDraw } from './services/autodraw-api';

import VideoFeedback from './components/VideoFeedback';
import ImageSuggestionBox from './components/ImageSuggestionBox';

import './App.css';


function App() {
  const [ imageSuggestions, setImageSuggestions ] = useState([]);
  const handleSubmitLines = async (...args) => {
    const imageSuggestions = await autoDraw(...args);
    console.log('imageSuggestions', imageSuggestions);
    setImageSuggestions(imageSuggestions);
  };

  const [ imagesPicked, setImagesPicked ] = useState([]);
  const handleCleanPickedImages = () => setImagesPicked([]);
  const handleAddPick = (pick) => setImagesPicked([...imagesPicked, pick]);

  return (
    <div className="App">
      <div className="images-container">
        <ImageSuggestionBox onImagePicked={handleAddPick} imageSuggestions={imageSuggestions} />

        <div className="picks"></div>
      </div>
      <VideoFeedback onSubmitLines={handleSubmitLines}/>
    </div>
  );
}

export default App;
