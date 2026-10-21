import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Request, Response } from "express";
import { Google, Stripe } from "../src/lib/api";
import { viewerResolvers } from "../src/graphql/resolvers/Viewer";
import { Database } from "../src/lib/types";
import { buildUser, fakeRequest, fakeResponse, requestAs, startDatabase } from "./helpers";

vi.mock("../src/lib/api", () => ({
    Google: {
        authUrl: vi.fn((state: string) => `https://accounts.google.com/o/oauth2?state=${state}`),
        logIn: vi.fn()
    },
    Stripe: { disconnect: vi.fn() },
    Cloudinary: {}
}));

type Context = { db: Database; req: Request; res: Response };
const query = viewerResolvers.Query as Record<string, (root: undefined, args: object, context: Context) => unknown>;
const mutation = viewerResolvers.Mutation as Record<string, (root: undefined, args: object, context: Context) => Promise<unknown>>;

const googleProfile = {
    user: {
        names: [{ displayName: "Ada", metadata: { source: { id: "google-123" } } }],
        photos: [{ url: "https://example.com/ada.png" }],
        emailAddresses: [{ value: "ada@example.com" }]
    }
};

describe("viewer auth", () => {
    let database: Awaited<ReturnType<typeof startDatabase>>;
    let db: Database;

    beforeAll(async () => {
        database = await startDatabase();
        db = database.db;
    });

    afterAll(() => database.stop());

    beforeEach(async () => {
        vi.clearAllMocks();
        vi.mocked(Google.logIn).mockResolvedValue(googleProfile as Awaited<ReturnType<typeof Google.logIn>>);
        await database.reset();
    });

    it("binds the Google auth URL to a state stored in a signed, httpOnly cookie", () => {
        const res = fakeResponse();

        const url = query.authUrl(undefined, {}, { db, req: fakeRequest(), res }) as string;

        const [name, state, options] = res.cookie.mock.calls[0];
        expect(name).toBe("oauth_state");
        expect(state).toMatch(/^[0-9a-f]{32}$/);
        expect(options).toMatchObject({ httpOnly: true, signed: true });
        expect(url).toContain(`state=${state}`);
    });

    it("logs in when the callback state matches the cookie", async () => {
        const res = fakeResponse();
        const req = fakeRequest({ oauth_state: "abc" });

        const viewer = await mutation.logIn(undefined, { input: { code: "code", state: "abc" } }, { db, req, res });

        expect(viewer).toMatchObject({ _id: "google-123", didRequest: true });
        expect(res.clearCookie).toHaveBeenCalledWith("oauth_state", expect.anything());
        expect(res.cookie).toHaveBeenCalledWith("viewer", "google-123", expect.objectContaining({ httpOnly: true }));
    });

    it.each([
        ["a mismatched state", { oauth_state: "abc" }, "evil"],
        ["no state cookie", {}, "abc"]
    ])("rejects a Google callback with %s", async (_case, cookies, state) => {
        const res = fakeResponse();

        await expect(
            mutation.logIn(undefined, { input: { code: "code", state } }, { db, req: fakeRequest(cookies), res })
        ).rejects.toThrow(/state does not match/);

        expect(Google.logIn).not.toHaveBeenCalled();
        expect(res.cookie).not.toHaveBeenCalled();
    });

    it("revokes the Stripe connection when disconnecting", async () => {
        const user = buildUser({ walletId: "acct_123" });
        await db.users.insertOne(user);

        const viewer = await mutation.disconnectStripe(undefined, {}, { db, req: requestAs(user), res: fakeResponse() });

        expect(Stripe.disconnect).toHaveBeenCalledWith("acct_123");
        expect(viewer).toMatchObject({ walletId: undefined });
        expect(await db.users.findOne({ _id: user._id })).not.toHaveProperty("walletId");
    });
});
