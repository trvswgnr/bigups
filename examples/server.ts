import http from "http";
import BigUps from "../src/server";



const original = http.createServer((_, res) => {
    res.writeHead(200, { "Content-Type": "text/html" }).end(content());
});

const server = BigUps.init(original)
    .upgrade({ path: "/upload" })
    .listen(8080, () => {
        console.log("listening on *:8080");
    });

function content() {
    return `
<!DOCTYPE html>
<html>
    <body>
        <h1>Hello World</h1>
    </body>
</html>`;
}
