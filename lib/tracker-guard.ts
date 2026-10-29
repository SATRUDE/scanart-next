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

// Loads Umami's session recorder (recorder.js) unless the browser sends a
// privacy signal: Global Privacy Control (navigator.globalPrivacyControl) or
// Do Not Track ("1"). The privacy page promises that such browsers are not
// recorded (T-0410), and the recorder has no setting for it, so the tag is
// simply never added. Inserted as a classic script, so the recorder still
// finds its data-website-id through document.currentScript.
//
// Temporary: it goes when Umami is retired (about 9 November 2026) and the
// recordings move to our own recorder (T-0411), which applies the same rule.

export const UMAMI_RECORDER_SRC = 'https://datamachine.vercel.app/recorder.js';
export const UMAMI_WEBSITE_ID = 'a2c30bff-57c9-4b47-a7a1-c77bb1718e41';

export const UMAMI_RECORDER_LOADER = `(function () {
  try {
    var n = navigator;
    if (n.globalPrivacyControl === true) return;
    if (n.doNotTrack === '1' || window.doNotTrack === '1' || n.msDoNotTrack === '1') return;
  } catch (e) {
    return;
  }
  var s = document.createElement('script');
  s.src = '${UMAMI_RECORDER_SRC}';
  s.defer = true;
  s.setAttribute('data-website-id', '${UMAMI_WEBSITE_ID}');
  document.head.appendChild(s);
})();`;
