import { describe, it, expect } from "bun:test";
import { ns } from "./shared";

describe("ns", () => {
    it("works with a string", () => {
        expect(ns("foo")).toEqual("bigups:foo");
    });
    it("works with multiple strings", () => {
        expect(ns("foo", "bar")).toEqual("bigups:foo:bar");
    });
    it("works with a template string", () => {
        expect(ns`foo:bar`).toEqual("bigups:foo:bar");
    });
});
