function debouncedListener(event, callback) {
  let execution;
  const listener = (e) => {
    if (execution) window.cancelAnimationFrame(execution);

    execution = requestAnimationFrame(() => callback(e));
  };

  window.addEventListener(event, listener);

  return function unregister() {
    window.removeEventListener(event, listener);
  }
};

export default { debouncedListener };