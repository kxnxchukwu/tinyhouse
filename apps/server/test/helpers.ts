import { Request, Response } from "express";
import { MongoClient, ObjectId } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import { vi } from "vitest";
import { Database, Listing, ListingType, User } from "../src/lib/types";

export const startDatabase = async () => {
    const server = await MongoMemoryServer.create();
    const client = await MongoClient.connect(server.getUri(), {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
    const mongo = client.db("test");
    const db: Database = {
        bookings: mongo.collection("bookings"),
        listings: mongo.collection("listings"),
        users: mongo.collection("users")
    };

    return {
        db,
        reset: () => mongo.dropDatabase(),
        stop: async () => {
            await client.close();
            await server.stop();
        }
    };
};

export const buildUser = (overrides: Partial<User> = {}): User => ({
    _id: new ObjectId().toHexString(),
    token: "csrf-token",
    name: "Test User",
    avatar: "https://example.com/avatar.png",
    contact: "test@example.com",
    income: 0,
    bookings: [],
    listings: [],
    ...overrides
});

export const buildListing = (host: string, overrides: Partial<Listing> = {}): Listing => ({
    _id: new ObjectId(),
    title: "Tiny house",
    description: "A tiny house",
    image: "https://example.com/house.png",
    host,
    type: ListingType.House,
    address: "1 Main St",
    country: "Ireland",
    admin: "Dublin",
    city: "Dublin",
    bookings: [],
    bookingsIndex: {},
    price: 10000,
    numOfGuests: 2,
    ...overrides
});

// A request carrying the signed viewer cookie and matching CSRF header that `authorize` checks.
export const fakeRequest = (
    signedCookies: Record<string, string> = {},
    headers: Record<string, string> = {}
): Request => ({
    signedCookies,
    get: (name: string) => headers[name]
}) as unknown as Request;

export const requestAs = (user: User): Request =>
    fakeRequest({ viewer: user._id }, { "X-CSRF-TOKEN": user.token });

export const fakeResponse = () => ({
    cookie: vi.fn(),
    clearCookie: vi.fn()
}) as unknown as Response & { cookie: ReturnType<typeof vi.fn>; clearCookie: ReturnType<typeof vi.fn> };
