import path from "path";
import chokidar from "chokidar";

const entrypoints = [path.join(__dirname, "client.ts")];
export default async function main() {
    await build();
    const watcher = chokidar.watch(entrypoints, { ignoreInitial: true });
    watcher.on("change", async (p) => {
        console.log(
            `File ${p.replace(process.cwd(), ".")} changed. Rebuilding...`,
        );
        await build();
    });
}

async function build() {
    return await Bun.build({
        entrypoints,
        outdir: path.join(__dirname, "dist"),
    }).then(({ outputs }) =>
        console.log(
            "built",
            outputs.map((o) => o.path.replace(process.cwd(), ".")).join("\n"),
        ),
    );
}
