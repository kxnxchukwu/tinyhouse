import { describe, expect, it } from "vitest";
import { MAX_PAGE_LIMIT, paginate } from "../src/lib/utils";

describe("paginate", () => {
    it("returns the number of documents to skip", () => {
        expect(paginate(8, 1)).toBe(0);
        expect(paginate(8, 3)).toBe(16);
    });

    it.each([0, -1, 1.5, MAX_PAGE_LIMIT + 1, 100000])("rejects a limit of %s", limit => {
        expect(() => paginate(limit, 1)).toThrow(/Limit must be between/);
    });
});
