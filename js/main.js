const header = document.querySelector(".header");
const burger = document.querySelector(".burger");
const nav = document.querySelector(".nav");

burger.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  burger.setAttribute("aria-expanded", String(open));
});

nav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
  });
});

function bindReviews() {
  document.querySelectorAll(".read-more").forEach((button) => {
    if (button.dataset.bound) return;
    button.dataset.bound = "1";
    button.addEventListener("click", () => {
      const card = button.closest(".review-card");
      const open = card.classList.toggle("open");
      button.textContent = open ? "Read Less" : "Read More";
    });
  });
}
bindReviews();
window.bindReviews = bindReviews;

const onScroll = () => {
  header.classList.toggle("scrolled", window.scrollY > 8);
};
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });
