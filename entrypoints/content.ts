export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    console.log(`[Cookie Banner Closer] Loaded on ${location.hostname}`);
  },
});
