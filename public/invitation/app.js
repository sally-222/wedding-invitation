(function () {
  const config = window.WEDDING_CONFIG;
  const app = document.querySelector("#app");
  const storageKey = "wedding-wishes-v2";
  const seedRepliesStorageKey = "wedding-seed-replies-v1";
  let audioController = null;

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
    const storedSeedReplies = getStoredSeedReplies();
    const seeds = config.blessingSeed.map((wish) => ({
      ...wish,
      replies: [...(wish.replies || []), ...(storedSeedReplies[wish.id] || [])],
    }));
    return [...getStoredWishes(), ...seeds];
  }

  function pageHeader(index, english, title, copy) {
    return `
      <header class="page-head">
        <div class="page-head__topline">
          <span class="page-head__index">${escapeHtml(index)}</span>
          <span class="page-head__index">${escapeHtml(english)}</span>
        </div>
        <h1 class="page-head__title">${escapeHtml(title)}</h1>
        <p class="page-head__copy">${escapeHtml(copy)}</p>
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
            <span class="cover__image-index">
              <span>FRAME 06</span>
              <span>FILM / 2026</span>
            </span>
            <p class="cover__image-caption">我们的婚礼 · 2026 秋</p>
          </div>

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

          <div class="cover__closing">
            <p class="cover__invitation">${escapeHtml(couple.invitationLine)}</p>
            <p class="cover__note">${escapeHtml(couple.heroNote)}</p>
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
              <p class="meta-value">${escapeHtml(couple.date)} · 星期二</p>
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
    const cards = config.travelSpots
      .map((spot, index) => {
        const image = spot.image
          ? `<div class="travel-card__image"><img src="${escapeHtml(spot.image)}" alt="${escapeHtml(spot.name)}" loading="lazy" /></div>`
          : `<div class="travel-card__image is-placeholder" data-mark="${escapeHtml(spot.name.slice(0, 1))}" style="background:${escapeHtml(spot.color)}" aria-hidden="true"></div>`;
        return `
          <a class="travel-card" href="${escapeHtml(spot.dianpingUrl)}" target="_blank" rel="noreferrer">
            ${image}
            <div class="travel-card__body">
              <span class="travel-card__category">0${index + 1} · ${escapeHtml(spot.category)}</span>
              <h2 class="travel-card__name">${escapeHtml(spot.name)}</h2>
              <p class="travel-card__desc">${escapeHtml(spot.description)}</p>
              <span class="travel-card__link">大众点评 ↗</span>
            </div>
          </a>
        `;
      })
      .join("");

    return `
      <section id="travel" class="view" data-view>
        <div class="page page--tinted">
          ${pageHeader("02 / 05", "Local taste", "赴宴闲游", "婚礼之外，也留一点时间给濮阳。点击一处风味，打开大众点评查看。")}
          <div class="travel-grid">${cards}</div>
        </div>
      </section>
    `;
  }

  function renderPhotos() {
    const photos = config.photos
      .map((photo, index) => {
        const number = String(index + 1).padStart(2, "0");
        const media = photo.image
          ? `<div class="photo-item__image"><img src="${escapeHtml(photo.image)}" alt="${escapeHtml(photo.title)}" loading="lazy" /></div>`
          : `<div class="photo-item__image is-placeholder" style="background:${escapeHtml(photo.tone)}" aria-hidden="true"></div>`;
        return `
          <figure class="photo-item">
            <button class="photo-item__button" type="button" ${photo.image ? `data-image="${escapeHtml(photo.image)}" data-title="${escapeHtml(photo.title)}"` : "disabled"} aria-label="${photo.image ? `查看${escapeHtml(photo.title)}` : escapeHtml(photo.title)}">
              ${media}
            </button>
            <figcaption class="photo-item__caption">
              <span>${escapeHtml(photo.title)}</span>
              <span class="photo-item__number">${number}</span>
            </figcaption>
          </figure>
        `;
      })
      .join("");

    return `
      <section id="photos" class="view" data-view>
        <div class="page">
          ${pageHeader("03 / 05", "Our frames", "照片墙", "真实照片到位后会保持这组胶片式比例和错落节奏，直接替换当前占位内容。")}
          <div class="photo-wall">${photos}</div>
          ${renderCredits()}
        </div>
      </section>
    `;
  }

  function renderWishes() {
    return `
      <section id="wishes" class="view" data-view>
        <div class="page page--tinted">
          ${pageHeader("04 / 05", "Guest notes", "留言祝福", "写下几句话，可以署名，也可以匿名。回复同样可以选择署名或匿名，所有内容均不显示头像。")}
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
        <div class="page page--tinted">
          ${pageHeader("05 / 05", "Seat finder", "座位查询", "输入宾客姓名和电子请柬中的专属邀请码，即可查看席位。无需填写手机号。")}
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
            <p class="helper-text">演示查询：张明＋241006，或王晨＋110620。</p>
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

  function render() {
    app.innerHTML = [
      renderHome(),
      renderTravel(),
      renderPhotos(),
      renderWishes(),
      renderSeats(),
      renderLightbox(),
    ].join("");
    bindNavigation();
    bindHomeActions();
    bindPhotos();
    bindWishes();
    bindSeats();
    updateCountdown();
    window.setInterval(updateCountdown, 60 * 1000);
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

    document.querySelector("#musicButton").addEventListener("click", async (event) => {
      if (!audioController) audioController = createAudioController();
      const isPlaying = await audioController.toggle();
      event.currentTarget.classList.toggle("is-playing", isPlaying);
      event.currentTarget.setAttribute("aria-label", isPlaying ? "暂停背景音乐" : config.music.title);
      showToast(isPlaying ? "背景音乐已开启" : "背景音乐已暂停");
    });
  }

  function contactNewlyweds() {
    const phones = [config.contacts.groomPhone, config.contacts.bridePhone].filter(Boolean);
    if (!phones.length) {
      showToast(config.contacts.phonePlaceholderText || "电话待补充");
      return;
    }
    window.location.href = `tel:${phones[0]}`;
  }

  function createAudioController() {
    if (config.music.audioUrl) {
      const audio = new Audio(config.music.audioUrl);
      audio.loop = true;
      audio.preload = "auto";
      return {
        async toggle() {
          if (audio.paused) {
            await audio.play();
            return true;
          }
          audio.pause();
          return false;
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
      async toggle() {
        if (timer) {
          window.clearInterval(timer);
          timer = null;
          return false;
        }
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) {
          showToast("当前浏览器暂不支持内置背景音乐，请在配置中替换为音频文件");
          return false;
        }
        context = context || new AudioContextClass();
        if (context.state === "suspended") await context.resume();
        playNote();
        timer = window.setInterval(playNote, 1900);
        return true;
      },
    };
  }

  function bindPhotos() {
    const lightbox = document.querySelector("#lightbox");
    const lightboxImage = document.querySelector("#lightboxImage");
    const closeButton = document.querySelector("#lightboxClose");

    document.querySelectorAll(".photo-item__button[data-image]").forEach((button) => {
      button.addEventListener("click", () => {
        lightboxImage.src = button.dataset.image;
        lightboxImage.alt = button.dataset.title || "婚礼照片";
        lightbox.hidden = false;
        document.body.style.overflow = "hidden";
        closeButton.focus();
      });
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
      if (event.key === "Escape" && !lightbox.hidden) closeLightbox();
    });
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
    });
    renderWishList();
  }

  function renderWishList() {
    const list = document.querySelector("#wishList");
    list.innerHTML = allWishes()
      .map((wish, index) => {
        const replies = (wish.replies || [])
          .map(
            (reply) => `
              <div class="reply">
                <p class="reply__name">${escapeHtml(reply.name || "匿名亲友")}</p>
                <p class="reply__text">${escapeHtml(reply.text)}</p>
              </div>
            `,
          )
          .join("");

        return `
          <article class="wish">
            <div class="wish__head">
              <p class="wish__name">${escapeHtml(wish.name)}</p>
              <span class="wish__mark">No. ${String(index + 1).padStart(2, "0")}</span>
            </div>
            <p class="wish__text">${escapeHtml(wish.text)}</p>
            ${replies ? `<div class="reply-list">${replies}</div>` : ""}
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
      .join("");

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

  function addReply(wishId, payload) {
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
