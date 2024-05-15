import { IncomingMessage, Server as HTTPServer } from "http";
import { Server as HTTPSServer } from "https";
import WebSocket from "ws";
import { Metadata, ns as shared_ns } from "../shared";
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

export default class<
    S extends HTTPServer<V> | HTTPSServer<V>,
    V extends IncMsg = IncMsg,
> extends EventEmitter<EventMap> {
    private wss: WebSocket.Server<typeof WebSocket, V>;

    constructor(server: S) {
        super();
        this.wss = new WebSocket.Server({ server });
    }

    public start() {
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
}
