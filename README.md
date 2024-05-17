# BigUps

BigUps makes it easy to upload very large files from the client and handle them on the server.

## Features

-   Simple client and server API
-   Supports uploading files of any size
-   Progress tracking for uploads
-   Automatically chunks files for efficient transfer
-   Utilizes websockets, avoiding excessive requests.

## Installation

```bash
npm install bigups
```

## Usage

### Client

```typescript
import BigUps from "bigups/client";

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
```

### Server

```typescript
import http from "http";
import BigUps from "bigups/server";

const og = http.createServer((_, res) => {
    // normal server stuff here
});

const server = BigUps.init(original)
    .upgrade()
    .on("start", () => console.log("start"))
    .on("metadata", (metadata) => console.log("metadata", metadata))
    .on("chunk", (chunk) => console.log("chunk", chunk))
    .on("success", () => console.log("success"))
    .on("done", (code, reason) => console.log("done", code, reason))
    .on("error", (error) => console.error("error", error))
    .listen(3000, () => {
        console.log("listening on http://localhost:3000");
    });
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License.
