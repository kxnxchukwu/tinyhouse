import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Request } from "express";
import { Stripe } from "../src/lib/api";
import { bookingResolvers, MAX_BOOKING_DAYS } from "../src/graphql/resolvers/Booking";
import { Database, Listing, User } from "../src/lib/types";
import { buildListing, buildUser, fakeRequest, requestAs, startDatabase } from "./helpers";

vi.mock("../src/lib/api", () => ({
    Stripe: { charge: vi.fn() },
    Google: {},
    Cloudinary: {}
}));

const createBooking = (bookingResolvers.Mutation as Record<string, unknown>).createBooking as (
    root: undefined,
    args: { input: { id: string; source: string; checkIn: string; checkOut: string } },
    context: { db: Database; req: Request }
) => Promise<unknown>;

describe("createBooking", () => {
    let database: Awaited<ReturnType<typeof startDatabase>>;
    let db: Database;
    let host: User;
    let tenant: User;
    let listing: Listing;

    const book = (checkIn: string, checkOut: string, as: User = tenant) =>
        createBooking(
            undefined,
            { input: { id: listing._id.toHexString(), source: "tok_visa", checkIn, checkOut } },
            { db, req: requestAs(as) }
        );

    beforeAll(async () => {
        database = await startDatabase();
        db = database.db;
    });

    afterAll(() => database.stop());

    beforeEach(async () => {
        vi.useFakeTimers({ toFake: ["Date"] });
        vi.setSystemTime(new Date("2030-01-01T12:00:00Z"));
        vi.mocked(Stripe.charge).mockReset().mockResolvedValue(undefined);

        await database.reset();
        host = buildUser({ walletId: "acct_host" });
        tenant = buildUser();
        listing = buildListing(host._id);
        await db.users.insertMany([host, tenant]);
        await db.listings.insertOne(listing);
    });

    it("charges the host's connected account for every booked day", async () => {
        await book("2030-02-01", "2030-02-03");

        const [booking] = await db.bookings.find().toArray();
        expect(Stripe.charge).toHaveBeenCalledWith(
            30000,
            "tok_visa",
            "acct_host",
            booking._id.toHexString()
        );
        expect((await db.users.findOne({ _id: host._id }))!.income).toBe(30000);
        expect((await db.listings.findOne({ _id: listing._id }))!.bookingsIndex).toEqual({
            2030: { 1: { 1: true, 2: true, 3: true } }
        });
    });

    it("does not record the booking or hold the dates when the charge fails", async () => {
        vi.mocked(Stripe.charge).mockRejectedValue(new Error("card_declined"));

        await expect(book("2030-02-01", "2030-02-03")).rejects.toThrow(/card_declined/);

        expect(await db.bookings.countDocuments()).toBe(0);
        expect((await db.users.findOne({ _id: host._id }))!.income).toBe(0);
        const stored = (await db.listings.findOne({ _id: listing._id }))!;
        expect(stored.bookings).toEqual([]);
        await expect(book("2030-02-01", "2030-02-03")).rejects.toThrow(/card_declined/);
        expect(Stripe.charge).toHaveBeenCalledTimes(2);
    });

    it("lets only one of two concurrent overlapping bookings through", async () => {
        const results = await Promise.allSettled([
            book("2030-02-01", "2030-02-05"),
            book("2030-02-04", "2030-02-08")
        ]);

        expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
        expect(Stripe.charge).toHaveBeenCalledTimes(1);
        expect(await db.bookings.countDocuments()).toBe(1);
    });

    it("rejects dates that overlap an existing booking without charging", async () => {
        await book("2030-02-01", "2030-02-03");

        await expect(book("2030-02-03", "2030-02-04")).rejects.toThrow(/overlap/);
        expect(Stripe.charge).toHaveBeenCalledTimes(1);
    });

    it("rejects a host booking their own listing", async () => {
        await expect(book("2030-02-01", "2030-02-03", host)).rejects.toThrow(/own listing/);
    });

    it("rejects requests without a valid CSRF token", async () => {
        const req = fakeRequest({ viewer: tenant._id }, { "X-CSRF-TOKEN": "wrong" });
        const input = { id: listing._id.toHexString(), source: "tok_visa", checkIn: "2030-02-01", checkOut: "2030-02-02" };

        await expect(createBooking(undefined, { input }, { db, req })).rejects.toThrow(/Viewer cannot be found/);
    });

    it.each([
        ["check in in the past", "2029-12-30", "2030-01-02", /in the past/],
        ["check out before check in", "2030-02-05", "2030-02-01", /before Check In/],
        ["an invalid date", "not-a-date", "2030-02-01", /not a valid date/],
        ["a stay over the maximum", "2030-02-01", "2030-06-01", new RegExp(`${MAX_BOOKING_DAYS} days`)]
    ])("rejects %s", async (_case, checkIn, checkOut, message) => {
        await expect(book(checkIn, checkOut)).rejects.toThrow(message);
        expect(Stripe.charge).not.toHaveBeenCalled();
    });
});
