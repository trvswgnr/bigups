import { IncomingMessage, Server as HTTPServer } from "http";
import { Server as HTTPSServer } from "https";
import WebSocket from "ws";
import { Metadata, Result, asyncIterable } from "../shared";
import { EventEmitter } from "stream";

type EventMap = {
    metadata: [Metadata];
    chunk: [Buffer];
    start: [];
    error: [Error];
    success: [];
    done: [number, string];
};

type IncMsg = typeof IncomingMessage;

export default class Server<
    S extends HTTPServer<V> | HTTPSServer<V>,
    V extends IncMsg = IncMsg,
> extends EventEmitter<EventMap> {
    private wss: WebSocket.Server<typeof WebSocket, V>;
    private started = false;

    constructor(server: S) {
        super();
        this.wss = new WebSocket.Server({ server });
    }

    public start() {
        if (this.started) {
            return;
        }
        this.started = true;
        this.wss.on("connection", (ws) => {
            this.emit("start");
            ws.on("message", (rawData, isBinary) => {
                if (!isBinary) {
                    const data = Metadata.fromJSON(rawData.toString());
                    this.emit("metadata", data);
                    return;
                }
                if (rawData instanceof Buffer) {
                    this.emit("chunk", rawData);
                    return;
                }
                this.emit(
                    "error",
                    new TypeError("Expected chunk to be a Buffer"),
                );
            });

            ws.on("close", (code, reason) => {
                if (code === 1000) {
                    this.emit("success");
                } else {
                    this.emit(
                        "error",
                        new RangeError(
                            `WebSocket closed with code ${code} (expected 1000)`,
                        ),
                    );
                }
                this.emit("done", code, reason.toString());
            });

            ws.on("error", (err) => this.emit("error", err));
        });
    }

    public metadata() {
        const promise = new Result<Metadata, Error>((resolve, reject) => {
            // if the client doesn't send metadata in 5 seconds, something's probably wrong
            setTimeout(() => reject(new Error("timed out")), 5000);
            this.on("metadata", resolve);
            this.on("error", reject);
            this.on("done", () => reject(new Error("already done")));
        });
        this.start();
        return promise;
    }

    public chunks() {
        const iter = asyncIterable(async () => {
            return await this.get_next_chunk().catch((e) => e);
        });
        this.start();
        return iter;
    }

    private get_next_chunk() {
        return new Result<Buffer, Error>((resolve, reject) => {
            // if the client doesn't send a chunk in 5 seconds, something's probably wrong
            setTimeout(() => reject(new Error("timed out")), 5000);
            this.on("chunk", resolve);
            this.on("error", reject);
            this.on("done", () => reject(new Error("already done")));
        });
    }
}
