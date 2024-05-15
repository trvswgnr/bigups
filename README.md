# BigUps

BigUps makes it easy to upload very large files from the client and handle them on the server.

## Features

-   Simple client and server API
-   Supports uploading files of any size
-   Progress tracking for uploads
-   Automatically chunks files for efficient transfer

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
import Server from "bigups/server";

const server = new Server();

// metadata is the first message sent by the client
server.on("metadata", (metadata: Metadata) => {
    console.log(`Received file: ${metadata.filename} (${metadata.size} bytes)`);
});

server.on("chunk", (chunk: Buffer) => {
    console.log(`Received chunk: ${chunk.length} bytes`);
});

server.listen(3000);
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License.
