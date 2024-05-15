import { Metadata, namespaced } from "../shared";

const DEFAULT_CHUNK_SIZE = 1024 * 1024; // 1MB

export default class Client {
    private ws: WebSocket;
    private chunkSize: number;
    private file: File;

    constructor(url: string | URL, file: File, chunkSize?: number);
    constructor(ws: WebSocket, file: File, chunkSize?: number);
    constructor(
        urlOrSocket: (string | URL) | WebSocket,
        file: File,
        chunkSize = DEFAULT_CHUNK_SIZE,
    ) {
        this.ws =
            urlOrSocket instanceof WebSocket
                ? urlOrSocket
                : new WebSocket(urlOrSocket);
        this.chunkSize = chunkSize;
        this.file = file;
    }

    public on(
        event: "progress",
        listener: (event: UploadProgressEvent) => void,
    ): void;
    public on<E extends keyof WebSocketEventMap>(
        event: E,
        listener: (event: WebSocketEventMap[E]) => void,
    ): void;
    public on(event: string, listener: (event: any) => void) {
        if (event === "progress") {
            this.ws.addEventListener(namespaced("progress"), listener);
            return;
        }
        this.ws.addEventListener(event, listener);
    }

    public upload() {
        this.ws.addEventListener("open", () => {
            const ws = this.ws;
            const metadata: Metadata = Metadata.create(this.file);
            ws.send(Metadata.toJSON(metadata));
            let loaded = 0;
            const total = this.file.size;
            const num_chunks = Math.ceil(total / this.chunkSize);
            for (let i = 0; i < num_chunks; i++) {
                const offset = Math.min(this.chunkSize, total - loaded);
                const start = loaded;
                const end = loaded + offset;
                const chunk = this.file.slice(start, end);
                ws.send(chunk);
                loaded += offset;
                const ev = new UploadProgressEvent({
                    loaded,
                    total,
                    lengthComputable: true,
                });
                ws.dispatchEvent(ev);
            }

            // close the connection
            ws.close();
        });
    }
}

type UploadProgressEventInit = ProgressEventInit & {
    loaded: number;
    total: number;
};

class UploadProgressEvent extends ProgressEvent {
    public readonly progress: number;
    constructor(init: UploadProgressEventInit) {
        super(namespaced("progress"), init);
        this.progress = (init.loaded / init.total) * 100;
    }
}
