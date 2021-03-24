import { useState } from 'react';
import { autoDraw } from './services/autodraw-api';

import VideoFeedback from './components/VideoFeedback';

import './App.css';


function App() {
  const [ imgs, setImgs ] = useState([]);
  const handleSubmitLines = async (...args) => {
    const imageSuggestions = await autoDraw(...args);
    console.log('imageSuggestions', imageSuggestions);
    setImgs(imageSuggestions);
  }


  return (
    <div className="App">
      <div className="images-container">
        <div className="suggestions">
          {imgs.map(({ url }) => {
            return (<img src={url} />)
          })}
        </div>
        <div className="picks"></div>
      </div>
      <VideoFeedback onSubmitLines={handleSubmitLines}/>
    </div>
  );
}

export default App;
