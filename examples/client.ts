import BigUps from "../src/client";

const formEl = document.querySelector("form");
const inputEl = document.querySelector("input");
const progressEl = document.querySelector("progress");
if (!formEl || !inputEl || !progressEl) {
    throw new Error("Missing expected elements");
}

formEl.addEventListener("submit", async (e) => {
    e.preventDefault();

    const file = inputEl?.files?.[0];
    if (!file) return;

    const bigups = await BigUps.init("ws://localhost:3000")
        .on("progress", (e) => {
            progressEl.value = e.progress;
        })
        .on("close", () => alert("upload complete!"))
        .upload(file);
});
