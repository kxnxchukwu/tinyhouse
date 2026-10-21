import { message, notification } from "antd";
0
export const iconColor = "#1890ff";

export const formatListingPrice = (price: number, round= true): string => {
    const formattedListingPrice = round ? Math.round(price / 100) : price / 100;
    return `€${formattedListingPrice}`;
}

export const displaySuccessNotification = (message: string, description?: string) => {
    return notification["success"]({
        message,
        description,
        placement: "topLeft",
        style: {
            marginTop: 50
        }
    });
}

export const displayErrorMessage = (error: string) => {
    return message.error(error);
}