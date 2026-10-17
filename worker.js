/* The portfolio is a static site. The Worker hands every request to the
   assets binding, which serves the file or the SPA fallback. */
export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
};
