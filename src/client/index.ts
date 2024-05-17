import { Metadata, ns } from "../shared";

const NS_PROGRESS = ns("client", "progress");
const DEFAULT_CHUNK_SIZE = 1024 * 1024; // 1MB

// states
declare const Base: unique symbol;
declare const Initialized: unique symbol;
declare const Done: unique symbol;
type Base = typeof Base;
type Initialized = typeof Initialized;
type Done = typeof Done;

class BigUpsClass {
    private ws: WebSocket;
    private chunkSize: number;
    private file: File;

    private constructor(
        urlOrSocket: (string | URL) | WebSocket,
        chunkSize = DEFAULT_CHUNK_SIZE,
    ) {
        this.ws =
            urlOrSocket instanceof WebSocket
                ? urlOrSocket
                : new WebSocket(urlOrSocket);
        this.chunkSize = chunkSize;
        this.file = undefined as any;
    }

    public static init(
        urlOrSocket: (string | URL) | WebSocket,
        chunkSize = DEFAULT_CHUNK_SIZE,
    ) {
        return new BigUpsClass(urlOrSocket, chunkSize);
    }

    public on(event: string, listener: (event: any) => void) {
        if (event === "progress") {
            this.ws.addEventListener(NS_PROGRESS, listener);
            return this;
        }
        this.ws.addEventListener(event, listener);
        return this;
    }

    public upload() {
        return new Promise<BigUps<Done>>((resolve, reject) => {
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
                ws.close(1000, "success");
                resolve(this);
            });
            this.ws.addEventListener("error", reject);
        });
    }

    public cancel() {
        throw new Error("Not implemented");
    }
}

type UploadProgressEventInit = ProgressEventInit & {
    loaded: number;
    total: number;
};

class UploadProgressEvent extends ProgressEvent {
    public readonly progress: number;
    constructor(init: UploadProgressEventInit) {
        super(NS_PROGRESS, init);
        this.progress = (init.loaded / init.total) * 100;
    }
}

type StateMap = {
    [Base]: {
        init: {
            (url: string | URL, chunkSize?: number): BigUps<Initialized>;
            (ws: WebSocket, chunkSize?: number): BigUps<Initialized>;
        };
    };
    [Initialized]: {
        on: {
            (
                event: "progress",
                listener: (event: UploadProgressEvent) => void,
            ): BigUps<Initialized>;
            <E extends keyof WebSocketEventMap>(
                event: E,
                listener: (event: WebSocketEventMap[E]) => void,
            ): BigUps<Initialized>;
        };
        upload: (file: File) => Promise<BigUps<Done>>;
    };
    [Done]: BigUps<Initialized>;
};

type BigUps<State extends keyof StateMap> = StateMap[State];

const BigUps: BigUps<Base> = BigUpsClass;

export default BigUps;
