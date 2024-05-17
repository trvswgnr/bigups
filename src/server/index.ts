import { Server as HTTPServer, ServerResponse, IncomingMessage } from "http";
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

type TIncomingMessage = typeof IncomingMessage;
type TServerResponse = typeof ServerResponse;
type TWebSocket = typeof WebSocket;

type NodeServer<T extends TIncomingMessage, S extends TServerResponse> =
    | HTTPServer<T, S>
    | HTTPSServer<T, S>;

type WebSocketOptions<
    Ws extends TWebSocket,
    Request extends TIncomingMessage,
> = Omit<WebSocket.ServerOptions<Ws, Request>, "server">;

// states
const Base = Symbol("Base");
type Base = typeof Base;
const Initialized = Symbol("Initialized");
type Initialized = typeof Initialized;
const Upgraded = Symbol("Upgraded");
type Upgraded = typeof Upgraded;
const Listening = Symbol("Listening");
type Listening = typeof Listening;

class BigUpsClass<
    TMsg extends TIncomingMessage,
    TRes extends TServerResponse,
    TSocket extends TWebSocket,
    TServer extends NodeServer<TMsg, TRes>,
> extends EventEmitter<EventMap> {
    private started = false;
    private wss?: WebSocket.Server<TSocket, TMsg>;
    private server: TServer;

    private constructor(server: TServer) {
        super();
        this.server = server;
    }

    public static init<
        T extends TIncomingMessage,
        R extends TServerResponse,
        S extends HTTPServer<T, R> | HTTPSServer<T, R>,
    >(server: S) {
        return new BigUpsClass(server);
    }

    public upgrade<T extends TSocket>(options?: WebSocketOptions<T, TMsg>) {
        this.wss = new WebSocket.Server({
            server: this.server,
            ...options,
        });
        this.start();
        return this;
    }

    public listen(port: number, listener: () => void) {
        this.server = this.server.listen(port, listener) as TServer;
        return this.server;
    }

    private start() {
        if (this.started) {
            return;
        }
        this.started = true;
        this.wss!.on("connection", (ws) => {
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

type BigUps<
    State extends keyof StateMap<Request, Response, Server, Ws>,
    Request extends TIncomingMessage = never,
    Response extends TServerResponse = never,
    Server extends NodeServer<Request, Response> = never,
    Ws extends TWebSocket = never,
> = StateMap<Request, Response, Server, Ws>[State];

interface StateMap<
    TMsg extends TIncomingMessage,
    TRes extends TServerResponse,
    TServer extends NodeServer<TMsg, TRes>,
    TSocket extends TWebSocket,
> {
    [Base]: {
        init: <
            T extends TIncomingMessage,
            R extends TServerResponse,
            S extends HTTPServer<T, R> | HTTPSServer<T, R>,
        >(
            server: S,
        ) => BigUps<Initialized, T, R, S>;
    };
    [Initialized]: {
        upgrade: <T extends TWebSocket>(
            options?: WebSocketOptions<T, TMsg>,
        ) => BigUps<Upgraded, TMsg, TRes, TServer, T>;
    };
    [Upgraded]: {
        listen: (
            port: number,
            listener: () => void,
        ) => BigUps<Listening, TMsg, TRes, TServer, TSocket>;
    };
    [Listening]: TServer;
}

const BigUps: BigUps<Base> = BigUpsClass;

export default BigUps;
