function ImageSuggestionBox({ onImagePicked, imageSuggestions }) {
  return (
    <div className="suggestions">
      {imageSuggestions.map(({ url }) => {
        return (<img src={url} />)
      })}
    </div>
  );
};

export default ImageSuggestionBox;