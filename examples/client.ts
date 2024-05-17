import BigUps from "../src/client";

const form_el = document.querySelector("form");
const input_el = document.querySelector("input");
form_el?.addEventListener("submit", (e) => {
    e.preventDefault();
    const file = input_el?.files?.[0];
    if (!file) return;

    const bigups = new BigUps("ws://localhost:3000", file);
    bigups.upload();
});
