/* ============================================
   WHO ELSE? — Application Logic
   ============================================ */

(function () {
  "use strict";

  // ---- State ----
  let currentLang = languages[0];
  let tourInterval = null;
  let isTourActive = false;

  // ---- DOM refs ----
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const heroPhrase = $(".hero__phrase");
  const heroRomanization = $(".hero__romanization");
  const heroGloss = $(".hero__gloss");
  const heroLangLabel = $(".hero__lang-label");
  const heroNativeName = $(".hero__native-name");
  const heroAudioBtn = $(".hero__audio-btn");
  const counterNumber = $(".counter__number");
  const counterLabel = $(".counter__label");
  const searchInput = $(".sidebar__search input");
  const sidebarLangList = $(".sidebar__langs");
  const infoGrid = $(".info-panel__grid");
  const infoNoteText = $(".info-panel__note-text");
  const heroFrequency = $(".hero__frequency");
  const worldMapContainer = $("#world-map-container");
  const universalPhrasesGrid = $(".universal-phrases__grid");
  const universalPhrasesLangName = $(".universal-phrases__lang-name");
  const shareModal = $(".share-modal");
  const shareCanvas = $("#share-canvas");
  const tourBanner = $(".tour-banner");
  const toast = $(".toast");

  // ---- Init ----
  function init() {
    // Inject world map SVG
    if (typeof worldMapSVG !== "undefined") {
      worldMapContainer.innerHTML = worldMapSVG;
    }
    renderSidebar();
    selectLanguage(languages[0]);
    animateCounter();
    bindEvents();
  }

  // ---- Sidebar ----
  function renderSidebar(filter = "") {
    sidebarLangList.innerHTML = "";
    const lowerFilter = filter.toLowerCase();

    languageFamilies.forEach((fam) => {
      const familyLangs = languages.filter(
        (l) =>
          l.family === fam.name &&
          (lowerFilter === "" ||
            l.name.toLowerCase().includes(lowerFilter) ||
            l.nativeName.toLowerCase().includes(lowerFilter) ||
            l.phrase.toLowerCase().includes(lowerFilter))
      );
      if (familyLangs.length === 0) return;

      const group = document.createElement("div");
      group.className = "family-group";

      const header = document.createElement("div");
      header.className = "family-group__header";
      header.setAttribute("role", "button");
      header.setAttribute("aria-expanded", "true");
      header.setAttribute("tabindex", "0");
      header.innerHTML = `
        <span class="arrow">&#9660;</span>
        <span class="family-group__dot" style="background:${fam.color}"></span>
        ${fam.name}
        <span class="family-group__count">${familyLangs.length}</span>
      `;

      const list = document.createElement("ul");
      list.className = "family-group__list";
      list.setAttribute("role", "list");

      familyLangs.forEach((lang) => {
        const li = document.createElement("li");
        li.className = "lang-item" + (lang.code === currentLang.code ? " active" : "");
        li.setAttribute("role", "listitem");
        li.setAttribute("tabindex", "0");
        li.setAttribute("aria-label", `${lang.name} — ${lang.nativeName}`);
        li.dataset.code = lang.code;

        let badges = "";
        if (lang.scriptDirection === "rtl") {
          badges += `<span class="lang-item__dir-badge lang-item__dir-badge--rtl">RTL</span>`;
        }
        if (lang.script !== "Latin") {
          badges += `<span class="lang-item__script-badge">${lang.script}</span>`;
        }

        li.innerHTML = `${lang.name} ${badges}`;

        li.addEventListener("click", () => selectLanguage(lang));
        li.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            selectLanguage(lang);
          }
        });
        list.appendChild(li);
      });

      // Toggle collapse
      const toggleCollapse = () => {
        const expanded = header.getAttribute("aria-expanded") === "true";
        header.setAttribute("aria-expanded", String(!expanded));
        if (expanded) {
          list.classList.add("collapsed");
          header.classList.add("collapsed");
        } else {
          list.classList.remove("collapsed");
          header.classList.remove("collapsed");
        }
      };
      header.addEventListener("click", toggleCollapse);
      header.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleCollapse();
        }
      });

      // Set initial max-height for smooth collapse
      list.style.maxHeight = familyLangs.length * 50 + "px";

      group.appendChild(header);
      group.appendChild(list);
      sidebarLangList.appendChild(group);
    });
  }

  // ---- Select Language ----
  function selectLanguage(lang) {
    currentLang = lang;

    // Slot-machine spin out
    heroPhrase.classList.add("spin-out");
    setTimeout(() => {
      // Update hero
      heroLangLabel.textContent = lang.name;
      heroNativeName.textContent = lang.nativeName;

      heroPhrase.textContent = lang.phrase;
      if (lang.scriptDirection === "rtl") {
        heroPhrase.setAttribute("dir", "rtl");
      } else {
        heroPhrase.removeAttribute("dir");
      }

      heroRomanization.textContent = lang.romanization || "";
      heroRomanization.style.display = lang.romanization ? "block" : "none";

      heroGloss.textContent = lang.literalGloss;

      // Audio button
      if (lang.audioLang && "speechSynthesis" in window) {
        heroAudioBtn.classList.remove("hidden");
        heroAudioBtn.setAttribute("aria-label", `Listen to "${lang.phrase}" in ${lang.name}`);
      } else {
        heroAudioBtn.classList.add("hidden");
      }

      // Update frequency + map
      updateFrequency(lang);
      updateWorldMap(lang);

      // Update info panel
      updateInfoPanel(lang);
      updateUniversalPhrases(lang);

      // Update active state in sidebar
      $$(".lang-item").forEach((el) => {
        el.classList.toggle("active", el.dataset.code === lang.code);
      });

      // Scroll active item into view
      const activeItem = $(`.lang-item[data-code="${lang.code}"]`);
      if (activeItem) {
        activeItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }

      // Slot-machine: position below, then spin in
      heroPhrase.classList.remove("spin-out");
      heroPhrase.classList.add("spin-ready");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          heroPhrase.classList.remove("spin-ready");
          heroPhrase.classList.add("spin-in");
          setTimeout(() => heroPhrase.classList.remove("spin-in"), 400);
        });
      });
    }, 350);
  }

  // ---- Frequency (under hero) ----
  function updateFrequency(lang) {
    const perHour = lang.usagePerHour || 0;
    const perDay = Math.round(perHour * 10);
    heroFrequency.innerHTML = `
      <div class="hero-freq">
        <span class="hero-freq__rate">~${perHour} uses/hour</span>
        <span class="hero-freq__detail">~${perDay} uses per day</span>
      </div>
      <div class="hero-freq__note">${lang.commonalityNote}</div>
    `;
  }

  // ---- World Map ----
  function updateWorldMap(lang) {
    const paths = worldMapContainer.querySelectorAll("svg path");
    paths.forEach((p) => p.classList.remove("highlighted"));
    if (lang.countries && lang.countries.length) {
      lang.countries.forEach((code) => {
        const el = worldMapContainer.querySelector(`#${code}`);
        if (el) el.classList.add("highlighted");
      });
    }
  }

  // ---- Info Panel ----
  function updateInfoPanel(lang) {
    infoGrid.innerHTML = `
      <div class="info-item">
        <span class="info-item__label">Language Family</span>
        <span class="info-item__value">${lang.family}</span>
      </div>
      <div class="info-item">
        <span class="info-item__label">Branch</span>
        <span class="info-item__value">${lang.branch}</span>
      </div>
      <div class="info-item">
        <span class="info-item__label">Native Speakers</span>
        <span class="info-item__value">${formatNumber(lang.speakers)}</span>
      </div>
      <div class="info-item">
        <span class="info-item__label">Script</span>
        <span class="info-item__value">${lang.script}</span>
      </div>
      <div class="info-item">
        <span class="info-item__label">Direction</span>
        <span class="info-item__value">${lang.scriptDirection === "rtl" ? "Right to Left" : "Left to Right"}</span>
      </div>
      <div class="info-item">
        <span class="info-item__label">BCP 47 Tag</span>
        <span class="info-item__value">${lang.audioLang || "N/A"}</span>
      </div>
    `;
    infoNoteText.textContent = lang.elseNote;
  }

  // ---- Universal Phrases ----
  function updateUniversalPhrases(lang) {
    universalPhrasesLangName.textContent = lang.name;
    const translations = lang.universalPhraseTranslations;
    const dir = lang.scriptDirection === "rtl" ? ' dir="rtl"' : "";

    // "Who else?" as first row (highlighted)
    let rows = `
      <div class="phrase-row phrase-row--active">
        <span class="phrase-row__english">Who else?</span>
        <span class="phrase-row__translation"${dir}>${lang.phrase}</span>
      </div>
    `;

    // Other universal phrases
    rows += universalPhrases
      .map((phrase) => {
        const translation = translations ? translations[phrase.id] : "\u2014";
        return `
        <div class="phrase-row">
          <span class="phrase-row__english">${phrase.english}</span>
          <span class="phrase-row__translation"${dir}>${translation}</span>
        </div>
      `;
      })
      .join("");

    universalPhrasesGrid.innerHTML = rows;
  }

  // ---- Counter Animation ----
  function animateCounter() {
    const target = totalSpeakers;
    const duration = 2000;
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      counterNumber.textContent = formatNumber(current);
      if (progress < 1) requestAnimationFrame(tick);
    }

    counterLabel.textContent = `across ${totalLanguages} languages represented`;
    requestAnimationFrame(tick);
  }

  // ---- Audio ----
  function speak(lang) {
    if (!lang.audioLang || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(lang.phrase);
    utter.lang = lang.audioLang;
    utter.rate = 0.85;
    window.speechSynthesis.speak(utter);
  }

  // ---- Randomize ----
  function randomize() {
    let next;
    do {
      next = languages[Math.floor(Math.random() * languages.length)];
    } while (next.code === currentLang.code && languages.length > 1);
    selectLanguage(next);
  }

  // ---- Tour Mode ----
  function toggleTour() {
    if (isTourActive) {
      stopTour();
    } else {
      startTour();
    }
  }

  function startTour() {
    isTourActive = true;
    tourBanner.classList.add("active");
    tourInterval = setInterval(randomize, 3000);
  }

  function stopTour() {
    isTourActive = false;
    tourBanner.classList.remove("active");
    clearInterval(tourInterval);
    tourInterval = null;
  }

  // ---- Copy ----
  function copyPhrase() {
    const text = currentLang.phrase;
    navigator.clipboard.writeText(text).then(() => {
      showToast("Copied to clipboard!");
    }).catch(() => {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      showToast("Copied to clipboard!");
    });
  }

  // ---- Share Card ----
  function generateShareCard() {
    const canvas = shareCanvas;
    const ctx = canvas.getContext("2d");
    const w = 1080;
    const h = 1080;
    canvas.width = w;
    canvas.height = h;

    // Background
    ctx.fillStyle = "#0D1B2A";
    ctx.fillRect(0, 0, w, h);

    // Subtle border
    ctx.strokeStyle = "rgba(201, 168, 76, 0.3)";
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, w - 80, h - 80);

    // Corner accents
    const accent = 60;
    ctx.strokeStyle = "#C9A84C";
    ctx.lineWidth = 3;
    [
      [40, 40, accent, 0, 0, accent],
      [w - 40, 40, -accent, 0, 0, accent],
      [40, h - 40, accent, 0, 0, -accent],
      [w - 40, h - 40, -accent, 0, 0, -accent],
    ].forEach(([x, y, dx1, dy1, dx2, dy2]) => {
      ctx.beginPath();
      ctx.moveTo(x + dx1, y + dy1);
      ctx.lineTo(x, y);
      ctx.lineTo(x + dx2, y + dy2);
      ctx.stroke();
    });

    // Title
    ctx.fillStyle = "#C9A84C";
    ctx.font = '500 28px "Outfit", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("WHO ELSE?", w / 2, 140);

    // Language name
    ctx.fillStyle = "rgba(245, 236, 215, 0.6)";
    ctx.font = '400 22px "Outfit", sans-serif';
    ctx.fillText(currentLang.name + " — " + currentLang.nativeName, w / 2, 190);

    // Phrase
    ctx.fillStyle = "#F5ECD7";
    const phraseSize = currentLang.phrase.length > 30 ? 64 : 80;
    ctx.font = `700 ${phraseSize}px "Cormorant Garamond", serif`;
    ctx.textAlign = "center";
    // Handle long phrases with wrapping
    wrapText(ctx, currentLang.phrase, w / 2, h / 2 - 30, w - 160, phraseSize * 1.3);

    // Romanization
    if (currentLang.romanization) {
      ctx.fillStyle = "rgba(245, 236, 215, 0.5)";
      ctx.font = 'italic 32px "Cormorant Garamond", serif';
      ctx.fillText(currentLang.romanization, w / 2, h / 2 + 80);
    }

    // Literal gloss
    ctx.fillStyle = "rgba(201, 168, 76, 0.6)";
    ctx.font = 'italic 24px "Outfit", sans-serif';
    ctx.fillText("Literally: " + currentLang.literalGloss, w / 2, h - 200);

    // Family
    ctx.fillStyle = "rgba(245, 236, 215, 0.35)";
    ctx.font = '400 20px "Outfit", sans-serif';
    ctx.fillText(
      currentLang.family + " · " + formatNumber(currentLang.speakers) + " speakers",
      w / 2,
      h - 150
    );

    // Footer
    ctx.fillStyle = "rgba(201, 168, 76, 0.4)";
    ctx.font = '500 18px "Outfit", sans-serif';
    ctx.fillText('Based on "Who Else?" as Universal Grammar', w / 2, h - 80);

    // Show modal
    shareModal.classList.add("active");
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(" ");
    let line = "";
    const lines = [];

    for (const word of words) {
      const testLine = line + (line ? " " : "") + word;
      if (ctx.measureText(testLine).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    const startY = y - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((l, i) => {
      ctx.fillText(l, x, startY + i * lineHeight);
    });
  }

  function downloadShareCard() {
    const link = document.createElement("a");
    link.download = `who-else-${currentLang.code}.png`;
    link.href = shareCanvas.toDataURL("image/png");
    link.click();
  }

  // ---- Helpers ----
  function formatNumber(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
    if (n >= 1e6) return (n / 1e6).toFixed(0) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(0) + "K";
    return n.toLocaleString();
  }

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2000);
  }

  // ---- Event Binding ----
  function bindEvents() {
    // Search
    searchInput.addEventListener("input", (e) => {
      renderSidebar(e.target.value);
    });

    // Audio
    heroAudioBtn.addEventListener("click", () => speak(currentLang));

    // Randomize
    $("#btn-random").addEventListener("click", randomize);

    // Tour
    $("#btn-tour").addEventListener("click", toggleTour);
    $(".tour-banner button").addEventListener("click", stopTour);

    // Copy
    $("#btn-copy").addEventListener("click", copyPhrase);

    // Share
    $("#btn-share").addEventListener("click", generateShareCard);

    // Share modal close
    $(".share-modal").addEventListener("click", (e) => {
      if (e.target === shareModal) shareModal.classList.remove("active");
    });
    $("#share-close").addEventListener("click", () => shareModal.classList.remove("active"));
    $("#share-download").addEventListener("click", downloadShareCard);
    $("#share-copy").addEventListener("click", () => {
      shareCanvas.toBlob((blob) => {
        if (blob && navigator.clipboard && navigator.clipboard.write) {
          navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]).then(() => {
            showToast("Image copied!");
          });
        } else {
          downloadShareCard();
          showToast("Downloaded instead (clipboard unavailable)");
        }
      });
    });

    // Mobile menu
    $(".mobile-menu-btn").addEventListener("click", () => {
      $(".sidebar").classList.toggle("mobile-open");
    });

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT") return;
      if (e.key === "r" || e.key === "R") randomize();
      if (e.key === "t" || e.key === "T") toggleTour();
      if (e.key === "Escape") {
        if (isTourActive) stopTour();
        shareModal.classList.remove("active");
        $(".sidebar").classList.remove("mobile-open");
      }
    });
  }

  // ---- Boot ----
  document.addEventListener("DOMContentLoaded", init);
})();
