interface BookingIndexMonth {
    [key: string]: boolean;
}

interface BookingsIndexYear {
    [key: string]: BookingIndexMonth;
}

export interface BookingsIndex {
    [key: string]: BookingsIndexYear;
}