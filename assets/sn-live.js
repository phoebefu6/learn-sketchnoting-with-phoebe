/* sn-live.js - the selection bench for learn-sketchnoting-with-phoebe.
 *
 * A real talk plays at speaking pace, you capture what matters in the box, and every
 * number the bench reports is computed from what you typed against the transcript.
 * Nothing is looked up from a table of "what good notes score".
 *
 * What it measures is SELECTION, not drawing. A browser cannot see your icons. It can
 * see how many of the talk's ideas survived into your notes, how much of your text is
 * the speaker's exact words, and how many words each idea cost you. Those three are
 * the mechanism that replicated in the note-taking research; the pen did not.
 *
 * Two kinds of number, and the widget labels each one:
 *   measured  - computed from the capture text and the transcript
 *   heuristic - the one-line verdict, which is a rule of thumb and says so
 *
 * Verbatim overlap follows Mueller and Oppenheimer's definition: the share of note
 * words that sit inside a run of three or more consecutive words that also appear
 * consecutively in the source. It is the one finding from that paper that every
 * replication reproduced.
 *
 * Public API (window.SN_LIVE) exists so the course map and the session pages can be
 * verified against a live browser rather than against my memory of one.
 */
(function () {
  "use strict";

  /* ---------- the talk ------------------------------------------------ */
  /* Daybreak, the coffee subscription company from the sibling courses. The founder
     gives the roastery team a nine-minute talk about the autumn roast. About 560
     words, twelve things worth keeping, and the usual amount of talking around them. */
  var TRANSCRIPT = [
    "Okay, thanks everyone for squeezing in. I want to talk about the autumn roast, and I want to be honest about where we are, because I think some of you have heard three different versions of this.",
    "First thing. The launch date is the second week of October. Not the first, not end of September, the second week. We moved it once already and we are not moving it again, so if anything you own does not fit that date, I need to hear it this week, not in October.",
    "Second, and this is the big one. Guji is short. Our Guji supplier came in at about sixty percent of what we asked for, so the autumn blend is going to lean on Sidamo for the body. That is fine, Sidamo is lovely, but it changes the flavour notes on the card and it means the old sleeve is wrong, because the old sleeve says Guji on the front in big letters.",
    "Which brings me to the sleeve. We need a new sleeve. Design has a draft. Legal has to sign off the copy, because we are making an origin claim on the front and origin claims are the thing that gets a small roaster a very expensive letter. Do not print anything until legal has signed.",
    "The roastery itself. First batch is four thousand bags, and we need them by the first of October so they have a week to rest before shipping. Four thousand is a lot for us. It is about double a normal week. So plan the shifts now, not in the last week of September.",
    "Pricing. Existing subscribers keep their current price. I want to say that clearly because it will come up. Nobody who is already with us pays more for the autumn roast. New subscribers see the seasonal price for their first two months, then they roll onto the normal tier. Finance is modelling what that does to margin and I have asked them for the number before we commit, so if the number is bad, the two-month bit might change. The existing-subscriber promise does not change.",
    "Comms. The launch email goes out ten days before launch. Marketing owes the landing page copy by the twentieth. Support has asked for the FAQ a week before the email goes, so they are not learning about the roast from customers, which happened last year, and I am sorry about that.",
    "We also want photos. Three product shots and one short video for the email. If anyone here has a friend with a camera, now is the time.",
    "One more. Retention wants a win-back offer in this launch for people who left us when the Guji ran out last spring. I think that is a good idea and I have said yes in principle, but it has to fit the email, it cannot be a second email.",
    "Last thing, and it is the thing I actually care about most. Nobody owns the launch checklist. Every one of these items has an owner, and the list of items has nobody. I would like a volunteer by Friday, and if there is no volunteer it is going to be me, and you do not want that, because I will make the checklist in a spreadsheet with forty tabs.",
    "That is it. Questions?"
  ].join(" ");

  /* Twelve things worth keeping. An idea counts as captured if any of its cues appears
     in the capture, on word stems, so "Sidamo" and "sidamo blend" both count. */
  var IDEAS = [
    { id: "date",      label: "Launch: second week of October, fixed",   cues: ["second week", "2nd week", "october", "oct", "launch date", "not moving"] },
    { id: "guji",      label: "Guji short, blend leans on Sidamo",        cues: ["guji", "sidamo", "sixty", "60"] },
    { id: "sleeve",    label: "New sleeve, old one names Guji",           cues: ["sleeve", "packaging"] },
    { id: "legal",     label: "Legal signs the origin claim first",       cues: ["legal", "origin claim", "sign"] },
    { id: "batch",     label: "4000 bags by 1 October, double a week",    cues: ["4000", "4,000", "four thousand", "first of october", "1 oct", "double"] },
    { id: "price",     label: "Existing subscribers keep their price",    cues: ["existing", "keep", "current price", "no increase", "same price", "unchanged", "current sub"] },
    { id: "seasonal",  label: "New subscribers: seasonal price, 2 months", cues: ["seasonal", "two months", "2 months", "new subscriber"] },
    { id: "finance",   label: "Finance models margin before commit",      cues: ["finance", "margin", "model"] },
    { id: "email",     label: "Email 10 days before; page copy the 20th", cues: ["ten days", "10 days", "twentieth", "20th", "landing page", "email"] },
    { id: "faq",       label: "Support wants the FAQ a week early",       cues: ["faq", "support"] },
    { id: "photos",    label: "3 photos, 1 video for the email",          cues: ["photo", "video", "camera", "shots"] },
    { id: "owner",     label: "Nobody owns the checklist; volunteer by Friday", cues: ["checklist", "owner", "owns", "volunteer", "friday", "nobody owns"] }
  ];

  /* ---------- the captures -------------------------------------------- */
  var PRESETS = [
    { id: "transcribe", label: "Type everything",
      note: "Fingers on the keyboard, trying to keep up. Small words dropped, big words kept, and it runs out before the end.",
      text: [
        "thx everyone squeezing in. talk about autumn roast, honest about where we are, some of you heard 3 different versions of this",
        "launch date second week of October. not the first not end of Sept, second week. moved it once already, not moving it again, if anything you own doesnt fit that date need to hear it this week not in October",
        "Guji is short. supplier came in at about sixty percent of what we asked for so autumn blend going to lean on Sidamo for the body. fine, Sidamo lovely, but changes the flavour notes on the card and means old sleeve is wrong bc old sleeve says Guji on the front big letters",
        "sleeve. need a new sleeve. design has a draft. legal has to sign off the copy, making an origin claim on the front, origin claims are the thing that gets a small roaster a very expensive letter. do not print anything until legal has signed",
        "roastery. first batch four thousand bags, need them by first of October so a week to rest before shipping. 4000 is a lot for us, about double a normal week. plan the shifts now not last week of Sept",
        "pricing. existing subscribers keep current price. nobody already with us pays more for autumn roast. new subscribers see the seasonal price first two months then roll onto normal tier. finance modelling what that does to margin, asked for the number before we commit, if bad the two month bit might change",
        "comms. launch email goes out ten days before launch. marketing owes landing page copy by the twentieth. support asked for FAQ a week before the email so not learning about roast from customers, happened last yr"
      ].join("\n") },

    { id: "keywords", label: "Keywords only",
      note: "One or two words per idea, nothing else. Everything is there and nothing is readable next week.",
      text: [
        "2nd wk Oct", "Guji short -> Sidamo", "new sleeve", "legal sign-off", "4000 bags 1 Oct", "existing keep price",
        "new: seasonal 2 mo", "finance margin", "email -10d, page 20th", "FAQ early", "3 photos 1 video", "checklist owner?"
      ].join("\n") },

    { id: "keyline", label: "Keyword and one line, my words",
      note: "A keyword to find it by, then the idea in your own words. The shape that survives a week.",
      text: [
        "DATE - 2nd week Oct, locked. Flag conflicts now, not later.",
        "GUJI - only ~60% arrived. Sidamo carries the body. Card notes change.",
        "SLEEVE - front still says Guji. Redesign underway.",
        "LEGAL - origin claim needs their signature before print.",
        "BATCH - 4000 bags by 1 Oct, roughly 2x normal. Schedule shifts early.",
        "PRICE - current subs: unchanged. Non-negotiable.",
        "NEW SUBS - seasonal rate 2 months, then standard. Provisional.",
        "FINANCE - margin model due before the 2-month decision.",
        "EMAIL - T-10 days. Landing copy due 20th (marketing).",
        "FAQ - support needs it 7 days pre-email. Burned last year.",
        "PHOTOS - 3 stills + 1 short clip.",
        "OWNER - checklist has none. Volunteer by Fri or founder does 40 tabs."
      ].join("\n") },

    { id: "pretty", label: "Draw everything beautifully", anti: true,
      note: "Every idea got an icon and a banner. The icons were lovely. The talk kept going.",
      text: [
        "AUTUMN ROAST (big banner, coffee cup icon, steam)",
        "Oct - calendar icon",
        "Guji -> Sidamo (two bean icons, arrow)",
        "sleeve (drew the bag)",
        "legal (scales icon)"
      ].join("\n") }
  ];

  /* ---------- text tools ---------------------------------------------- */
  function tokens(s) {
    return s.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9%]+/g, " ").trim().split(/\s+/).filter(Boolean);
  }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var T = tokens(TRANSCRIPT);
  var TSET = {}; T.forEach(function (w) { TSET[w] = true; });
  var TRI = {};
  for (var i = 0; i + 2 < T.length; i++) TRI[T[i] + " " + T[i + 1] + " " + T[i + 2]] = true;

  /* Verbatim overlap: mark every capture word that belongs to some 3-word run present
     in the transcript. Longest run is the longest such stretch. */
  function overlap(C) {
    var mark = new Array(C.length).fill(false);
    for (var i = 0; i + 2 < C.length; i++) {
      if (TRI[C[i] + " " + C[i + 1] + " " + C[i + 2]]) mark[i] = mark[i + 1] = mark[i + 2] = true;
    }
    var hit = 0, run = 0, best = 0;
    mark.forEach(function (m) { if (m) { hit++; run++; if (run > best) best = run; } else run = 0; });
    return { share: C.length ? Math.round(100 * hit / C.length) : 0, longest: best };
  }

  function ideasCovered(text) {
    var low = " " + text.toLowerCase().replace(/[^a-z0-9%]+/g, " ") + " ";
    return IDEAS.map(function (idea) {
      return idea.cues.some(function (c) {
        var cue = c.toLowerCase();
        return low.indexOf(" " + cue) >= 0 || low.indexOf(cue) >= 0 && cue.length > 5;
      });
    });
  }

  /* ---------- state ---------------------------------------------------- */
  var root, ta, readout, chips, presetBtns = {}, current = null, timer = null;
  var out = {};
  var player = { words: TRANSCRIPT.split(/\s+/), at: 0, wpm: 150, tick: null, started: null, elapsed: 0, stage: null, btn: null };

  function measure() {
    var text = ta.value;
    var C = tokens(text);
    var ov = overlap(C);
    var cov = ideasCovered(text);
    var n = cov.filter(Boolean).length;
    var own = C.filter(function (w) { return !TSET[w] && !/^\d/.test(w); }).length;
    var lines = text.split(/\n/).filter(function (l) { return l.trim(); }).length;
    out = {
      words: C.length,
      overlap: ov.share,
      longest: ov.longest,
      ideas: n,
      ideasOf: IDEAS.length,
      covered: cov,
      wordsPerIdea: n ? Math.round(10 * C.length / n) / 10 : 0,
      ownShare: C.length ? Math.round(100 * own / C.length) : 0,
      lines: lines,
      seconds: player.elapsed ? Math.round(player.elapsed) : null
    };
    render();
  }

  function grade() {
    if (out.words === 0) return ["bad", "Nothing captured yet"];
    if (out.ideas < 6) return ["bad", "Less than half the talk survived"];
    if (out.overlap > 40) return ["bad", "A transcript, not notes: " + out.overlap + "% is the speaker's exact words"];
    if (out.ideas >= 10 && out.wordsPerIdea < 4) return ["ok", "Complete, and too thin to read next week"];
    if (out.ideas >= 10 && out.overlap <= 25 && out.wordsPerIdea <= 14) return ["good", "Selected, in your own words"];
    if (out.ideas >= 10) return ["ok", "Complete, still mostly in their words"];
    return ["ok", "Most of it, in your words"];
  }

  function metric(label, value, unit, kind) {
    return '<div class="mb-metric"><span class="mb-mlabel">' + label + "</span>" +
           '<span class="mb-mvalue">' + value + "</span>" +
           '<span class="mb-munit">' + unit + "</span>" +
           '<span class="mb-mkind is-' + kind + '">' + kind + "</span></div>";
  }

  function render() {
    var g = grade();
    readout.innerHTML =
      '<div class="mb-verdict is-' + g[0] + '">' + esc(g[1]) + ' <span class="mb-mkind is-heuristic">heuristic</span></div>' +
      '<div class="mb-metrics">' +
        metric("Ideas captured", out.ideas + " / " + out.ideasOf, "of the talk's twelve", "measured") +
        metric("Verbatim overlap", out.overlap + "%", "words inside 3-word runs of the speaker's", "measured") +
        metric("Longest verbatim run", out.longest, "consecutive words", "measured") +
        metric("Words captured", out.words, out.lines + " lines", "measured") +
        metric("Words per idea", out.wordsPerIdea, "captured words over ideas", "measured") +
        metric("Your own words", out.ownShare + "%", "not in the transcript", "measured") +
        metric("Capture time", out.seconds === null ? "-" : out.seconds + "s", out.seconds === null ? "play the talk to time it" : "from play to stop", "measured") +
      "</div>";
    chips.innerHTML = IDEAS.map(function (idea, i) {
      return '<span class="sn-chip' + (out.covered[i] ? " is-on" : "") + '">' + (out.covered[i] ? "✓ " : "· ") + esc(idea.label) + "</span>";
    }).join("");
  }

  /* ---------- the player ---------------------------------------------- */
  function playerStep() {
    if (player.at >= player.words.length) { stopPlayer(); return; }
    var w = player.words[player.at++];
    var span = document.createElement("span");
    span.textContent = w + " ";
    player.stage.appendChild(span);
    player.stage.scrollTop = player.stage.scrollHeight;
    player.elapsed = (Date.now() - player.started) / 1000;
  }
  function startPlayer() {
    if (player.tick) return;
    if (player.at === 0) { player.stage.innerHTML = ""; player.started = Date.now(); player.elapsed = 0; }
    else player.started = Date.now() - player.elapsed * 1000;
    player.tick = setInterval(playerStep, 60000 / player.wpm);
    player.btn.textContent = "Pause";
    player.stage.classList.add("is-live");
  }
  function stopPlayer() {
    if (player.tick) { clearInterval(player.tick); player.tick = null; }
    player.btn.textContent = player.at >= player.words.length ? "Play again" : (player.at ? "Resume" : "Play at speaking pace");
    player.stage.classList.remove("is-live");
    if (player.at >= player.words.length) player.at = 0;
    measure();
  }

  /* ---------- wiring -------------------------------------------------- */
  function setText(text, presetId) {
    ta.value = text;
    current = presetId || null;
    Object.keys(presetBtns).forEach(function (id) {
      presetBtns[id].classList.toggle("is-on", id === current);
      presetBtns[id].querySelector("input").checked = (id === current);
    });
    player.elapsed = 0;
    measure();
  }
  function setPreset(id) {
    var p = PRESETS.filter(function (x) { return x.id === id; })[0];
    if (p) setText(p.text, id);
  }

  function build() {
    var play = document.createElement("div");
    play.className = "sn-player";
    play.innerHTML =
      '<div class="sn-controls"><button type="button" class="btn primary sn-play">Play at speaking pace</button>' +
      '<label class="sn-wpm">Pace <select><option value="130">130 wpm, slow</option><option value="150" selected>150 wpm, conversational</option><option value="175">175 wpm, brisk</option></select></label>' +
      '<span class="mb-hint">The founder\'s talk appears one word at a time. Capture in the box below while it plays. Stop when you stop.</span></div>' +
      '<div class="sn-stage" aria-live="off"><span class="sn-placeholder">The talk plays here.</span></div>';
    player.stage = play.querySelector(".sn-stage");
    player.btn = play.querySelector(".sn-play");
    player.btn.addEventListener("click", function () { player.tick ? stopPlayer() : startPlayer(); });
    play.querySelector("select").addEventListener("change", function (e) {
      player.wpm = +e.target.value;
      if (player.tick) { clearInterval(player.tick); player.tick = setInterval(playerStep, 60000 / player.wpm); }
    });

    var panel = document.createElement("div");
    panel.className = "mb-presets";
    PRESETS.forEach(function (p) {
      var lab = document.createElement("label");
      lab.className = "mb-preset" + (p.anti ? " is-anti" : "");
      lab.innerHTML = '<input type="radio" name="mb-preset" value="' + p.id + '">' +
        '<span class="mb-pname">' + esc(p.label) +
        (p.anti ? ' <em class="mb-anti">the one that feels like sketchnoting</em>' : "") + "</span>" +
        '<span class="mb-pnote">' + esc(p.note) + "</span>";
      panel.appendChild(lab);
      presetBtns[p.id] = lab;
      lab.querySelector("input").addEventListener("change", function () { setPreset(p.id); });
    });

    var edit = document.createElement("div");
    edit.className = "mb-edit";
    edit.innerHTML = '<label for="sn-capture">Your capture - type while the talk plays, or load a preset</label>' +
      '<textarea id="sn-capture" spellcheck="false" placeholder="One idea per line. Keywords first, your own words after."></textarea>' +
      '<span class="mb-hint">The numbers below are computed from this box against the transcript. Icons and lettering are not measured here; what survived is.</span>';
    ta = edit.querySelector("textarea");
    ta.addEventListener("input", function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        current = null;
        Object.keys(presetBtns).forEach(function (id) {
          presetBtns[id].classList.remove("is-on");
          presetBtns[id].querySelector("input").checked = false;
        });
        measure();
      }, 160);
    });

    readout = document.createElement("div");
    readout.className = "mb-readout";
    chips = document.createElement("div");
    chips.className = "sn-chips";

    root.appendChild(play);
    root.appendChild(panel);
    root.appendChild(edit);
    root.appendChild(readout);
    root.appendChild(chips);
    setPreset("transcribe");
  }

  function init() {
    root = document.getElementById("selection-bench");
    if (!root) return;
    build();
    window.SN_LIVE = {
      presets: PRESETS.map(function (p) { return p.id; }),
      preset: setPreset,
      set: function (text) { setText(text, null); },
      get text() { return ta.value; },
      get current() { return current; },
      get metrics() { return out; },
      get transcriptWords() { return T.length; },
      ideas: IDEAS.map(function (i) { return i.label; })
    };
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
})();
