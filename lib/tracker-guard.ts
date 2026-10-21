// Keeps obvious crawlers out of Umami before anything is sent (T-0248).
//
// The tracker in site-document.tsx names `umamiBeforeSend` in its
// data-before-send attribute. Umami calls it with every pageview and event and
// sends nothing when it returns a falsy value. The recorder needs the tracker's
// session before it records, so a visit dropped here sends no recording either.
//
// What it drops, and why each rule is safe for a real visitor:
//
// - navigator.webdriver true: the flag the WebDriver spec sets on any browser
//   driven by automation (Selenium, Playwright, Puppeteer).
// - A HeadlessChrome or PhantomJS user agent. Umami's own server check drops
//   most of these already; this saves the request.
// - A laptop or desktop screen that is square, or landscape and narrower than
//   6:5. This is the one that matters. On 21 October 2026 Singapore was the
//   shop's second country, 52 of 312 sessions, and it was two crawlers: one at
//   1280x1200 every time, one at a new random size near 1300x1150 every
//   session, both a single pageview. Of the 111 sessions in Umami with such a
//   screen, all but one is a single pageview. The squarest real desktop shape,
//   5:4 (1280x1024), passes. A touch screen always passes, so a Galaxy Fold
//   held open in landscape (about 1.16) is counted as the person it is.
//
// The reports in datamachine-reports apply the same screen rule at read time,
// so sessions from before this guard are filtered there, and their raw view
// (include_bots=1) still shows everything Umami stored.
//
// The script is a string because it runs inline in <head>, before the tracker
// loads; lib/tracker-guard.test.ts runs this exact string.

export const TRACKER_GUARD_FUNCTION = 'umamiBeforeSend';

export const TRACKER_GUARD_SCRIPT = `(function () {
  function isBot(nav, screen) {
    if (nav.webdriver === true) return true;
    if (/HeadlessChrome|PhantomJS/.test(nav.userAgent || '')) return true;
    if ((nav.maxTouchPoints || 0) > 0) return false;
    var m = /^(\\d+)x(\\d+)$/.exec(screen || '');
    if (!m) return false;
    var w = +m[1], h = +m[2];
    return w >= h && w * 5 < h * 6;
  }
  window.${TRACKER_GUARD_FUNCTION} = function (type, payload) {
    try {
      return isBot(navigator, payload && payload.screen) ? false : payload;
    } catch (e) {
      return payload;
    }
  };
})();`;
