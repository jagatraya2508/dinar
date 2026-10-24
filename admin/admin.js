const tabs = [
  ["kontak", "Kontak"],
  ["hero", "Hero"],
  ["about", "Tentang"],
  ["signature", "Sajian khas"],
  ["features", "Keunggulan"],
  ["promo", "Promo"],
  ["menu", "Menu"],
  ["gallery", "Galeri"],
  ["reviews", "Ulasan"],
  ["footer", "Footer"],
  ["password", "Kata sandi"],
];

const loginView = document.querySelector("#login");
const appView = document.querySelector("#app");
const panel = document.querySelector("#panel");
const panelTitle = document.querySelector("#panel-title");
const status = document.querySelector("#status");
const tabNav = document.querySelector("#tabs");
let content = null;
let current = "kontak";

function field(label, value, oninput, multiline) {
  const wrap = document.createElement("label");
  wrap.className = "field";
  const name = document.createElement("span");
  name.textContent = label;
  const input = document.createElement(multiline ? "textarea" : "input");
  input.value = value ?? "";
  input.addEventListener("input", () => oninput(input.value));
  wrap.append(name, input);
  return wrap;
}

function imageField(label, value, onchange) {
  const box = document.createElement("div");
  box.className = "img-field";
  const img = document.createElement("img");
  img.alt = "";
  img.src = value ? "/" + value : "";
  const side = document.createElement("div");
  side.append(field(label, value || "", (next) => {
    onchange(next);
    img.src = next ? "/" + next : "";
  }));
  const file = document.createElement("input");
  file.type = "file";
  file.accept = "image/jpeg,image/png,image/webp,image/gif";
  file.addEventListener("change", async () => {
    const chosen = file.files && file.files[0];
    if (!chosen) return;
    status.textContent = "Mengunggah foto...";
    const body = new FormData();
    body.append("file", chosen);
    const response = await fetch("/api/upload", { method: "POST", body });
    const payload = await response.json();
    if (!response.ok) {
      status.textContent = payload.error || "Gagal mengunggah.";
      return;
    }
    onchange(payload.path);
    img.src = "/" + payload.path + "?t=" + Date.now();
    status.textContent = "Foto terunggah. Jangan lupa simpan.";
    render();
  });
  side.append(file);
  box.append(img, side);
  return box;
}

function card(title) {
  const box = document.createElement("article");
  box.className = "card";
  if (title) {
    const heading = document.createElement("h2");
    heading.textContent = title;
    box.append(heading);
  }
  return box;
}

function removeButton(onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "danger";
  button.textContent = "Hapus";
  button.addEventListener("click", () => {
    onClick();
    render();
  });
  return button;
}

function addButton(label, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "add";
  button.textContent = label;
  button.addEventListener("click", () => {
    onClick();
    render();
  });
  return button;
}

const editors = {
  kontak() {
    const box = card("Nomor dan akun");
    const grid = document.createElement("div");
    grid.className = "grid";
    grid.append(
      field("Telepon di header", content.phone, (value) => { content.phone = value; }),
      field("Link telepon (tel)", content.phoneTel, (value) => { content.phoneTel = value; }),
      field("WhatsApp (628...)", content.whatsapp, (value) => { content.whatsapp = value; }),
      field("Tulisan WhatsApp", content.contact.whatsappDisplay, (value) => { content.contact.whatsappDisplay = value; }),
      field("Instagram", content.contact.instagram, (value) => { content.contact.instagram = value; }),
      field("Link Instagram", content.contact.instagramUrl, (value) => { content.contact.instagramUrl = value; }),
      field("Email", content.contact.email, (value) => { content.contact.email = value; }),
      field("Jam buka", content.contact.hours, (value) => { content.contact.hours = value; })
    );
    box.append(grid, field("Alamat", content.contact.address, (value) => { content.contact.address = value; }, true));
    box.append(imageField("Logo warna", content.logo, (value) => { content.logo = value; }));
    box.append(imageField("Logo putih", content.logoWhite, (value) => { content.logoWhite = value; }));
    box.append(field("Judul bagian kontak", content.contact.title, (value) => { content.contact.title = value; }));
    box.append(field("Link peta", content.contact.mapUrl, (value) => { content.contact.mapUrl = value; }));
    box.append(imageField("Foto peta", content.contact.map, (value) => { content.contact.map = value; }));
    return box;
  },
  hero() {
    const box = card("Bagian atas");
    box.append(
      field("Teks kecil", content.hero.eyebrow, (value) => { content.hero.eyebrow = value; }),
      field("Judul besar", content.hero.title, (value) => { content.hero.title = value; }, true),
      field("Tulisan tombol", content.hero.button, (value) => { content.hero.button = value; }),
      imageField("Foto latar", content.hero.image, (value) => { content.hero.image = value; })
    );
    return box;
  },
  about() {
    const box = card("Cerita");
    box.append(
      field("Judul", content.about.title, (value) => { content.about.title = value; }),
      field("Kalimat pembuka", content.about.since, (value) => { content.about.since = value; }),
      field("Paragraf", content.about.paragraphs.join("\n\n"), (value) => {
        content.about.paragraphs = value.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean);
      }, true)
    );
    return box;
  },
  signature() {
    const wrap = document.createElement("div");
    wrap.append(field("Judul", content.signature.title, (value) => { content.signature.title = value; }));
    wrap.append(field("Subjudul", content.signature.subtitle, (value) => { content.signature.subtitle = value; }));
    content.signature.items.forEach((item, index) => {
      const box = card("Sajian " + (index + 1));
      box.append(
        field("Nama", item.title, (value) => { item.title = value; }, true),
        imageField("Foto", item.image, (value) => { item.image = value; }),
        removeButton(() => content.signature.items.splice(index, 1))
      );
      wrap.append(box);
    });
    wrap.append(addButton("Tambah sajian", () => {
      content.signature.items.push({ image: "", title: "Menu baru", alt: "Menu baru" });
    }));
    return wrap;
  },
  features() {
    const wrap = document.createElement("div");
    wrap.append(field("Judul", content.features.title, (value) => { content.features.title = value; }));
    content.features.items.forEach((item, index) => {
      const box = card("Poin " + (index + 1));
      box.append(
        field("Judul", item.title, (value) => { item.title = value; }),
        field("Keterangan", item.text, (value) => { item.text = value; }, true)
      );
      wrap.append(box);
    });
    return wrap;
  },
  promo() {
    const box = card("Promo");
    box.append(
      field("Teks kecil", content.promo.eyebrow, (value) => { content.promo.eyebrow = value; }),
      field("Judul", content.promo.headline, (value) => { content.promo.headline = value; }),
      field("Baris tambahan", content.promo.plus, (value) => { content.promo.plus = value; }),
      field("Label kupon", content.promo.codeLabel, (value) => { content.promo.codeLabel = value; }),
      field("Kode kupon", content.promo.code, (value) => { content.promo.code = value; }),
      field("Tulisan tombol", content.promo.button, (value) => { content.promo.button = value; }),
      field("Keterangan", content.promo.fine, (value) => { content.promo.fine = value; }, true),
      imageField("Foto", content.promo.image, (value) => { content.promo.image = value; })
    );
    return box;
  },
  menu() {
    const wrap = document.createElement("div");
    wrap.append(
      field("Judul", content.menu.title, (value) => { content.menu.title = value; }),
      field("Subjudul", content.menu.subtitle, (value) => { content.menu.subtitle = value; })
    );
    content.menu.categories.forEach((category, categoryIndex) => {
      const box = card("Kategori");
      box.append(field("Nama kategori", category.name, (value) => { category.name = value; }));
      category.items.forEach((item, itemIndex) => {
        const itemBox = card(item.name.split("\n")[0] || "Menu");
        itemBox.append(
          field("Nama", item.name, (value) => { item.name = value; item.alt = value; }, true),
          field("Harga", item.price, (value) => { item.price = value; }),
          imageField("Foto", item.image, (value) => { item.image = value; }),
          removeButton(() => category.items.splice(itemIndex, 1))
        );
        box.append(itemBox);
      });
      box.append(addButton("Tambah menu", () => {
        category.items.push({ name: "Menu baru", price: "Rp 0", image: "", alt: "Menu baru" });
      }));
      box.append(removeButton(() => content.menu.categories.splice(categoryIndex, 1)));
      wrap.append(box);
    });
    wrap.append(addButton("Tambah kategori", () => {
      content.menu.categories.push({ name: "Kategori baru", items: [] });
    }));
    return wrap;
  },
  gallery() {
    const wrap = document.createElement("div");
    wrap.append(field("Judul", content.gallery.title, (value) => { content.gallery.title = value; }));
    content.gallery.images.forEach((item, index) => {
      const box = card("Foto " + (index + 1));
      box.append(
        field("Keterangan", item.alt, (value) => { item.alt = value; }),
        imageField("Foto", item.src, (value) => { item.src = value; }),
        removeButton(() => content.gallery.images.splice(index, 1))
      );
      wrap.append(box);
    });
    wrap.append(addButton("Tambah foto", () => {
      content.gallery.images.push({ src: "", alt: "Foto tempat" });
    }));
    return wrap;
  },
  reviews() {
    const wrap = document.createElement("div");
    const colors = ["n", "e", "v", "k"];
    wrap.append(field("Judul", content.reviews.title, (value) => { content.reviews.title = value; }));
    content.reviews.items.forEach((item, index) => {
      const box = card(item.name || "Ulasan");
      box.append(
        field("Nama", item.name, (value) => {
          item.name = value;
          item.initial = (value.trim()[0] || "?").toUpperCase();
        }),
        field("Waktu", item.when, (value) => { item.when = value; }),
        field("Ulasan", item.text, (value) => { item.text = value; }, true),
        removeButton(() => content.reviews.items.splice(index, 1))
      );
      wrap.append(box);
    });
    wrap.append(addButton("Tambah ulasan", () => {
      const color = colors[content.reviews.items.length % colors.length];
      content.reviews.items.push({ initial: "A", color, name: "Nama", when: "Baru saja", text: "" });
    }));
    return wrap;
  },
  footer() {
    const wrap = document.createElement("div");
    wrap.append(
      field("Tagline", content.footer.tagline, (value) => { content.footer.tagline = value; }),
      field("Hak cipta", content.footer.copyright, (value) => { content.footer.copyright = value; })
    );
    content.footer.columns.forEach((column, index) => {
      const box = card("Kolom " + (index + 1));
      box.append(
        field("Judul kolom", column.title, (value) => { column.title = value; }),
        field("Tautan, satu baris satu tautan", column.links.join("\n"), (value) => {
          column.links = value.split("\n").map((item) => item.trim()).filter(Boolean);
        }, true)
      );
      wrap.append(box);
    });
    return wrap;
  },
  password() {
    const box = card("Ganti kata sandi");
    const form = document.createElement("form");
    const current = document.createElement("input");
    const next = document.createElement("input");
    current.type = "password";
    next.type = "password";
    current.required = true;
    next.required = true;
    next.minLength = 6;
    form.append(
      fieldInput("Kata sandi sekarang", current),
      fieldInput("Kata sandi baru", next)
    );
    const button = document.createElement("button");
    button.type = "submit";
    button.className = "add";
    button.textContent = "Ganti kata sandi";
    form.append(button);
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const response = await fetch("/api/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current: current.value, next: next.value }),
      });
      const payload = await response.json();
      status.textContent = response.ok ? "Kata sandi sudah diganti." : (payload.error || "Gagal mengganti.");
      if (response.ok) form.reset();
    });
    box.append(form);
    return box;
  },
};

function fieldInput(label, input) {
  const wrap = document.createElement("label");
  wrap.className = "field";
  const name = document.createElement("span");
  name.textContent = label;
  wrap.append(name, input);
  return wrap;
}

function render() {
  panel.replaceChildren(editors[current]());
  panelTitle.textContent = tabs.find((item) => item[0] === current)[1];
  tabNav.querySelectorAll("button").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === current);
  });
  document.querySelector("#save").hidden = current === "password";
}

function showApp() {
  loginView.hidden = true;
  appView.hidden = false;
  tabNav.replaceChildren();
  tabs.forEach(([id, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.dataset.tab = id;
    button.addEventListener("click", () => {
      current = id;
      status.textContent = "";
      render();
    });
    tabNav.append(button);
  });
  render();
}

document.querySelector("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const error = document.querySelector("#login-error");
  const button = event.currentTarget.querySelector("button");
  error.hidden = true;
  button.disabled = true;
  button.textContent = "Memeriksa...";
  try {
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: String(form.get("username") || "").trim(),
        password: form.get("password") || "",
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      error.hidden = false;
      error.textContent = payload.error || "Username atau kata sandi salah.";
      return;
    }
    content = await (await fetch("/api/content")).json();
    showApp();
  } catch (err) {
    error.hidden = false;
    error.textContent = "Tidak bisa masuk. Pastikan jalankan.bat masih terbuka, lalu muat ulang halaman.";
  } finally {
    button.disabled = false;
    button.textContent = "Masuk";
  }
});

document.querySelector("#save").addEventListener("click", async () => {
  status.textContent = "Menyimpan...";
  const response = await fetch("/api/content", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(content),
  });
  const payload = await response.json().catch(() => ({}));
  status.textContent = response.ok ? "Perubahan tersimpan." : (payload.error || "Gagal menyimpan.");
});

document.querySelector("#logout").addEventListener("click", async () => {
  await fetch("/api/logout", { method: "POST" });
  location.reload();
});

fetch("/api/me")
  .then((response) => response.json())
  .then(async (me) => {
    if (!me.ok) return;
    content = await (await fetch("/api/content")).json();
    showApp();
  })
  .catch(() => {
    document.querySelector("#login-error").hidden = false;
    document.querySelector("#login-error").textContent = "Admin hanya bisa dibuka lewat server. Jalankan file jalankan.bat.";
  });
