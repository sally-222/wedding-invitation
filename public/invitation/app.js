(function () {
  const config = window.WEDDING_CONFIG;
  const app = document.querySelector("#app");
  const storageKey = "wedding-wishes-v2";
  const seedRepliesStorageKey = "wedding-seed-replies-v1";
  const wishApiEndpoint = config.blessing?.apiEndpoint || "";
  const wishPageSize = Number(config.blessing?.pageSize || 10);
  const replyPreviewSize = Number(config.blessing?.replyPreviewSize || 2);
  const replyPageSize = Number(config.blessing?.replyPageSize || 100);
  let audioController = null;
  let musicAutoplayAttempted = false;
  let musicAutoResumeBound = false;
  let musicUserPaused = false;
  let remoteWishes = null;
  let remoteWishPagination = { page: 1, pageSize: wishPageSize, total: 0, totalPages: 1 };
  let wishCurrentPage = 1;
  let wishApiStatus = wishApiEndpoint ? "unknown" : "unavailable";
  const expandedReplies = new Set();
  const fullRepliesByWish = {};

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function getStoredWishes() {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function setStoredWishes(wishes) {
    localStorage.setItem(storageKey, JSON.stringify(wishes));
  }

  function getStoredSeedReplies() {
    try {
      const parsed = JSON.parse(localStorage.getItem(seedRepliesStorageKey) || "{}");
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  function setStoredSeedReplies(replies) {
    localStorage.setItem(seedRepliesStorageKey, JSON.stringify(replies));
  }

  function allWishes() {
    if (Array.isArray(remoteWishes)) return remoteWishes;
    if (wishApiEndpoint) return [];
    const storedSeedReplies = getStoredSeedReplies();
    const seeds = config.blessingSeed.map((wish) => ({
      ...wish,
      replies: [...(wish.replies || []), ...(storedSeedReplies[wish.id] || [])],
    }));
    return [...getStoredWishes(), ...seeds];
  }

  async function postJson(url, payload) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || "请求暂时无法完成");
      error.status = response.status;
      throw error;
    }
    return data;
  }

  function buildApiUrl(url, params) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
    });
    const separator = url.includes("?") ? "&" : "?";
    return query.toString() ? `${url}${separator}${query.toString()}` : url;
  }

  function pageHeader(index, english, title, copy) {
    const formattedCopy = copy ? escapeHtml(copy).replace(/\n/g, "<br />") : "";
    return `
      <header class="page-head">
        <div class="page-head__topline">
          <span class="page-head__index">${escapeHtml(index)}</span>
          <span class="page-head__index">${escapeHtml(english)}</span>
        </div>
        <h1 class="page-head__title">${escapeHtml(title)}</h1>
        ${formattedCopy ? `<p class="page-head__copy">${formattedCopy}</p>` : ""}
      </header>
    `;
  }

  function renderCredits() {
    if (!Array.isArray(config.assetCredits) || !config.assetCredits.length) return "";
    return `
      <div class="credits" aria-label="临时图片来源">
        ${config.assetCredits
          .map(
            (item) =>
              `<a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">${escapeHtml(item.label)}</a>`,
          )
          .join("")}
      </div>
    `;
  }

  function getTravelModel() {
    const travelData = window.WEDDING_TRAVEL_DATA || {};
    const sourceSpots = Array.isArray(travelData.spots) && travelData.spots.length
      ? travelData.spots
      : config.travelSpots || [];
    const spots = sourceSpots
      .map((spot, index) => ({ ...spot, sort: Number(spot.sort || index + 1) }))
      .sort((a, b) => a.sort - b.sort);
    const configuredCategories = Array.isArray(travelData.categories)
      ? travelData.categories.map((item) => (typeof item === "string" ? item : item.name)).filter(Boolean)
      : [];
    const spotCategories = spots.map((spot) => spot.category).filter(Boolean);
    const categories = Array.from(new Set([...configuredCategories, ...spotCategories]));
    return { categories, spots };
  }

  function renderHome() {
    const { couple } = config;
    const dateParts = couple.date.split(".");
    const day = dateParts[2] || "06";
    const year = dateParts[0] || "2026";
    const month = dateParts[1] === "10" ? "OCT" : dateParts[1] || "OCT";
    const schedule = config.schedule
      .map(
        (item) => `
          <li class="timeline__item">
            <time class="timeline__time">${escapeHtml(item.time)}</time>
            <div>
              <p class="timeline__title">${escapeHtml(item.title)}</p>
              <p class="timeline__detail">${escapeHtml(item.detail)}</p>
            </div>
          </li>
        `,
      )
      .join("");

    return `
      <section id="invitation" class="view is-active" data-view>
        <article class="cover">
          <header class="cover__masthead">
            <span>Wedding invitation · Puyang</span>
            <button class="cover__music" id="musicButton" type="button" aria-label="${escapeHtml(config.music.title)}" title="${escapeHtml(config.music.title)}">
              <span class="cover__music-mark" aria-hidden="true">♪</span>
            </button>
          </header>

          <div class="cover__image-wrap">
            <img class="cover__image" src="${escapeHtml(couple.heroImage)}" alt="李辰海与沙雷雨馨的婚纱照" />
            <p class="cover__image-caption">${escapeHtml(couple.invitationLine)}</p>
            <div class="cover__title">
              <h1 class="cover__names">
                <span>${escapeHtml(couple.groom)}</span>
                <span class="cover__amp">&amp;</span>
                <span>${escapeHtml(couple.bride)}</span>
              </h1>
              <div class="cover__date">
                <strong>${escapeHtml(day.padStart(2, "0"))}</strong>
                <span>${escapeHtml(month)}</span>
                <span>${escapeHtml(year)}</span>
              </div>
            </div>
          </div>

        </article>

        <section class="home-details">
          <div class="home-details__intro">
            <div class="home-details__monogram" aria-hidden="true">L · S</div>
            <div>
              <p class="home-details__eyebrow">Save the date</p>
              <p class="home-details__lead">秋日相见，<br />与我们一起见证<br />这一天。</p>
            </div>
          </div>

          <div class="event-meta">
            <div class="event-meta__row">
              <span class="meta-label">Date</span>
              <p class="meta-value">${escapeHtml(couple.date)} · 星期二 · ${escapeHtml(couple.lunarDate)}</p>
            </div>
            <div class="event-meta__row">
              <span class="meta-label">Venue</span>
              <p class="meta-value">${escapeHtml(couple.venue)}<br />${escapeHtml(couple.address)}</p>
            </div>
            <div class="event-meta__row">
              <span class="meta-label">Dress</span>
              <div class="dress-code">
                <div class="swatches" aria-hidden="true">
                  <span class="swatch"></span>
                  <span class="swatch"></span>
                  <span class="swatch"></span>
                  <span class="swatch"></span>
                </div>
                <p class="meta-value">${escapeHtml(couple.dressCode)}</p>
              </div>
            </div>
          </div>
        </section>

        <section class="schedule-block">
          <div class="block-title">
            <h2>婚礼流程</h2>
            <span class="block-title__en">Order of the day</span>
          </div>
          <ol class="timeline">${schedule}</ol>
          <div class="countdown">
            <span id="countdownText">正在计算婚礼倒计时</span>
            <strong class="countdown__days" id="countdownDays">--</strong>
          </div>
          <div class="action-row">
            <a class="button" href="${escapeHtml(config.map.url)}" target="_blank" rel="noreferrer">
              <span class="button__icon" aria-hidden="true">⌖</span>
              ${escapeHtml(config.map.label)}
            </a>
            <button class="button button--quiet" id="phoneButton" type="button">
              <span class="button__icon" aria-hidden="true">☎</span>
              联系新人
            </button>
          </div>
        </section>
      </section>
    `;
  }

  function renderTravel() {
    const { categories, spots } = getTravelModel();
    const filters = [
      `<button class="travel-filter__item is-active" type="button" data-travel-filter="all" aria-pressed="true">全部</button>`,
      ...categories.map(
        (category) =>
          `<button class="travel-filter__item" type="button" data-travel-filter="${escapeHtml(category)}" aria-pressed="false">${escapeHtml(category)}</button>`,
      ),
    ].join("");
    const cards = spots
      .map((spot, index) => {
        const image = spot.image
          ? `<div class="travel-card__image"><img src="${escapeHtml(spot.image)}" alt="${escapeHtml(spot.name)}" loading="lazy" /></div>`
          : `<div class="travel-card__image is-placeholder" data-mark="${escapeHtml(spot.name.slice(0, 1))}" style="background:${escapeHtml(spot.color)}" aria-hidden="true"></div>`;
        const url = spot.dianpingUrl || spot.link || "";
        const cardBody = `
          ${image}
          <div class="travel-card__body">
            <span class="travel-card__category">${String(index + 1).padStart(2, "0")} · ${escapeHtml(spot.category)}</span>
            <h2 class="travel-card__name">${escapeHtml(spot.name)}</h2>
            <p class="travel-card__desc">${escapeHtml(spot.description)}</p>
            <span class="travel-card__link">${url ? "大众点评 ↗" : "链接待补充"}</span>
          </div>
        `;
        if (!url) {
          return `<article class="travel-card is-disabled" data-travel-card data-category="${escapeHtml(spot.category)}">${cardBody}</article>`;
        }
        return `
          <a class="travel-card" href="${escapeHtml(url)}" target="_blank" rel="noreferrer" data-travel-card data-category="${escapeHtml(spot.category)}">${cardBody}</a>
        `;
      })
      .join("");

    return `
      <section id="travel" class="view" data-view>
        <div class="page page--tinted page--travel">
          ${pageHeader("02 / 05", "Local taste", "赴宴闲游", "婚礼之外，也留一点时间给濮阳。\n我们挑了几处想分享给您的濮阳味道，愿您来时欢喜，归时有念。")}
          <div class="travel-filter" aria-label="闲游分类">${filters}</div>
          <div class="travel-grid">${cards}</div>
          <p class="travel-empty" id="travelEmpty" hidden>这个分类暂时还没有内容。</p>
        </div>
      </section>
    `;
  }

  function renderPhotos() {
    const album = window.WEDDING_PHOTO_ALBUM || {};
    const cover = album.cover || { src: "", alt: "婚礼相册" };
    const pages = Array.isArray(album.pages) ? album.pages.filter((page) => page && page.src) : [];
    const leftPage = pages[0] || { src: "", alt: "婚礼相册第 1 页" };
    const rightPage = pages[1] || { src: "", alt: "婚礼相册第 2 页" };

    return `
      <section id="photos" class="view" data-view>
        <div class="page page--album page--photos">
          ${pageHeader("03 / 05", "Our album", "照片墙", "有些日子值得被收藏，\n有些瞬间值得被重新翻阅。")}
          <div class="photo-album" id="photoAlbum" aria-label="${escapeHtml(album.title || "我们的婚礼相册")}">
            <div class="photo-album__book" id="photoAlbumBook">
              <div class="photo-album__cover" id="photoAlbumCover" role="button" tabindex="0" aria-label="打开婚礼相册">
                <span class="photo-album__cover-spine" aria-hidden="true"></span>
                <img src="${escapeHtml(cover.src)}" alt="${escapeHtml(cover.alt)}" draggable="false" />
                <span class="photo-album__cover-sheen" aria-hidden="true"></span>
              </div>
              <div class="photo-album__spread" id="photoAlbumSpread" aria-hidden="true">
                <span class="photo-album__spread-edges" aria-hidden="true"></span>
                <span class="photo-album__spread-spine" aria-hidden="true"></span>
                <div class="album-spread album-spread--under" aria-hidden="true">
                  <div class="album-spread__page album-spread__page--left">
                    <img id="photoAlbumUnderLeft" src="${escapeHtml(leftPage.src)}" alt="" draggable="false" />
                  </div>
                  <div class="album-spread__page album-spread__page--right">
                    <img id="photoAlbumUnderRight" src="${escapeHtml(rightPage.src)}" alt="" draggable="false" />
                  </div>
                </div>
                <div class="album-spread album-spread--current">
                  <button class="album-spread__page album-spread__page--left" id="photoAlbumLeftPage" type="button" aria-label="放大查看相册第 1 页" tabindex="-1">
                    <img id="photoAlbumLeftImage" src="${escapeHtml(leftPage.src)}" alt="${escapeHtml(leftPage.alt)}" draggable="false" />
                  </button>
                  <button class="album-spread__page album-spread__page--right" id="photoAlbumRightPage" type="button" aria-label="放大查看相册第 2 页" tabindex="-1">
                    <img id="photoAlbumRightImage" src="${escapeHtml(rightPage.src)}" alt="${escapeHtml(rightPage.alt)}" draggable="false" />
                  </button>
                </div>
                <div class="album-turning-sheet" id="photoAlbumTurningSheet" hidden aria-hidden="true">
                  <div class="album-turning-sheet__face album-turning-sheet__face--front">
                    <img id="photoAlbumTurningFront" src="" alt="" draggable="false" />
                  </div>
                  <div class="album-turning-sheet__face album-turning-sheet__face--back">
                    <img id="photoAlbumTurningBack" src="" alt="" draggable="false" />
                  </div>
                </div>
                <button class="album-turn-zone album-turn-zone--previous" id="photoAlbumPreviousEdge" type="button" aria-label="上一页" tabindex="-1" disabled></button>
                <button class="album-turn-zone album-turn-zone--next" id="photoAlbumNextEdge" type="button" aria-label="下一页" tabindex="-1"></button>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function renderWishes() {
    return `
      <section id="wishes" class="view" data-view>
        <div class="page page--tinted page--wishes">
          ${pageHeader("04 / 05", "Guest notes", "留言祝福", "如果有一句话想对我们说，就写在这里吧。\n谢谢您来到这里，也谢谢您见证这一刻。")}
          <form class="panel form-grid" id="wishForm">
            <label class="field-label">
              Name
              <input class="field" name="name" type="text" maxlength="18" placeholder="你的名字" autocomplete="name" />
            </label>
            <label class="switch-line">
              <input name="anonymous" type="checkbox" />
              匿名留言
            </label>
            <label class="field-label">
              Message
              <textarea class="textarea" name="text" maxlength="160" placeholder="写下你的祝福"></textarea>
            </label>
            <button class="button button--wide" type="submit">发布祝福</button>
            <p class="helper-text">选择匿名后，姓名不会随留言公开。</p>
          </form>
          <div class="wish-list" id="wishList"></div>
        </div>
      </section>
    `;
  }

  function renderSeats() {
    const codeLength = config.seatLookup.invitationCodeLength;
    return `
      <section id="seats" class="view" data-view>
        <div class="page page--tinted page--seats">
          ${pageHeader("05 / 05", "Seat finder", "座位查询", "")}
          <div class="seat-stage">
            <p class="seat-stage__label">Find your table</p>
            <h2 class="seat-stage__title">欢迎赴宴，<br />请在这里找到<br />属于您的席位。</h2>
          </div>
          <form class="panel form-grid" id="seatForm">
            <label class="field-label">
              Guest name
              <input class="field" name="guestName" type="text" maxlength="18" placeholder="宾客姓名" autocomplete="name" />
            </label>
            <label class="field-label">
              Invitation code
              <input class="field invite-code-field" name="invitationCode" type="text" inputmode="numeric" maxlength="${escapeHtml(codeLength)}" placeholder="${escapeHtml(codeLength)}位专属邀请码" autocomplete="one-time-code" />
            </label>
            <button class="button button--wide" type="submit">查看我的席位</button>
            <p class="helper-text">${escapeHtml(config.seatLookup.helpText)}</p>
            <button class="seat-help" id="seatHelpButton" type="button">没有找到邀请码？联系新人</button>
          </form>
          <div id="seatResult" aria-live="polite"></div>
        </div>
      </section>
    `;
  }

  function renderLightbox() {
    return `
      <div class="lightbox" id="lightbox" hidden>
        <button class="lightbox__close" id="lightboxClose" type="button" aria-label="关闭图片">×</button>
        <img class="lightbox__image" id="lightboxImage" src="" alt="" />
      </div>
    `;
  }

  function renderContactDialog() {
    const contacts = [
      { role: "新郎", name: config.couple.groom, phone: config.contacts.groomPhone },
      { role: "新娘", name: config.couple.bride, phone: config.contacts.bridePhone },
    ].filter((contact) => contact.phone);

    return `
      <dialog class="contact-dialog" id="contactDialog" aria-labelledby="contactDialogTitle">
        <div class="contact-dialog__head">
          <div>
            <p class="contact-dialog__eyebrow">Contact</p>
            <h2 id="contactDialogTitle">联系新人</h2>
          </div>
          <button class="contact-dialog__close" id="contactDialogClose" type="button" aria-label="关闭">×</button>
        </div>
        <div class="contact-dialog__list">
          ${contacts
            .map(
              (contact) => `
                <a class="contact-dialog__item" href="tel:${escapeHtml(contact.phone)}">
                  <span>
                    <small>${escapeHtml(contact.role)}</small>
                    <strong>${escapeHtml(contact.name)}</strong>
                  </span>
                  <span class="contact-dialog__phone">${escapeHtml(contact.phone)}</span>
                  <span class="contact-dialog__call" aria-hidden="true">☎</span>
                </a>
              `,
            )
            .join("")}
        </div>
      </dialog>
    `;
  }

  function render() {
    app.innerHTML = [
      renderHome(),
      renderTravel(),
      renderPhotos(),
      renderWishes(),
      renderSeats(),
      renderLightbox(),
      renderContactDialog(),
    ].join("");
    bindNavigation();
    bindHomeActions();
    bindTravel();
    bindPhotos();
    bindWishes();
    bindSeats();
    updateCountdown();
    window.setInterval(updateCountdown, 60 * 1000);
    attemptAutoplayMusic();
  }

  function bindTravel() {
    const filters = Array.from(document.querySelectorAll("[data-travel-filter]"));
    const cards = Array.from(document.querySelectorAll("[data-travel-card]"));
    const empty = document.querySelector("#travelEmpty");
    filters.forEach((filter) => {
      filter.addEventListener("click", () => {
        const category = filter.dataset.travelFilter;
        let visibleCount = 0;
        filters.forEach((item) => {
          const active = item === filter;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-pressed", String(active));
        });
        cards.forEach((card) => {
          const visible = category === "all" || card.dataset.category === category;
          card.hidden = !visible;
          if (visible) visibleCount += 1;
        });
        if (empty) empty.hidden = visibleCount > 0;
      });
    });
  }

  function bindNavigation() {
    const buttons = Array.from(document.querySelectorAll(".tabbar__item"));
    const views = Array.from(document.querySelectorAll("[data-view]"));

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const target = button.dataset.target;
        buttons.forEach((item) => item.classList.toggle("is-active", item === button));
        buttons.forEach((item) => {
          if (item === button) item.setAttribute("aria-current", "page");
          else item.removeAttribute("aria-current");
        });
        views.forEach((view) => view.classList.toggle("is-active", view.id === target));
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  }

  function bindHomeActions() {
    document.querySelector("#phoneButton").addEventListener("click", contactNewlyweds);
    const contactDialog = document.querySelector("#contactDialog");
    document.querySelector("#contactDialogClose").addEventListener("click", () => contactDialog.close());
    contactDialog.addEventListener("click", (event) => {
      if (event.target === contactDialog) contactDialog.close();
    });

    document.querySelector("#musicButton").addEventListener("click", async () => {
      const isPlaying = await getAudioController().toggle();
      musicUserPaused = !isPlaying;
      syncMusicButton(isPlaying);
      showToast(isPlaying ? "背景音乐已开启" : "背景音乐已暂停");
    });
    syncMusicButton();
  }

  function getAudioController() {
    if (!audioController) audioController = createAudioController();
    return audioController;
  }

  function syncMusicButton(isPlaying = getAudioController().isPlaying()) {
    const button = document.querySelector("#musicButton");
    if (!button) return;
    button.classList.toggle("is-playing", isPlaying);
    button.setAttribute("aria-label", isPlaying ? "暂停背景音乐" : config.music.title);
    button.setAttribute("title", isPlaying ? "暂停背景音乐" : config.music.title);
    const mark = button.querySelector(".cover__music-mark");
    if (mark) mark.textContent = isPlaying ? "Ⅱ" : "♪";
  }

  async function attemptAutoplayMusic() {
    if (musicAutoplayAttempted) return;
    musicAutoplayAttempted = true;
    const isPlaying = await getAudioController().play({ silent: true });
    syncMusicButton(isPlaying);
    if (!isPlaying) bindFirstInteractionMusicResume();
  }

  function bindFirstInteractionMusicResume() {
    if (musicAutoResumeBound) return;
    musicAutoResumeBound = true;
    const events = ["pointerdown", "touchstart", "click", "keydown"];
    const resume = async (event) => {
      if (musicUserPaused || event.target?.closest?.("#musicButton")) return;
      const isPlaying = await getAudioController().play({ silent: true });
      syncMusicButton(isPlaying);
      if (isPlaying) {
        events.forEach((name) => document.removeEventListener(name, resume, true));
        musicAutoResumeBound = false;
      }
    };
    events.forEach((name) => document.addEventListener(name, resume, true));
  }

  function contactNewlyweds() {
    const phones = [config.contacts.groomPhone, config.contacts.bridePhone].filter(Boolean);
    if (!phones.length) {
      showToast(config.contacts.phonePlaceholderText || "电话待补充");
      return;
    }
    const contactDialog = document.querySelector("#contactDialog");
    if (typeof contactDialog.showModal === "function") contactDialog.showModal();
    else contactDialog.setAttribute("open", "");
  }

  function createAudioController() {
    if (config.music.audioUrl) {
      const audio =
        window.__weddingMusicAudio ||
        Object.assign(new Audio(config.music.audioUrl), {
          loop: true,
          preload: "auto",
        });
      window.__weddingMusicAudio = audio;
      audio.src = config.music.audioUrl;
      audio.loop = true;
      audio.preload = "auto";
      audio.playsInline = true;
      audio.volume = Number(config.music.volume || 0.72);
      return {
        async play(options = {}) {
          if (!audio.paused) return true;
          try {
            await audio.play();
            return true;
          } catch {
            if (!options.silent) showToast("音乐暂时无法播放，请确认浏览器允许声音");
            return false;
          }
        },
        pause() {
          audio.pause();
          return false;
        },
        async toggle() {
          return audio.paused ? this.play() : this.pause();
        },
        isPlaying() {
          return !audio.paused;
        },
      };
    }

    let context = null;
    let timer = null;
    let index = 0;
    const notes = [293.66, 369.99, 440, 392, 329.63, 293.66];

    function playNote() {
      if (!context) return;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = notes[index % notes.length];
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.026, context.currentTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 1.5);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 1.55);
      index += 1;
    }

    return {
      async play(options = {}) {
        if (timer) return true;
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) {
          if (!options.silent) showToast("当前浏览器暂不支持内置背景音乐，请在配置中替换为音频文件");
          return false;
        }
        context = context || new AudioContextClass();
        if (context.state === "suspended") await context.resume();
        playNote();
        timer = window.setInterval(playNote, 1900);
        return true;
      },
      pause() {
        if (timer) {
          window.clearInterval(timer);
          timer = null;
        }
        return false;
      },
      async toggle() {
        return timer ? this.pause() : this.play();
      },
      isPlaying() {
        return Boolean(timer);
      },
    };
  }

  function bindPhotos() {
    const album = window.WEDDING_PHOTO_ALBUM || {};
    const pages = Array.isArray(album.pages) ? album.pages.filter((page) => page && page.src) : [];
    const book = document.querySelector("#photoAlbumBook");
    const cover = document.querySelector("#photoAlbumCover");
    const spread = document.querySelector("#photoAlbumSpread");
    const leftPage = document.querySelector("#photoAlbumLeftPage");
    const rightPage = document.querySelector("#photoAlbumRightPage");
    const leftImage = document.querySelector("#photoAlbumLeftImage");
    const rightImage = document.querySelector("#photoAlbumRightImage");
    const underLeft = document.querySelector("#photoAlbumUnderLeft");
    const underRight = document.querySelector("#photoAlbumUnderRight");
    const turningSheet = document.querySelector("#photoAlbumTurningSheet");
    const turningFront = document.querySelector("#photoAlbumTurningFront");
    const turningBack = document.querySelector("#photoAlbumTurningBack");
    const previousEdge = document.querySelector("#photoAlbumPreviousEdge");
    const nextEdge = document.querySelector("#photoAlbumNextEdge");
    const lightbox = document.querySelector("#lightbox");
    const lightboxImage = document.querySelector("#lightboxImage");
    const closeButton = document.querySelector("#lightboxClose");
    const spreadCount = Math.ceil(pages.length / 2);
    let currentSpread = -1;
    let isTurning = false;
    let pointerStart = null;

    function preloadPage(index) {
      if (!pages[index]) return;
      const image = new Image();
      image.src = pages[index].src;
    }

    function getSpread(index) {
      return {
        left: pages[index * 2] || null,
        right: pages[index * 2 + 1] || null,
      };
    }

    function setPage(button, image, page, pageNumber) {
      button.hidden = !page;
      if (!page) {
        image.removeAttribute("src");
        image.alt = "";
        return;
      }
      image.src = page.src;
      image.alt = page.alt || `婚礼相册第 ${pageNumber} 页`;
      button.setAttribute("aria-label", `放大查看相册第 ${pageNumber} 页`);
    }

    function showSpread(index) {
      const current = getSpread(index);
      setPage(leftPage, leftImage, current.left, index * 2 + 1);
      setPage(rightPage, rightImage, current.right, index * 2 + 2);
      previousEdge.disabled = false;
      nextEdge.disabled = index >= spreadCount - 1;
      previousEdge.tabIndex = -1;
      nextEdge.tabIndex = -1;
      leftPage.tabIndex = current.left ? 0 : -1;
      rightPage.tabIndex = current.right ? 0 : -1;
      spread.setAttribute("aria-hidden", "false");
      cover.tabIndex = -1;
      [pages[index * 2 - 2], pages[index * 2 - 1], pages[index * 2 + 2], pages[index * 2 + 3]].forEach(
        (page) => page && preloadPage(pages.indexOf(page)),
      );
    }

    function syncBookHeight() {
      const shell = book.closest(".phone-shell");
      const width = book.clientWidth || book.parentElement?.clientWidth || shell?.clientWidth || Math.min(window.innerWidth, 480);
      book.style.setProperty("--album-closed-height", `${width * 0.68 * (1808 / 1280) + 18}px`);
      book.style.setProperty("--album-spread-height", `${width * 1.12 * (1808 / 2560) + 18}px`);
    }

    function openAlbum() {
      if (isTurning || !pages.length || currentSpread >= 0) return;
      isTurning = true;
      currentSpread = 0;
      showSpread(currentSpread);
      book.classList.add("is-open", "is-opening");
      window.setTimeout(() => {
        book.classList.remove("is-opening");
        isTurning = false;
      }, 720);
    }

    function closeAlbum() {
      if (isTurning || currentSpread < 0) return;
      isTurning = true;
      book.classList.add("is-closing");
      book.classList.remove("is-open");
      spread.setAttribute("aria-hidden", "true");
      previousEdge.tabIndex = -1;
      nextEdge.tabIndex = -1;
      leftPage.tabIndex = -1;
      rightPage.tabIndex = -1;
      window.setTimeout(() => {
        book.classList.remove("is-closing");
        currentSpread = -1;
        cover.tabIndex = 0;
        isTurning = false;
      }, 720);
    }

    function turnSpread(direction) {
      if (isTurning || currentSpread < 0) return;
      if (direction < 0 && currentSpread === 0) {
        closeAlbum();
        return;
      }
      const nextSpread = currentSpread + direction;
      if (nextSpread < 0 || nextSpread >= spreadCount) return;
      isTurning = true;
      const current = getSpread(currentSpread);
      const incoming = getSpread(nextSpread);
      underLeft.src = incoming.left?.src || "";
      underRight.src = incoming.right?.src || "";
      turningFront.src = direction > 0 ? current.right?.src || "" : current.left?.src || "";
      turningBack.src = direction > 0 ? incoming.left?.src || "" : incoming.right?.src || "";
      turningSheet.hidden = false;
      currentSpread = nextSpread;
      showSpread(currentSpread);
      book.classList.add(direction > 0 ? "is-turning-next" : "is-turning-previous");

      let finished = false;
      const finishTurn = () => {
        if (finished) return;
        finished = true;
        book.classList.remove("is-turning-next", "is-turning-previous");
        turningSheet.hidden = true;
        isTurning = false;
      };
      turningSheet.addEventListener("animationend", finishTurn, { once: true });
      window.setTimeout(finishTurn, 760);
    }

    function openPage(page) {
      if (!page) return;
      lightboxImage.src = page.src;
      lightboxImage.alt = page.alt || "婚礼照片";
      lightbox.hidden = false;
      document.body.style.overflow = "hidden";
      closeButton.focus();
    }

    cover.addEventListener("click", openAlbum);
    cover.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openAlbum();
    });
    leftPage.addEventListener("click", () => openPage(getSpread(currentSpread).left));
    rightPage.addEventListener("click", () => openPage(getSpread(currentSpread).right));
    previousEdge.addEventListener("click", () => turnSpread(-1));
    nextEdge.addEventListener("click", () => turnSpread(1));

    book.addEventListener("pointerdown", (event) => {
      pointerStart = { x: event.clientX, y: event.clientY };
    });
    book.addEventListener("pointerup", (event) => {
      if (!pointerStart) return;
      const deltaX = event.clientX - pointerStart.x;
      const deltaY = event.clientY - pointerStart.y;
      pointerStart = null;
      if (Math.abs(deltaX) < 44 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return;
      if (currentSpread < 0 && deltaX < 0) openAlbum();
      else turnSpread(deltaX < 0 ? 1 : -1);
    });
    book.addEventListener("pointercancel", () => {
      pointerStart = null;
    });

    function closeLightbox() {
      lightbox.hidden = true;
      lightboxImage.src = "";
      document.body.style.overflow = "";
    }

    closeButton.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !lightbox.hidden) {
        closeLightbox();
        return;
      }
      if (!lightbox.hidden || !document.querySelector("#photos")?.classList.contains("is-active")) return;
      if (event.key === "ArrowLeft") turnSpread(-1);
      if (event.key === "ArrowRight") {
        if (currentSpread < 0) openAlbum();
        else turnSpread(1);
      }
    });

    syncBookHeight();
    window.addEventListener("resize", syncBookHeight);
  }

  function bindAnonymousToggle(form, checkboxName, nameFieldName) {
    const checkbox = form.elements.namedItem(checkboxName);
    const nameField = form.elements.namedItem(nameFieldName);
    const sync = () => {
      nameField.disabled = checkbox.checked;
      nameField.placeholder = checkbox.checked ? "将以匿名身份发布" : "你的名字";
      if (checkbox.checked) nameField.value = "";
    };
    checkbox.addEventListener("change", sync);
    sync();
    return sync;
  }

  function bindWishes() {
    const form = document.querySelector("#wishForm");
    const syncWishAuthor = bindAnonymousToggle(form, "anonymous", "name");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submitWish(form, syncWishAuthor);
    });
    renderWishList();
    loadRemoteWishes();
  }

  async function loadRemoteWishes(page = wishCurrentPage) {
    if (!wishApiEndpoint) return;
    try {
      wishCurrentPage = Math.max(1, Number(page) || 1);
      const response = await fetch(
        buildApiUrl(wishApiEndpoint, {
          page: wishCurrentPage,
          pageSize: wishPageSize,
          replyLimit: replyPreviewSize,
        }),
        { headers: { Accept: "application/json" } },
      );
      if (!response.ok) {
        wishApiStatus = response.status === 404 ? "unavailable" : "error";
        remoteWishes = null;
        renderWishList();
        return;
      }
      const data = await response.json();
      wishApiStatus = "available";
      remoteWishes = Array.isArray(data.wishes) ? data.wishes : [];
      remoteWishPagination = {
        page: Number(data.page || wishCurrentPage),
        pageSize: Number(data.pageSize || wishPageSize),
        total: Number(data.total || remoteWishes.length),
        totalPages: Math.max(1, Number(data.totalPages || 1)),
      };
      wishCurrentPage = remoteWishPagination.page;
      renderWishList();
    } catch {
      wishApiStatus = "unavailable";
      remoteWishes = null;
      renderWishList();
    }
  }

  async function submitWish(form, syncWishAuthor) {
    const formData = new FormData(form);
    const text = String(formData.get("text") || "").trim();
    const anonymous = formData.get("anonymous") === "on";
    const enteredName = String(formData.get("name") || "").trim();
    if (!text) {
      showToast("请先写下祝福内容");
      return;
    }
    if (!anonymous && !enteredName) {
      showToast("请填写姓名，或选择匿名留言");
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = "正在发布";
    if (wishApiEndpoint) {
      if (wishApiStatus === "unavailable") {
        showToast("当前预览未连接数据库，请使用带数据库的预览链接");
        submitButton.disabled = false;
        submitButton.textContent = "发布祝福";
        return;
      }
      try {
        const data = await postJson(wishApiEndpoint, {
          name: enteredName,
          text,
          anonymous,
        });
        wishApiStatus = "available";
        form.reset();
        syncWishAuthor();
        await loadRemoteWishes(1);
        showToast("祝福已发布");
        return;
      } catch (error) {
        wishApiStatus = error.status === 404 ? "unavailable" : "error";
        remoteWishes = null;
        renderWishList();
        showToast(error.status === 404 ? "当前预览未连接数据库，请使用带数据库的预览链接" : "祝福暂时无法发布，请稍后重试");
        return;
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = "发布祝福";
      }
    }

    const wishes = getStoredWishes();
    wishes.unshift({
      id: `wish-${Date.now()}`,
      name: anonymous ? "匿名亲友" : enteredName,
      text,
      replies: [],
      createdAt: new Date().toISOString(),
    });
    setStoredWishes(wishes);
    form.reset();
    syncWishAuthor();
    renderWishList();
    showToast("祝福已发布");
    submitButton.disabled = false;
    submitButton.textContent = "发布祝福";
  }

  function replyCountOf(wish) {
    return Number(wish.replyCount ?? (wish.replies || []).length);
  }

  function renderReplyRows(replies) {
    return replies
      .map(
        (reply) => `
          <div class="reply">
            <p class="reply__name">${escapeHtml(reply.name || "匿名亲友")}</p>
            <p class="reply__text">${escapeHtml(reply.text)}</p>
          </div>
        `,
      )
      .join("");
  }

  function renderReplySection(wish) {
    const replyTotal = replyCountOf(wish);
    if (!replyTotal) return "";
    const isExpanded = expandedReplies.has(wish.id);
    const replies = isExpanded ? fullRepliesByWish[wish.id] || wish.replies || [] : (wish.replies || []).slice(-replyPreviewSize);
    const expandButton =
      !isExpanded && replyTotal > replies.length
        ? `<button class="reply-expand" type="button" data-wish-replies="${escapeHtml(wish.id)}">查看全部 ${escapeHtml(replyTotal)} 条回复</button>`
        : "";
    return `<div class="reply-list">${renderReplyRows(replies)}${expandButton}</div>`;
  }

  function renderWishPagination(totalPages) {
    if (totalPages <= 1) return "";
    const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
    return `
      <nav class="wish-pagination" aria-label="祝福分页">
        ${pages
          .map(
            (page) => `
              <button class="wish-pagination__item${page === wishCurrentPage ? " is-active" : ""}" type="button" data-wish-page="${page}" ${page === wishCurrentPage ? 'aria-current="page"' : ""}>
                ${page}
              </button>
            `,
          )
          .join("")}
      </nav>
    `;
  }

  async function loadFullReplies(wishId) {
    expandedReplies.add(wishId);
    if (!wishApiEndpoint) {
      renderWishList();
      return;
    }
    if (!fullRepliesByWish[wishId]) {
      try {
        const response = await fetch(
          buildApiUrl(`${wishApiEndpoint}/${encodeURIComponent(wishId)}/replies`, {
            page: 1,
            pageSize: replyPageSize,
          }),
          { headers: { Accept: "application/json" } },
        );
        if (!response.ok) throw new Error("reply-load-failed");
        const data = await response.json();
        fullRepliesByWish[wishId] = Array.isArray(data.replies) ? data.replies : [];
        const target = remoteWishes?.find((wish) => wish.id === wishId);
        if (target) target.replyCount = Number(data.total || fullRepliesByWish[wishId].length);
      } catch {
        expandedReplies.delete(wishId);
        showToast("回复暂时无法展开，请稍后重试");
      }
    }
    renderWishList();
  }

  function bindWishListControls(list) {
    list.querySelectorAll("[data-wish-page]").forEach((button) => {
      button.addEventListener("click", () => {
        const nextPage = Number(button.dataset.wishPage || 1);
        if (nextPage === wishCurrentPage) return;
        wishCurrentPage = nextPage;
        if (wishApiEndpoint) {
          wishApiStatus = "unknown";
          renderWishList();
          loadRemoteWishes(nextPage);
        } else {
          renderWishList();
        }
      });
    });

    list.querySelectorAll("[data-wish-replies]").forEach((button) => {
      button.addEventListener("click", () => {
        loadFullReplies(button.dataset.wishReplies);
      });
    });

    list.querySelectorAll(".reply-form").forEach((form) => {
      bindAnonymousToggle(form, "replyAnonymous", "replyName");
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        addReply(form.dataset.wishId, {
          name: formData.get("replyName"),
          anonymous: formData.get("replyAnonymous") === "on",
          text: formData.get("replyText"),
        });
      });
    });
  }

  function renderWishList() {
    const list = document.querySelector("#wishList");
    if (wishApiEndpoint && wishApiStatus === "unknown") {
      list.innerHTML = '<div class="wish-empty">正在读取祝福...</div>';
      return;
    }
    if (wishApiEndpoint && wishApiStatus === "unavailable") {
      list.innerHTML = '<div class="wish-empty">当前预览未连接数据库。请使用带数据库的预览链接查看和发布祝福。</div>';
      return;
    }
    if (wishApiEndpoint && wishApiStatus === "error") {
      list.innerHTML = '<div class="wish-empty">祝福暂时无法读取，请稍后刷新页面。</div>';
      return;
    }
    const wishes = allWishes();
    const totalWishes = wishApiEndpoint ? remoteWishPagination.total : wishes.length;
    const totalPages = wishApiEndpoint ? remoteWishPagination.totalPages : Math.max(1, Math.ceil(wishes.length / wishPageSize));
    wishCurrentPage = Math.min(Math.max(1, wishCurrentPage), totalPages);
    const pageOffset = (wishCurrentPage - 1) * wishPageSize;
    const pageWishes = wishApiEndpoint ? wishes : wishes.slice(pageOffset, pageOffset + wishPageSize);
    if (!totalWishes) {
      list.innerHTML = '<div class="wish-empty">还没有祝福，等你写下第一句。</div>';
      return;
    }
    list.innerHTML =
      pageWishes
      .map((wish, index) => {
        return `
          <article class="wish">
            <div class="wish__head">
              <p class="wish__name">${escapeHtml(wish.name)}</p>
              <span class="wish__mark">No. ${String(pageOffset + index + 1).padStart(2, "0")}</span>
            </div>
            <p class="wish__text">${escapeHtml(wish.text)}</p>
            ${renderReplySection(wish)}
            <details class="reply-composer">
              <summary>回复这条祝福 <span aria-hidden="true">＋</span></summary>
              <form class="reply-form" data-wish-id="${escapeHtml(wish.id)}">
                <label class="field-label">
                  Name
                  <input class="field" name="replyName" type="text" maxlength="18" placeholder="你的名字" autocomplete="name" />
                </label>
                <label class="switch-line switch-line--compact">
                  <input name="replyAnonymous" type="checkbox" />
                  匿名回复
                </label>
                <label class="field-label">
                  Reply
                  <input class="field" name="replyText" type="text" maxlength="80" placeholder="写下回复内容" />
                </label>
                <button class="button button--quiet button--wide" type="submit">发布回复</button>
              </form>
            </details>
          </article>
        `;
      })
      .join("") + renderWishPagination(totalPages);
    bindWishListControls(list);
  }

  function addReply(wishId, payload) {
    saveReply(wishId, payload);
  }

  async function saveReply(wishId, payload) {
    const text = String(payload.text || "").trim();
    const enteredName = String(payload.name || "").trim();
    if (!text) {
      showToast("请先填写回复内容");
      return;
    }
    if (!payload.anonymous && !enteredName) {
      showToast("请填写姓名，或选择匿名回复");
      return;
    }

    if (wishApiEndpoint) {
      if (!Array.isArray(remoteWishes) || wishApiStatus !== "available") {
        showToast("当前祝福数据库不可用，请稍后重试");
        return;
      }
      try {
        const data = await postJson(`${wishApiEndpoint}/${encodeURIComponent(wishId)}/replies`, {
          name: enteredName,
          text,
          anonymous: payload.anonymous,
        });
        const target = remoteWishes.find((wish) => wish.id === wishId);
        if (target) {
          target.replies = target.replies || [];
          target.replies.push(data.reply);
          target.replies = target.replies.slice(-replyPreviewSize);
          target.replyCount = replyCountOf(target) + 1;
        }
        if (fullRepliesByWish[wishId]) {
          fullRepliesByWish[wishId].push(data.reply);
        }
        renderWishList();
        showToast("回复已发布");
        return;
      } catch {
        showToast("回复暂时无法发布，请稍后重试");
        return;
      }
    }

    const reply = {
      name: payload.anonymous ? "匿名亲友" : enteredName,
      text,
      createdAt: new Date().toISOString(),
    };
    const stored = getStoredWishes();
    const storedTarget = stored.find((wish) => wish.id === wishId);
    if (storedTarget) {
      storedTarget.replies = storedTarget.replies || [];
      storedTarget.replies.push(reply);
      setStoredWishes(stored);
    } else if (config.blessingSeed.some((wish) => wish.id === wishId)) {
      const seedReplies = getStoredSeedReplies();
      seedReplies[wishId] = seedReplies[wishId] || [];
      seedReplies[wishId].push(reply);
      setStoredSeedReplies(seedReplies);
    } else {
      showToast("这条祝福暂时无法回复，请刷新页面后重试");
      return;
    }

    renderWishList();
    showToast("回复已发布");
  }

  function normalizeGuestName(value) {
    return String(value || "")
      .normalize("NFKC")
      .replace(/\s+/g, "")
      .toLocaleLowerCase("zh-CN");
  }

  function normalizeInvitationCode(value) {
    return String(value || "")
      .normalize("NFKC")
      .replace(/[\s-]+/g, "")
      .toUpperCase();
  }

  async function lookupSeat(name, invitationCode) {
    if (config.seatLookup.apiEndpoint) {
      const response = await fetch(config.seatLookup.apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, invitationCode }),
      });
      if (!response.ok) throw new Error("seat-lookup-failed");
      return response.json();
    }

    const guest = config.seatingGuests.find(
      (item) =>
        normalizeGuestName(item.name) === normalizeGuestName(name) &&
        normalizeInvitationCode(item.invitationCode) === invitationCode,
    );
    return guest ? { found: true, guest } : { found: false };
  }

  function bindSeats() {
    const form = document.querySelector("#seatForm");
    const result = document.querySelector("#seatResult");
    const codeInput = form.elements.namedItem("invitationCode");
    const submitButton = form.querySelector('button[type="submit"]');
    const codeLength = config.seatLookup.invitationCodeLength;

    codeInput.addEventListener("input", () => {
      codeInput.value = normalizeInvitationCode(codeInput.value).slice(0, codeLength);
    });
    document.querySelector("#seatHelpButton").addEventListener("click", contactNewlyweds);

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const name = String(formData.get("guestName") || "").trim();
      const invitationCode = normalizeInvitationCode(formData.get("invitationCode"));

      if (!name) {
        result.innerHTML = '<div class="seat-result">请填写请柬上的宾客姓名。</div>';
        return;
      }
      if (!new RegExp(`^[A-Z0-9]{${codeLength}}$`).test(invitationCode)) {
        result.innerHTML = `<div class="seat-result">请输入完整的${escapeHtml(codeLength)}位邀请码。</div>`;
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = "正在查询";
      try {
        const lookupResult = await lookupSeat(name, invitationCode);
        if (!lookupResult.found) {
          result.innerHTML =
            '<div class="seat-result">姓名或邀请码不匹配，请检查电子请柬后重新输入。</div>';
          return;
        }

        const guest = lookupResult.guest || lookupResult;
        result.innerHTML = `
          <div class="seat-result">
            ${escapeHtml(guest.name || name)}，您的桌号是<br />
            <strong>${escapeHtml(guest.table)}</strong><br />
            ${escapeHtml(guest.seatNote || "")}
          </div>
        `;
      } catch {
        result.innerHTML =
          '<div class="seat-result">座位查询暂时不可用，请稍后重试或联系新人。</div>';
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = "查看我的席位";
      }
    });
  }

  function updateCountdown() {
    const diff = new Date(config.couple.dateISO).getTime() - Date.now();
    const text = document.querySelector("#countdownText");
    const daysElement = document.querySelector("#countdownDays");
    if (!text || !daysElement) return;

    if (diff <= 0) {
      text.textContent = "婚礼已如期举行，感谢每一份见证";
      daysElement.textContent = "♥";
      return;
    }

    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    text.textContent = "距离我们相见还有";
    daysElement.textContent = String(days);
  }

  function showToast(message) {
    const oldToast = document.querySelector(".toast");
    if (oldToast) oldToast.remove();
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    toast.setAttribute("role", "status");
    document.body.appendChild(toast);
    window.setTimeout(() => toast.remove(), 2200);
  }

  render();
})();
