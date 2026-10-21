import { Request } from "express";
import { Database, User } from "../types";

export const authorize = async (
    db: Database,
    req: Request
): Promise<User | null> => {
    const token = req.get("X-CSRF-TOKEN");
    const viewer = await db.users.findOne({
        _id: req.signedCookies.viewer,
        token
    })

    return viewer;
}

export const MAX_PAGE_LIMIT = 50;

// Returns how many documents to skip, rejecting page sizes a client could use to dump a collection.
export const paginate = (limit: number, page: number): number => {
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_LIMIT) {
        throw new Error(`Limit must be between 1 and ${MAX_PAGE_LIMIT}.`);
    }

    return page > 0 ? (page - 1) * limit : 0;
}
