import { isObjectWithKey, Metadata, namespaced, noop } from "./shared";

const DEFAULT_CHUNK_SIZE = 1024 * 1024; // 1MB

type UploadConfig = {
    file: File;
} & EventHandlers;

type EventHandlers = {
    onprogress?: (event: UploadProgressEvent) => void;
    onclose?: (event: UploadCloseEvent) => void;
    onerror?: (event: UploadErrorEvent) => void;
};

export type ClientConfig = { chunkSize?: number } & (
    | { url: string | URL }
    | { ws: WebSocket }
) &
    EventHandlers;

export default class Upload {
    private ws: WebSocket;
    private handlers: Required<EventHandlers>;
    private chunkSize: number;
    private constructor(config: ClientConfig) {
        this.ws = isObjectWithKey(config, "ws")
            ? config.ws
            : new WebSocket(config.url);
        this.handlers = {
            onprogress: config.onprogress ?? noop,
            onclose: config.onclose ?? noop,
            onerror: config.onerror ?? noop,
        };
        this.chunkSize = config.chunkSize ?? DEFAULT_CHUNK_SIZE;
    }

    upload(config: UploadConfig) {
        const {
            file,
            onprogress = this.handlers.onprogress,
            onclose = this.handlers.onclose,
            onerror = this.handlers.onerror,
        } = config;

        this.ws.onopen = () => {
            return this.process(file, onprogress);
        };

        this.ws.onclose = (ev) => {
            return onclose?.(new UploadCloseEvent(ev));
        };
        this.ws.onerror = (ev) => {
            return onerror?.(new UploadErrorEvent(ev, "WebSocket error"));
        };
    }

    private process(
        file: File,
        on_progress: (event: UploadProgressEvent) => void,
    ) {
        const ws = this.ws;
        const metadata: Metadata = Metadata.create(file);
        ws.send(Metadata.toJSON(metadata));
        let loaded = 0;
        const total = file.size;
        const num_chunks = Math.ceil(total / this.chunkSize);
        for (let i = 0; i < num_chunks; i++) {
            const offset = Math.min(this.chunkSize, total - loaded);
            const start = loaded;
            const end = loaded + offset;
            const chunk = file.slice(start, end);
            ws.send(chunk);
            loaded += offset;
            on_progress(
                new UploadProgressEvent({
                    loaded,
                    total,
                    lengthComputable: true,
                }),
            );
        }
        ws.close();
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

class UploadCloseEvent extends CloseEvent {
    public readonly name = "close";
    constructor(init: CloseEvent) {
        super(namespaced("close"), init);
    }
}

class UploadErrorEvent extends Event {
    public readonly reason: string;
    constructor(reason: string);
    constructor(init: Event, reason: string);
    constructor(init: string | Event, reason?: string) {
        const ev = typeof init === "string" ? undefined : init;
        super(namespaced("error"), ev);
        const e_reason = typeof init === "string" ? init : reason;
        this.reason = e_reason ?? "";
    }
}
