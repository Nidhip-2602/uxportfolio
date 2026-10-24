/* Brave Buddy — interactive task-flow walkthrough.
   Screens are the original Figma exports (780×1688 = iPhone 13 @2x). Hotspot
   rectangles are in those image pixels: [x1, y1, x2, y2, target, label, quiet].
   target = step index (0-based) or 'back' (return to the previously visited step). */
(function () {
  var root = document.getElementById('bb-walk');
  if (!root) return;

  var BASE = '../assets/images/Selective Mutism/';
  var W = 780, H = 1688;
  var HOME_TAB = [34, 1530, 150, 1650, 0, 'Home tab', true];
  var BACK_L   = [40, 96, 130, 196, 'back', 'Back'];

  var STEPS = [
    {
      file: '1.1 Home · Today.png', stage: 'Start',
      title: 'One clear thing to do today',
      points: ['Today’s activity sits at the top, with its reward.', 'One Start button, no choices to make.', 'Goal and progress stay quieter below.', 'Tapping the card opens the activity details.'],
      tryIt: 'Tap on today’s activity card',
      hot: [[644, 366, 724, 454, 1, 'See activity details']]
    },
    {
      file: '1.3 Activity details.png', stage: 'Understand',
      title: 'Everything the parent needs, in a fixed order',
      points: ['Goal, situation, difficulty, instructions, reward: always in this order.', 'Four short steps, written like a calm coach.', '“A whisper counts” keeps expectations low.'],
      tryIt: 'Tap on the CTA for the next step',
      hot: [[44, 1386, 746, 1498, 2, 'Start activity']]
    },
    {
      file: '1.4 Get ready.png', stage: 'Prepare',
      title: 'Calm the setup before the activity begins',
      points: ['Confirms the device is connected and charged.', 'Audio stays on this phone, and there is no timer.', 'Warm phrases the parent can borrow.'],
      tryIt: 'Tap Next',
      hot: [[40, 1160, 740, 1272, 3, 'Next'], HOME_TAB]
    },
    {
      file: '1.5 Activity in progress.png', stage: 'Practise',
      title: 'A quiet screen while the child practises',
      points: ['The screen shows the device is working and the progress it has recorded.', 'The voice gauge is for the adult; 40 dB is a target, not a pass mark.', 'Take a break carries the same weight as Finish.'],
      tryIt: 'Tap Finish activity',
      hot: [[40, 1372, 740, 1484, 4, 'Finish activity'], HOME_TAB]
    },
    {
      file: '1.6 Well done.png', stage: 'Celebrate',
      title: 'Praise first, paperwork second',
      points: ['Praise comes before any data entry.', 'Courage, Communication and Persistence name what is being built.', 'Not now is always available, with no guilt.'],
      tryIt: 'Tap Record results',
      hot: [[42, 1016, 738, 1128, 5, 'Record results'], HOME_TAB]
    },
    {
      file: '1.7 Results · what Buddy heard.png', stage: 'Review',
      title: 'What Buddy heard, ready to correct',
      points: ['Four big figures: attempts, speech, duration, volume.', 'The parent can correct attempts and edit the transcript.', 'The lock icon shows it was drafted on this phone.'],
      tryIt: 'Tap Next',
      hot: [[40, 1314, 736, 1426, 6, 'Next']]
    },
    {
      file: '1.8 Results · support and how it went.png', stage: 'Capture',
      title: 'Context in a single tap',
      points: ['Support and outcome are one-tap chips.', '“Skipped, and that is okay” is a valid answer.', 'Adding an observation is optional.'],
      tryIt: 'Tap Add observation',
      hot: [[40, 1298, 740, 1488, 7, 'Add observation']]
    },
    {
      file: '1.9 Add observation.png', stage: 'Observe',
      title: 'Notice first, write only if you want to',
      points: ['Chips first; voice note and text come second.', 'Voice notes stay on the phone.', 'Skip for now is always there.'],
      tryIt: 'Tap Save observation',
      hot: [[40, 1158, 736, 1270, 8, 'Save observation']]
    },
    {
      file: '1.10 Review and save results.png', stage: 'Confirm',
      title: 'One summary, and control over sharing',
      points: ['Every value in one summary, before saving.', 'Sharing with Dr. Rao is a visible toggle.', 'Saved on this phone first.'],
      tryIt: 'Tap Save results',
      hot: [[44, 1196, 740, 1308, 9, 'Save results'], HOME_TAB]
    },
    {
      file: '1.11 Saved · choose a sticker.png', stage: 'Close the loop',
      title: 'The effort is added to Riya’s progress',
      points: ['Confirms the effort counts toward progress.', 'The parent picks a sticker as the reward.', 'Exit to progress or back to Today.'],
      tryIt: 'Tap Back to Today, or restart the walkthrough',
      hot: [[260, 1060, 520, 1125, 0, 'Back to Today'], HOME_TAB]
    }
  ];

  var N = STEPS.length;
  var idx = 0;
  var history = [];

  var screenEl = root.querySelector('.bbw-screen');
  var eyebrow = root.querySelector('.bbw-eyebrow');
  var title = root.querySelector('.bbw-title');
  var points = root.querySelector('.bbw-points');
  var tryEl = root.querySelector('.bbw-try-text');
  var counter = root.querySelector('.bbw-counter');
  var dotsEl = root.querySelector('.bbw-dots');
  var prev = root.querySelector('.bbw-btn--prev');
  var next = root.querySelector('.bbw-btn--next');

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function pct(v, total) { return (v / total * 100).toFixed(3) + '%'; }

  var slides = STEPS.map(function (s, i) {
    var slide = document.createElement('div');
    slide.className = 'bbw-slide';
    slide.setAttribute('aria-hidden', 'true');

    var img = document.createElement('img');
    img.src = BASE + encodeURI(s.file).replace(/%2F/g, '/');
    img.alt = 'Brave Buddy screen ' + (i + 1) + ' of ' + N + ': ' + s.title;
    img.decoding = 'async';
    if (i > 1) img.loading = 'lazy';
    slide.appendChild(img);

    var layer = document.createElement('div');
    layer.className = 'bbw-layer';
    s.hot.forEach(function (h) {
      var b = document.createElement('button');
      b.type = 'button';
      b.tabIndex = -1;
      b.className = 'bbw-hot' + (h[6] ? ' bbw-hot--quiet' : '');
      b.style.left = pct(h[0], W);
      b.style.top = pct(h[1], H);
      b.style.width = pct(h[2] - h[0], W);
      b.style.height = pct(h[3] - h[1], H);
      b.setAttribute('aria-label', h[5]);
      b.addEventListener('click', function () { go(h[4]); });
      layer.appendChild(b);
    });
    slide.appendChild(layer);
    screenEl.appendChild(slide);
    return slide;
  });

  var dots = STEPS.map(function (s, i) {
    var d = document.createElement('button');
    d.type = 'button';
    d.className = 'bbw-dot';
    d.setAttribute('aria-label', 'Go to step ' + (i + 1) + ': ' + s.stage);
    d.addEventListener('click', function () { if (i !== idx) { history.push(idx); render(i); } });
    dotsEl.appendChild(d);
    return d;
  });

  function render(i) {
    idx = i;
    var s = STEPS[i];
    slides.forEach(function (el, k) {
      var on = k === i;
      el.classList.toggle('is-active', on);
      el.setAttribute('aria-hidden', on ? 'false' : 'true');
      el.querySelectorAll('.bbw-hot').forEach(function (b) { b.tabIndex = on ? 0 : -1; });
    });
    dots.forEach(function (d, k) {
      d.classList.toggle('is-active', k === i);
      if (k === i) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current');
    });
    eyebrow.textContent = 'Step ' + (i + 1) + ' · ' + s.stage;
    title.textContent = s.title;
    points.innerHTML = '';
    s.points.forEach(function (n) {
      var li = document.createElement('li');
      li.textContent = n;
      points.appendChild(li);
    });
    tryEl.textContent = s.tryIt;
    counter.innerHTML = pad(i + 1) + '<span> / ' + pad(N) + '</span>';
    prev.disabled = i === 0 && history.length === 0;
    next.textContent = i === N - 1 ? 'Restart ↺' : 'Next →';
  }

  function go(target) {
    if (target === 'back') return back();
    if (target === idx) return;
    history.push(idx);
    render(target);
  }
  function back() {
    if (history.length) render(history.pop());
    else if (idx > 0) render(idx - 1);
  }
  function forward() {
    if (idx === N - 1) { history = []; render(0); }
    else go(idx + 1);
  }

  prev.addEventListener('click', back);
  next.addEventListener('click', forward);

  root.addEventListener('keydown', function (e) {
    if (e.target.closest && e.target.closest('.bbw-hot')) { if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return; }
    if (e.key === 'ArrowRight') { e.preventDefault(); forward(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); back(); }
  });

  // Swipe on the phone (horizontal only, so vertical page scroll is untouched)
  var sx = 0, sy = 0;
  screenEl.addEventListener('touchstart', function (e) {
    sx = e.changedTouches[0].clientX; sy = e.changedTouches[0].clientY;
  }, { passive: true });
  screenEl.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 60 && Math.abs(dy) < 40) { if (dx < 0) forward(); else back(); }
  }, { passive: true });

  render(0);
})();
