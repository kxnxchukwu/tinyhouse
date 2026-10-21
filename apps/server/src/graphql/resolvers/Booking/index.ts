import { IResolvers } from "apollo-server-express";
import { Booking, Listing, Database, User } from "../../../lib/types";
import { CreateBookingArgs } from "./types";
import { Request } from "express";
import { authorize } from "../../../lib/utils";
import { Stripe } from "../../../lib/api";
import { ObjectId, UpdateQuery } from "mongodb";

const MS_PER_DAY = 86400000;
export const MAX_BOOKING_DAYS = 90;

const parseDate = (value: string, label: string): Date => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        throw new Error(`${label} is not a valid date.`);
    }

    return date;
}

// Dot paths into the listing's bookingsIndex (year -> month -> day) for every booked day,
// check-in and check-out inclusive, matching how the client reads the index.
export const bookingsIndexPaths = (checkInDate: Date, checkOutDate: Date): string[] => {
    const paths: string[] = [];
    let dateCursor = checkInDate;

    while (dateCursor <= checkOutDate) {
        const y = dateCursor.getUTCFullYear();
        const m = dateCursor.getUTCMonth();
        const d = dateCursor.getUTCDate();

        paths.push(`bookingsIndex.${y}.${m}.${d}`);
        dateCursor = new Date(dateCursor.getTime() + MS_PER_DAY);
    }

    return paths;
}

export const bookingResolvers: IResolvers = {
    Mutation: {
        createBooking: async (
        _root: undefined,
        { input }: CreateBookingArgs,
        { db, req }: {db: Database, req: Request}
        ): Promise<Booking> => {
            try {
                const { id, source, checkIn, checkOut } = input;

                const viewer = await authorize(db, req);

                if (!viewer) {
                    throw new Error("Viewer cannot be found.");
                }

                const listing = await db.listings.findOne({
                    _id: new ObjectId(id)
                });

                if (!listing) {
                    throw new Error("Listing cannot be found.");
                }

                if (listing.host === viewer._id) {
                    throw new Error("Viewer cannot book own listing.");
                }

                const checkInDate = parseDate(checkIn, "Check In Date");
                const checkOutDate = parseDate(checkOut, "Check Out Date");
                const today = new Date(new Date().toISOString().slice(0, 10));

                if (checkInDate < today) {
                    throw new Error("Check In Date cannot be in the past.");
                }

                if (checkOutDate < checkInDate) {
                    throw new Error("Check Out Date cannot be before Check In Date.")
                }

                const days = (checkOutDate.getTime() - checkInDate.getTime()) / MS_PER_DAY + 1;

                if (days > MAX_BOOKING_DAYS) {
                    throw new Error(`Bookings cannot be longer than ${MAX_BOOKING_DAYS} days.`);
                }

                const totalPrice = listing.price * days;

                const host = await db.users.findOne({
                    _id: listing.host
                });

                if (!host || !host.walletId) {
                    throw new Error(
                        "The Host either could not be found or is not connected with Stripe."
                    );
                }

                // Claim the dates in a single conditional update so two concurrent requests
                // can't both book the same day: only one of them matches the filter.
                const paths = bookingsIndexPaths(checkInDate, checkOutDate);
                const claimRes = await db.listings.updateOne(
                    {
                        _id: listing._id,
                        ...Object.fromEntries(paths.map(path => [path, { $exists: false }]))
                    },
                    { $set: Object.fromEntries(paths.map(path => [path, true])) }
                );

                if (claimRes.modifiedCount !== 1) {
                    throw new Error("Selected dates cannot overlap dates that have already been booked!");
                }

                const bookingId = new ObjectId();

                try {
                    await Stripe.charge(totalPrice, source, host.walletId, bookingId.toHexString());
                } catch (error) {
                    await db.listings.updateOne(
                        { _id: listing._id },
                        // @types/mongodb v3 can't type dot-path keys under TS 5; drop the cast with the driver upgrade.
                        { $unset: Object.fromEntries(paths.map(path => [path, ""])) } as UpdateQuery<Listing>
                    );
                    throw error;
                }

                const insertRes = await db.bookings.insertOne({
                    _id: bookingId,
                    listing: listing._id,
                    tenant: viewer._id,
                    checkIn,
                    checkOut
                });

                const insertedBooking: Booking = insertRes.ops[0];

                await db.users.updateOne(
                    {
                        _id: host._id
                    },
                    // Same @types/mongodb v3 limitation as the $unset above.
                    {
                        $inc: { income: totalPrice }
                    } as unknown as UpdateQuery<User>
                );

                await db.users.updateOne(
                    {
                        _id: viewer._id
                    },
                    {
                        $push: { bookings: insertedBooking._id }
                    }
                );

                await db.listings.updateOne(
                {
                    _id: listing._id
                },
                {
                    $push: { bookings: insertedBooking._id}
                }
                );

                return insertedBooking;

            } catch(error) {
                throw new Error(`Failed to create a booking: ${error}`)
            }
        }
    },
    Booking: {
        id: (booking: Booking): string => {
            return booking._id.toString();
        },
        listing: (booking: Booking, _args: {}, {db}: {db: Database}): Promise<Listing | null>  => {
            return db.listings.findOne({_id: booking.listing})
        },
        tenant: (booking: Booking, _args: {}, { db }: {db: Database}) => {
            return db.users.findOne({ _id: booking.tenant });
        }
    }
};
