/* ═══════════════════════════════════════════
   THE URGE-TO-TEXT SOS CARD DECK
   Optimized Script v2.0
   ═══════════════════════════════════════════ */

(function() {
  'use strict';

  var STORAGE_KEY = 'enr_sos_deck_v2';
  var TOTAL_CARDS = 10;
  var MAX_FAVORITES = 3;
  var currentCard = 1;
  var favorites = [];
  var urgeTrackerCounts = {};
  var activeUrge = null;

  /* ── CARD NAVIGATION ── */
  function goToCard(n) {
    if (n < 1 || n > TOTAL_CARDS) return;
    currentCard = n;
    updateCardDisplay();
    saveData();
  }
  window.goToCard = goToCard;

  function nextCard() {
    if (currentCard < TOTAL_CARDS) goToCard(currentCard + 1);
  }
  window.nextCard = nextCard;

  function prevCard() {
    if (currentCard > 1) goToCard(currentCard - 1);
  }
  window.prevCard = prevCard;

  function updateCardDisplay() {
    for (var i = 1; i <= TOTAL_CARDS; i++) {
      var card = document.getElementById('card-' + i);
      if (card) card.classList.toggle('active', i === currentCard);
    }
    updateDots();
    updateControls();
    updateTrackerDisplay();
    updateSaveBtnState();
    var counter = document.getElementById('cardCounter');
    if (counter) counter.textContent = currentCard + ' / ' + TOTAL_CARDS;
  }

  function updateDots() {
    var dots = document.querySelectorAll('.dot');
    dots.forEach(function(d, i) {
      d.classList.remove('active', 'done');
      if (i + 1 === currentCard) d.classList.add('active');
      else if (favorites.indexOf(i + 1) > -1) d.classList.add('done');
    });
  }

  function updateControls() {
    var prev = document.getElementById('prevCardBtn');
    var next = document.getElementById('nextCardBtn');
    if (prev) prev.disabled = currentCard <= 1;
    if (next) next.disabled = currentCard >= TOTAL_CARDS;
  }

  /* ── URGE SELECTOR ── */
  function selectUrge(pill) {
    var pills = document.querySelectorAll('.urge-pill');
    pills.forEach(function(p) { p.classList.remove('active'); });
    pill.classList.add('active');
    activeUrge = pill.getAttribute('data-urge');
    filterByUrge(activeUrge);
    saveData();
  }
  window.selectUrge = selectUrge;

  function filterByUrge(urge) {
    // Find first card matching the urge
    for (var i = 1; i <= TOTAL_CARDS; i++) {
      var card = document.getElementById('card-' + i);
      if (card && card.getAttribute('data-urge-type') === urge) {
        goToCard(i);
        return;
      }
    }
  }

  /* ── URGE TRACKER ── */
  function trackUrge() {
    if (!urgeTrackerCounts[currentCard]) {
      urgeTrackerCounts[currentCard] = 0;
    }
    urgeTrackerCounts[currentCard]++;
    updateTrackerDisplay();
    showTrackerFeedback();
    saveData();
  }
  window.trackUrge = trackUrge;

  function updateTrackerDisplay() {
    var countEl = document.getElementById('trackerCount');
    var count = urgeTrackerCounts[currentCard] || 0;
    if (countEl) countEl.textContent = count;
    var totalEl = document.getElementById('trackerTotal');
    if (totalEl) {
      var total = 0;
      for (var key in urgeTrackerCounts) {
        total += urgeTrackerCounts[key];
      }
      totalEl.textContent = total;
    }
  }

  function showTrackerFeedback() {
    var btn = document.getElementById('trackerBtn');
    if (!btn) return;
    var original = btn.textContent;
    btn.textContent = 'Logged';
    btn.style.background = 'var(--sage)';
    btn.style.borderColor = 'var(--sage)';
    btn.style.color = '#fff';
    setTimeout(function() {
      btn.textContent = original;
      btn.style.background = '';
      btn.style.borderColor = '';
      btn.style.color = '';
    }, 1200);
  }

  /* ── FAVORITES ── */
  function toggleFavorite() {
    var idx = favorites.indexOf(currentCard);
    if (idx > -1) {
      favorites.splice(idx, 1);
    } else {
      if (favorites.length >= MAX_FAVORITES) {
        shakeButton();
        return;
      }
      favorites.push(currentCard);
    }
    updateFavoritesDisplay();
    updateSaveBtnState();
    updateDots();
    saveData();
  }
  window.toggleFavorite = toggleFavorite;

  function removeFavorite(cardNum) {
    var idx = favorites.indexOf(cardNum);
    if (idx > -1) {
      favorites.splice(idx, 1);
      updateFavoritesDisplay();
      updateSaveBtnState();
      updateDots();
      saveData();
    }
  }
  window.removeFavorite = removeFavorite;

  function updateFavoritesDisplay() {
    var list = document.getElementById('favoritesList');
    if (!list) return;

    if (favorites.length === 0) {
      list.innerHTML = '<div class="favorites-empty">Tap the heart on any card to save it here.</div>';
      return;
    }

    var html = '';
    favorites.forEach(function(cardNum, i) {
      var card = document.getElementById('card-' + cardNum);
      var urge = card ? card.querySelector('.card-urge') : null;
      var urgeText = urge ? urge.textContent : 'Card ' + cardNum;
      // Truncate long text
      if (urgeText.length > 40) urgeText = urgeText.substring(0, 40) + '...';
      html += '<div class="favorite-item">' +
        '<span class="favorite-num">#' + (i + 1) + '</span>' +
        '<span class="favorite-text" onclick="goToCard(' + cardNum + ')" style="cursor:pointer;">' + urgeText + '</span>' +
        '<button class="favorite-remove" onclick="removeFavorite(' + cardNum + ')" aria-label="Remove from favorites">&times;</button>' +
        '</div>';
    });
    list.innerHTML = html;
  }

  function updateSaveBtnState() {
    var btn = document.getElementById('saveFavBtn');
    if (!btn) return;
    var isSaved = favorites.indexOf(currentCard) > -1;
    btn.classList.toggle('saved', isSaved);
    btn.innerHTML = isSaved ? '&#9829; Saved' : '&#9825; Save to My Top 3';
  }

  function shakeButton() {
    var btn = document.getElementById('saveFavBtn');
    if (!btn) return;
    btn.style.animation = 'none';
    btn.offsetHeight; // trigger reflow
    btn.style.animation = 'shake 0.4s ease';
    var original = btn.innerHTML;
    btn.innerHTML = 'Max 3 saved';
    setTimeout(function() {
      btn.innerHTML = original;
      btn.style.animation = '';
    }, 1200);
  }

  /* ── TOUCH / SWIPE ── */
  var startX = 0;
  var startY = 0;
  var phoneShell = null;

  function initSwipe() {
    phoneShell = document.querySelector('.phone-shell');
    if (!phoneShell) return;

    phoneShell.addEventListener('touchstart', function(e) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });

    phoneShell.addEventListener('touchend', function(e) {
      var endX = e.changedTouches[0].clientX;
      var endY = e.changedTouches[0].clientY;
      var diffX = endX - startX;
      var diffY = endY - startY;
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        if (diffX < 0) nextCard();
        else prevCard();
      }
    }, { passive: true });
  }

  /* ── KEYBOARD NAV ── */
  document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); nextCard(); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); prevCard(); }
  });

  /* ── LOCAL STORAGE ── */
  function saveData() {
    var data = {
      _card: currentCard,
      _favorites: favorites,
      _urgeTrackerCounts: urgeTrackerCounts,
      _activeUrge: activeUrge,
      _timestamp: Date.now()
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) { /* storage full */ }
  }

  function loadData() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      if (data._favorites && Array.isArray(data._favorites)) {
        favorites = data._favorites;
      }
      if (data._urgeTrackerCounts) {
        urgeTrackerCounts = data._urgeTrackerCounts;
      }
      if (data._activeUrge) {
        activeUrge = data._activeUrge;
        var pills = document.querySelectorAll('.urge-pill');
        pills.forEach(function(p) {
          p.classList.toggle('active', p.getAttribute('data-urge') === activeUrge);
        });
      }
      if (data._card && data._card >= 1 && data._card <= TOTAL_CARDS) {
        currentCard = data._card;
      }
      updateCardDisplay();
      updateFavoritesDisplay();
    } catch (e) { /* corrupted */ }
  }

  /* ── SHARE ── */
  function shareCard() {
    var card = document.getElementById('card-' + currentCard);
    if (!card) return;
    var urge = card.querySelector('.card-urge');
    var action = card.querySelector('.card-action');
    var text = '';
    if (urge) text += '"' + urge.textContent.trim() + '"';
    if (action) text += '\n\n' + action.textContent.trim();
    text += '\n\nThe Second Bloom, Susan';

    if (navigator.share) {
      navigator.share({ text: text }).catch(function() {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function() {
        var btn = document.getElementById('shareCardBtn');
        if (btn) {
          var orig = btn.textContent;
          btn.textContent = 'Copied!';
          setTimeout(function() { btn.textContent = orig; }, 1500);
        }
      });
    }
  }
  window.shareCard = shareCard;

  /* ── INIT ── */
  initSwipe();
  loadData();

  // Ensure first card shows if nothing loaded
  if (!localStorage.getItem(STORAGE_KEY)) {
    updateCardDisplay();
    updateFavoritesDisplay();
  }

  // Robust event binding: attach listeners directly as backup to inline onclick
  // This ensures taps register on mobile even if inline handlers fail
  var saveBtnEl = document.getElementById('saveFavBtn');
  if (saveBtnEl) {
    saveBtnEl.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleFavorite();
    });
    // Remove inline handler to prevent double-fire
    saveBtnEl.removeAttribute('onclick');
  }

  var shareBtnEl = document.getElementById('shareCardBtn');
  if (shareBtnEl) {
    shareBtnEl.addEventListener('click', function(e) {
      e.stopPropagation();
      shareCard();
    });
    shareBtnEl.removeAttribute('onclick');
  }
})();
