export const NAMESPACE = "chonky";
export type NAMESPACE = typeof NAMESPACE;
export type Namespaced<T extends string> = `${NAMESPACE}:${T}`;

export type Metadata = {
    filename: string;
    size: number;
};

export namespace Metadata {
    export function create(file: File): Metadata {
        return {
            filename: file.name,
            size: file.size,
        };
    }

    export function fromJSON(json: string): Metadata {
        const x = JSON.parse(json) as unknown;
        if (
            isObjectWithKeyOfType(x, "filename", "string") &&
            isObjectWithKeyOfType(x, "size", "number")
        ) {
            return x;
        }
        throw new Error("Invalid Metadata JSON");
    }

    export function toJSON(metadata: Metadata): string {
        return JSON.stringify(metadata);
    }
}

function isObject(x: unknown): x is Record<PropertyKey, unknown> {
    return typeof x === "object" && x !== null;
}

type PrimitiveMap = {
    string: string;
    number: number;
    boolean: boolean;
    symbol: symbol;
    bigint: bigint;
    undefined: undefined;
    null: null;
    object: Record<PropertyKey, unknown>;
};

export function isObjectWithKeyOfType<
    K extends string,
    T extends keyof PrimitiveMap,
>(x: unknown, key: K, type: T): x is Record<K, PrimitiveMap[T]> {
    if (!isObject(x) || !(key in x)) {
        return false;
    }
    if (type === "object") {
        return isObject(x[key]);
    }
    return typeof x[key] === type;
}

export function is_function<A extends readonly any[], R>(
    x: unknown,
): x is (...args: A) => R {
    return typeof x === "function";
}

export function is_nullish(x: unknown): x is null | undefined {
    return x === null || x === undefined;
}

export function namespaced<T extends string>(x: T): Namespaced<T> {
    return `${NAMESPACE}:${x}`;
}

export function noop(..._: any[]) {}
