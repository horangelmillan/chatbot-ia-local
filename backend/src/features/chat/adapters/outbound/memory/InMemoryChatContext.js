var context = null;

function get() {
  return context;
}

function set(value) {
  context = value;
}

function reset() {
  context = null;
}

module.exports = { get, set, reset };
