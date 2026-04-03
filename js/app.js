/* ==============================================================
   DOM REFERENCES
============================================================== */
const grid          = document.getElementById("familyGrid");
const backdrop      = document.getElementById("modalBackdrop");
const modalClose    = document.getElementById("modalClose");
const modalName     = document.getElementById("modalName");
const modalRelation = document.getElementById("modalRelation");
const modalDesc     = document.getElementById("modalDescription");

/* ==============================================================
   YOUTUBE IFRAME API — טעינה דינמית
============================================================== */
let ytPlayer  = null;
let ytReady   = false;
let pendingId = null; // אם לחצו לפני שה-API סיים לטעון

// טוען את ה-API של יוטיוב
(function loadYTApi() {
  const s = document.createElement("script");
  s.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(s);
})();

// הפונקציה שיוטיוב קורא לה כשה-API מוכן
window.onYouTubeIframeAPIReady = function () {
  ytPlayer = new YT.Player("ytPlayer", {
    width:  "100%",
    height: "100%",
    playerVars: {
      autoplay:       1,
      rel:            0,    // סרטונים קשורים רק מאותו ערוץ
      cc_load_policy: 1,    // כפה הצגת כתוביות
      cc_lang_pref:   "iw", // העדף כתוביות בעברית
      hl:             "iw", // ממשק בעברית
      modestbranding: 1,    // הסתר לוגו יוטיוב בפלייר
    },
    events: {
      onReady: function () {
        ytReady = true;
        // אם כבר ביקשו לפתוח סרטון לפני שה-API היה מוכן
        if (pendingId) {
          loadVideo(pendingId);
          pendingId = null;
        }
      },
      onStateChange: function (event) {
        // כשהסרטון מסתיים — סגור את המודאל אוטומטית
        if (event.data === YT.PlayerState.ENDED) {
          closeModal();
        }
      }
    }
  });
};

function loadVideo(videoId) {
  ytPlayer.loadVideoById({ videoId: videoId, suggestedQuality: "hd720" });
  // נסה לכפות 720p גם אחרי הטעינה
  setTimeout(() => {
    try { ytPlayer.setPlaybackQuality("hd720"); } catch (e) {}
  }, 1500);
}

/* ==============================================================
   BUILD GRID CARDS
============================================================== */
familyData.forEach(person => {
  const card = document.createElement("div");
  card.className = "card";
  card.setAttribute("tabindex", "0");
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `${person.name} — ${person.relation}`);

  const imgEl = document.createElement("img");
  imgEl.alt = person.name;
  imgEl.src = person.imagePath;
  imgEl.onerror = function () {
    this.replaceWith(createPlaceholder(person.relation));
  };

  const overlay = document.createElement("div");
  overlay.className = "overlay";
  overlay.innerHTML = `
    <span class="name">${person.name}</span>
    <span class="relation">${person.relation}</span>
  `;

  // מספרים רנדומליים לצפיות ולייקים
  const baseViews = Math.floor(Math.random() * 451) + 50;   // 50–500
  const baseLikes = Math.floor(Math.random() * 91)  + 10;   // 10–100
  let likes    = baseLikes;
  let liked    = false;

  const stats = document.createElement("div");
  stats.className = "card-stats";
  stats.innerHTML = `
    <span class="stat views">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
      <span class="views-count">${baseViews}</span>
    </span>
    <span class="stat likes" role="button" tabindex="0" aria-label="לייק">
      <svg class="heart-icon" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
      <span class="likes-count">${likes}</span>
    </span>
  `;

  // לחיצה על לב — toggle like
  const likeBtn = stats.querySelector(".likes");
  const likeCount = stats.querySelector(".likes-count");
  const heartIcon = stats.querySelector(".heart-icon");

  likeBtn.addEventListener("click", e => {
    e.stopPropagation(); // לא לפתוח את המודאל
    liked = !liked;
    likes = liked ? baseLikes + 1 : baseLikes;
    likeCount.textContent = likes;
    heartIcon.classList.toggle("liked", liked);

    // אנימציית פעימה
    heartIcon.classList.add("pulse");
    setTimeout(() => heartIcon.classList.remove("pulse"), 350);
  });

  likeBtn.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") likeBtn.click();
  });

  card.appendChild(imgEl);
  card.appendChild(overlay);
  card.appendChild(stats);

  card.addEventListener("click", () => openModal(person));
  card.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") openModal(person);
  });

  grid.appendChild(card);
});

/* ==============================================================
   PLACEHOLDER (when image file is missing)
============================================================== */
function createPlaceholder(relation) {
  const emojiMap = {
    "סבא": "👴", "סבתא": "👵", "דוד": "👨", "דודה": "👩",
    "אבא": "👨‍👦", "אמא": "👩‍👧", "סבא רבא": "🧓", "סבתא רבתא": "👵", "אח": "👦"
  };
  const div = document.createElement("div");
  div.className = "img-placeholder";
  div.textContent = emojiMap[relation] || "🧑";
  return div;
}

/* ==============================================================
   MODAL — OPEN
============================================================== */
function openModal(person) {
  modalName.textContent     = person.name;
  modalRelation.textContent = person.relation;
  modalDesc.textContent     = person.description;

  backdrop.classList.add("open");
  document.body.style.overflow = "hidden";

  if (ytReady) {
    loadVideo(person.youtubeId);
  } else {
    pendingId = person.youtubeId; // ה-API עוד לא מוכן — שמור לטעינה עתידית
  }

  modalClose.focus();
}

/* ==============================================================
   MODAL — CLOSE
============================================================== */
function closeModal() {
  backdrop.classList.remove("open");
  document.body.style.overflow = "";
  try { if (ytPlayer) ytPlayer.stopVideo(); } catch (e) {}
}

modalClose.addEventListener("click", closeModal);

backdrop.addEventListener("click", e => {
  if (e.target === backdrop) closeModal();
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape" && backdrop.classList.contains("open")) closeModal();
});
