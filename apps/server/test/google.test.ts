import { describe, expect, it, vi } from "vitest";

const instances: { setCredentials: ReturnType<typeof vi.fn> }[] = [];

vi.mock("googleapis", () => ({
    google: {
        auth: {
            OAuth2: vi.fn().mockImplementation(() => {
                const instance = {
                    generateAuthUrl: vi.fn(() => "https://accounts.google.com"),
                    getToken: vi.fn(async (code: string) => ({ tokens: { access_token: code } })),
                    setCredentials: vi.fn()
                };
                instances.push(instance);
                return instance;
            })
        },
        people: vi.fn(() => ({ people: { get: vi.fn(async () => ({ data: {} })) } }))
    }
}));

vi.mock("@google/maps", () => ({ createClient: vi.fn() }));

describe("Google.logIn", () => {
    it("uses a separate OAuth client per login so concurrent users never share credentials", async () => {
        const { Google } = await import("../src/lib/api/Google");

        await Promise.all([Google.logIn("alice"), Google.logIn("bob")]);

        const credentialed = instances.filter(i => i.setCredentials.mock.calls.length > 0);
        expect(credentialed).toHaveLength(2);
        expect(credentialed.map(i => i.setCredentials.mock.calls)).toEqual([
            [[{ access_token: "alice" }]],
            [[{ access_token: "bob" }]]
        ]);
    });
});
