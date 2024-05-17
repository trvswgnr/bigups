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
import Client from "bigups/client";

const client = new Client("ws://localhost:3000", file);

client.on("progress", (event: UploadProgressEvent) => {
    console.log(`Upload progress: ${event.progress}%`);
});

client.on("close", (event: CloseEvent) => {
    console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
});

client.upload();
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
