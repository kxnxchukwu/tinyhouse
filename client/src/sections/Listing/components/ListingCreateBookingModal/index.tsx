import React from "react";
import { Button, Divider, Modal, Typography } from "antd";
import moment,{ Moment } from "moment";
import { KeyOutlined } from '@ant-design/icons';
import { formatListingPrice, displayErrorMessage, displaySuccessNotification} from "../../../../lib/utils";
import { CardElement, injectStripe, ReactStripeElements } from "react-stripe-elements";
import { useMutation } from "@apollo/react-hooks";
import  { CREATE_BOOKING } from "../../../../lib/graphql/mutations";
import { CreateBooking as CreateBookingData, CreateBookingVariables } from "../../../../lib/graphql/mutations/CreateBooking/__generated__/CreateBooking";


interface Props {
    id: string;
    price: number;
    checkInDate: Moment;
    checkOutDate: Moment;
    modalVisible: boolean;
    setModalVisible: (modalVisible: boolean) => void;
    clearBookingData: () => void;
    handleListingRefetch: () => Promise<void>;
}

const { Paragraph, Text, Title } = Typography;

export const ListingCreateBookingModal = ({ id, price, checkInDate, checkOutDate, modalVisible, setModalVisible, stripe, clearBookingData, handleListingRefetch }: Props & ReactStripeElements.InjectedStripeProps) => {
    
    const [createBooking, {loading}] = useMutation<CreateBookingData, CreateBookingVariables>(CREATE_BOOKING, {
        onCompleted: () => {
            clearBookingData();
            displaySuccessNotification(
                "You've successfully booked the listing!",
                "Booking history can always be found in your User page."
            );
        },
        onError: () => {
            displayErrorMessage("Sorry! We weren't able to successfully book the listing. Please try again later!");
        }
    });
    const daysBooked = checkOutDate.diff(checkInDate, "days") + 1;
    const listingPrice = price * daysBooked;
    const tinyHouseFee = 0.10 * listingPrice;
    const totalPrice = listingPrice + tinyHouseFee; 

    const handleCreateBooking = async () => {
        if (!stripe) {
            return displayErrorMessage("Sorry! We weren't able to connect with Stripe!");
        }

        let { token: stripeToken, error } = await stripe.createToken();
        
        if (stripeToken) {
            createBooking({
                variables: {
                    input: {
                        id,
                        source: stripeToken.id,
                        checkIn: moment(checkInDate).format("YYYY-MM-DD"),
                        checkOut: moment(checkOutDate).format("YYYY-MM-DD"),
                    }
                }
            });
        } else {
            displayErrorMessage(error && error.message ? error.message : "Sorry! We weren't able to book the listing. Please, try again later!");
        }
    }
    
    return (
        <Modal
            visible={modalVisible}
            centered
            footer={null}
            onCancel={() => setModalVisible(false)}
        >
            <div className="listing-booking-modal">
                <div className="listing-booking-modal__intro">
                    <Title className="listing-booking-modal__intro-title">
                        <KeyOutlined />
                    </Title>
                    <Title level={3} className="listing-booking-modal__intro-title">
                        Book your trip!
                    </Title>
                    <Paragraph>
                        Enter your payment information to book the listing from the dates between{" "}
                        <Text mark strong>
                            {moment(checkInDate).format("MMMM DD YYYY")}
                        </Text> {" and "}
                        <Text mark strong>
                            {moment(checkOutDate).format("MMMM DD YYYY")}
                        </Text>
                        , inclusive.
                    </Paragraph>
                </div>

                <Divider />

                <div className="listing-booking-modal__charge-summary">
                    <Paragraph>
                        {formatListingPrice(price, false)} * {daysBooked} days = {" "}
                        <Text strong>{formatListingPrice(listingPrice, false)}</Text>
                    </Paragraph>
                    <Paragraph>
                        TinyHouse Fee <sub>∼ 10%</sub> = {" "}
                        <Text strong>{formatListingPrice(tinyHouseFee)}</Text>
                    </Paragraph>
                    <Paragraph className="listing-booking-modal__charge-summary-total">
                        Total = <Text mark>{formatListingPrice(totalPrice)}</Text>
                    </Paragraph>
                </div>

                <Divider />

                <div className="listing-booking-modal__stripe-card-section">
                    <CardElement hidePostalCode className="listing-booking-modal__stripe-card" />
                    <Button size="large" type="primary" className="listing-booking-modal__cta" loading={loading} onClick={handleCreateBooking}>
                        Book
                    </Button>
                </div>

            </div>
        </Modal>
    )
}

export const WrappedListingCreateBookingModal = injectStripe(ListingCreateBookingModal);