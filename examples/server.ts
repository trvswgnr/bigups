import http from "http";
import fs from "fs";
import path from "path";
import BigUps from "../src/server";

export default async function main() {
    const original = http.createServer((req, res) => {
        const url = new URL(unwrap(req.url), `http://${req.headers.host}`);
        const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
        const filepath = path.join(__dirname, pathname);
        if (!fs.existsSync(filepath)) {
            res.writeHead(404, { "Content-Type": "text/plain" }).end(
                "Not Found",
            );
            return;
        }
        const content = fs.readFileSync(filepath);
        const mimetype = getMimeType(filepath);
        res.writeHead(200, { "Content-Type": mimetype }).end(content);
    });

    const server = BigUps.init(original)
        .upgrade()
        .on("metadata", (metadata) => console.log("metadata", metadata))
        .on("start", () => console.log("start"))
        .on("chunk", (chunk) => console.log("chunk", chunk))
        .on("success", () => console.log("success"))
        .on("done", (code, reason) => console.log("done", code, reason))
        .on("error", (error) => console.error("error", error))
        .listen(3000, () => {
            console.log("listening on http://localhost:3000");
        });

    return server;
}

function getMimeType(filepath: string) {
    const ext = path.extname(filepath);
    switch (ext) {
        case ".html":
            return "text/html";
        case ".css":
            return "text/css";
        case ".js":
            return "application/javascript";
        default:
            return "text/plain";
    }
}

function unwrap<T>(value: T): NonNullable<T> {
    if (value === null || value === undefined) {
        throw new Error("Called unwrap on a null or undefined value");
    }
    return value;
}
