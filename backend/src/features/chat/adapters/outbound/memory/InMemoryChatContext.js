let context = null;

const get = () => context;
const set = (value) => { context = value; };
const reset = () => { context = null; };

module.exports = { get, set, reset };
