
function debouncedListener (event, callback) {
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

function point (x = 0, y = 0) {
  return { x, y };
}

export default { debouncedListener, point };