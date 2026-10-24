(function () {
  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function br(value) {
    return esc(value).replace(/\n/g, "<br>");
  }

  function wa(number, text) {
    const digits = String(number || "").replace(/\D/g, "");
    return "https://wa.me/" + digits + "?text=" + encodeURIComponent(text || "");
  }

  function apply(data) {
    const phone = document.querySelector(".phone-btn");
    if (phone) {
      phone.href = "tel:" + (data.phoneTel || "");
      const label = phone.querySelector("span");
      if (label) label.textContent = data.phone || "";
    }
    const logo = document.querySelector(".logo img");
    if (logo && data.logo) logo.src = data.logo;

    const hero = document.querySelector(".hero");
    if (hero && data.hero) {
      hero.style.backgroundImage =
        "linear-gradient(90deg, rgba(18, 12, 8, 0.62) 0%, rgba(18, 12, 8, 0.28) 46%, rgba(12, 10, 8, 0.45) 100%), url('" +
        String(data.hero.image || "").replace(/'/g, "") +
        "')";
      hero.style.backgroundPosition = "center, center 70%";
      hero.style.backgroundSize = "cover, cover";
      const eyebrow = hero.querySelector(".eyebrow");
      const title = hero.querySelector("h1");
      const button = hero.querySelector(".btn-red");
      if (eyebrow) eyebrow.textContent = data.hero.eyebrow || "";
      if (title) title.innerHTML = br(data.hero.title);
      if (button) {
        button.textContent = data.hero.button || "Pesan Sekarang";
        button.href = wa(data.whatsapp, "Halo Dinar Seafood, saya ingin pesan.");
      }
    }

    const about = document.querySelector(".about");
    if (about && data.about) {
      const heading = about.querySelector("h2");
      const since = about.querySelector(".since");
      if (heading) heading.textContent = data.about.title || "";
      if (since) since.textContent = data.about.since || "";
      about.querySelectorAll(".copy").forEach((node) => node.remove());
      (data.about.paragraphs || []).forEach((paragraph) => {
        const p = document.createElement("p");
        p.className = "copy";
        p.textContent = paragraph;
        about.appendChild(p);
      });
    }

    if (data.signature) {
      const head = document.querySelector("#signature .section-head");
      if (head) {
        head.querySelector("h2").textContent = data.signature.title || "";
        const sub = head.querySelector("p");
        if (sub) sub.textContent = data.signature.subtitle || "";
      }
      const grid = document.querySelector(".signature-grid");
      if (grid) {
        grid.innerHTML = (data.signature.items || [])
          .map(
            (item) =>
              '<figure class="sig"><img src="' +
              esc(item.image) +
              '" alt="' +
              esc(item.alt || item.title) +
              '"><figcaption>' +
              br(item.title) +
              "</figcaption></figure>"
          )
          .join("");
      }
    }

    if (data.features) {
      const heading = document.querySelector("#behind .section-head h2");
      if (heading) heading.textContent = data.features.title || "";
      document.querySelectorAll(".feat").forEach((article, index) => {
        const item = (data.features.items || [])[index];
        if (!item) return;
        const title = article.querySelector("h3");
        const num = title.querySelector(".num");
        title.textContent = "";
        if (num) title.appendChild(num);
        title.append(" " + (item.title || ""));
        article.querySelector("p").innerHTML = br(item.text);
      });
    }

    if (data.promo) {
      const photo = document.querySelector(".promo-photo img");
      if (photo) {
        photo.src = data.promo.image || "";
        photo.alt = data.promo.imageAlt || "";
      }
      const copy = document.querySelector(".promo-copy");
      if (copy) {
        copy.querySelector(".eyebrow").textContent = data.promo.eyebrow || "";
        copy.querySelector("h2").textContent = data.promo.headline || "";
        copy.querySelector(".plus").textContent = data.promo.plus || "";
        copy.querySelector(".kode").textContent = data.promo.codeLabel || "";
        copy.querySelector(".coupon").textContent = data.promo.code || "";
        copy.querySelector(".fine").textContent = data.promo.fine || "";
        const button = copy.querySelector(".btn-light");
        button.textContent = data.promo.button || "Pesan Sekarang";
        button.href = wa(
          data.whatsapp,
          "Halo Dinar Seafood, saya ingin pakai kupon " + (data.promo.code || "") + "."
        );
      }
    }

    if (data.menu) {
      const head = document.querySelector("#menu .section-head");
      if (head) {
        head.querySelector("h2").textContent = data.menu.title || "";
        const sub = head.querySelector("p");
        if (sub) sub.textContent = data.menu.subtitle || "";
      }
      document.querySelectorAll("#menu .menu-cat, #menu .menu-grid").forEach((node) => node.remove());
      const wrap = document.querySelector("#menu .wrap");
      (data.menu.categories || []).forEach((category) => {
        const heading = document.createElement("h3");
        heading.className = "menu-cat";
        heading.textContent = category.name || "";
        const grid = document.createElement("div");
        grid.className = "menu-grid";
        grid.innerHTML = (category.items || [])
          .map(
            (item) =>
              '<article class="menu-card"><img src="' +
              esc(item.image) +
              '" alt="' +
              esc(item.alt || item.name) +
              '"><h3>' +
              br(item.name) +
              '</h3><p class="price">' +
              esc(item.price) +
              "</p></article>"
          )
          .join("");
        wrap.append(heading, grid);
      });
    }

    if (data.gallery) {
      const heading = document.querySelector("#gallery .section-head h2");
      if (heading) heading.textContent = data.gallery.title || "";
      const places = document.querySelector(".places");
      if (places) {
        places.innerHTML = (data.gallery.images || [])
          .map((item) => '<img src="' + esc(item.src) + '" alt="' + esc(item.alt) + '">')
          .join("");
      }
    }

    if (data.reviews) {
      const heading = document.querySelector("#stories .section-head h2");
      if (heading) heading.textContent = data.reviews.title || "";
      const grid = document.querySelector(".review-grid");
      if (grid) {
        grid.innerHTML = (data.reviews.items || [])
          .map((item) => {
            const initial = esc((item.initial || item.name || "?").slice(0, 1));
            return (
              '<article class="review-card"><div class="review-top"><div class="who"><span class="avatar ' +
              esc(item.color || "n") +
              '">' +
              initial +
              "</span><h3>" +
              esc(item.name) +
              '</h3></div><span class="when">' +
              esc(item.when) +
              '</span></div><div class="stars" aria-label="5 bintang">★★★★★</div><p class="review-text">“' +
              esc(item.text) +
              '”</p><button class="read-more" type="button">Read More</button></article>'
            );
          })
          .join("");
        if (window.bindReviews) window.bindReviews();
      }
    }

    if (data.contact) {
      const title = document.querySelector("#contact h2");
      if (title) title.textContent = data.contact.title || "";
      const info = document.querySelectorAll("#contact .info-row p");
      if (info[0]) info[0].textContent = data.contact.address || "";
      if (info[1]) info[1].textContent = data.contact.hours || "";
      if (info[2]) {
        info[2].innerHTML =
          '<a href="' +
          esc(wa(data.whatsapp, "Halo Dinar Seafood")) +
          '" target="_blank" rel="noopener">' +
          esc(data.contact.whatsappDisplay) +
          "</a>";
      }
      if (info[3]) {
        info[3].innerHTML =
          '<a href="' +
          esc(data.contact.instagramUrl) +
          '" target="_blank" rel="noopener">' +
          esc(data.contact.instagram) +
          "</a>";
      }
      const mapLink = document.querySelector(".map-link");
      if (mapLink) {
        mapLink.href = data.contact.mapUrl || "#";
        const img = mapLink.querySelector("img");
        if (img) {
          img.src = data.contact.map || "";
          img.alt = data.contact.mapAlt || "";
        }
      }
    }

    if (data.footer) {
      const brand = document.querySelector(".footer-brand img");
      if (brand && data.logoWhite) brand.src = data.logoWhite;
      const tagline = document.querySelector(".tagline");
      if (tagline) tagline.textContent = data.footer.tagline || "";
      const cols = document.querySelector(".footer-cols");
      if (cols) {
        const targets = ["#about", "#menu", "#gallery", "#contact"];
        cols.innerHTML = (data.footer.columns || [])
          .map((column) => {
            const links = (column.links || [])
              .map((label, index) => '<a href="' + targets[index % targets.length] + '">' + esc(label) + "</a>")
              .join("");
            return "<div><h3>" + esc(column.title) + "</h3>" + links + "</div>";
          })
          .join("");
      }
      const foot = document.querySelectorAll(".footer-contact p");
      if (foot[0]) {
        const icon = foot[0].querySelector("svg");
        foot[0].textContent = "";
        if (icon) foot[0].appendChild(icon);
        foot[0].append(" " + (data.contact.address || ""));
      }
      if (foot[1]) {
        const icon = foot[1].querySelector("svg");
        foot[1].textContent = "";
        if (icon) foot[1].appendChild(icon);
        const link = document.createElement("a");
        link.href = "tel:" + (data.phoneTel || "");
        link.textContent = data.phone || "";
        foot[1].append(" ");
        foot[1].appendChild(link);
      }
      if (foot[2]) {
        const icon = foot[2].querySelector("svg");
        foot[2].textContent = "";
        if (icon) foot[2].appendChild(icon);
        const link = document.createElement("a");
        link.href = "mailto:" + (data.contact.email || "");
        link.textContent = data.contact.email || "";
        foot[2].append(" ");
        foot[2].appendChild(link);
      }
      const copy = document.querySelector(".footer-bottom");
      if (copy) copy.textContent = data.footer.copyright || "";
    }
  }

  if (location.protocol === "file:") return;
  fetch("/api/content")
    .then((response) => (response.ok ? response.json() : null))
    .then((data) => {
      if (data) apply(data);
    })
    .catch(() => {});
})();
