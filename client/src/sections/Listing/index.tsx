import React, {useState} from 'react';
import {useParams} from 'react-router-dom';
import { useQuery } from '@apollo/react-hooks';
import { LISTING } from "../../lib/graphql/queries";
import { Listing as ListingData, ListingVariables } from '../../lib/graphql/queries/Listing/__generated__/Listing';
import { ErrorBanner, PageSkeleton } from '../../lib/components';
import { Col, Layout, Row  } from 'antd';
import { ListingBookings, ListingCreateBooking, WrappedListingCreateBookingModal as ListingCreateBookingModal, ListingDetails } from './components';
import { Moment } from 'moment';
import { Viewer } from '../../lib/types';
import { useScrollToTop } from '../../lib/hooks';

interface Props {
    viewer: Viewer
}

const PAGE_LIMIT = 3;
const {Content} = Layout;

export const Listing = ({viewer}: Props) => {
    let {id} = useParams<{id: string}>();
    const [bookingsPage, setBookingsPage] = useState(1);
    const [checkInDate, setCheckInDate] = useState<Moment | null>(null);
    const [checkOutDate, setCheckOutDate] = useState<Moment | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    id !== undefined ? id : id = "";

    const {loading, data, error, refetch} = useQuery<ListingData, ListingVariables>(LISTING, {
        variables: {
            id: id,
            bookingsPage,
            limit: PAGE_LIMIT,
        }
    });

    useScrollToTop();

    const clearBookingData = () => {
        setModalVisible(false);
        setCheckInDate(null);
        setCheckOutDate(null);
    }

    const handleListingRefetch = async () => {
        await refetch();
    }

    if (loading) {
        return (
            <Content className="listings">
                <PageSkeleton />
            </Content>
        );
    }

    if (error) {
        return (
            <Content>
                <ErrorBanner description="This listing may not exist or we've encountered an error. Please try again soon!"/>
                <PageSkeleton />
            </Content>
        )
    }

    const listing = data ? data.listing : null;
    const listingBookings = listing ? listing.bookings : null;

    const listingDetailsElement = listing ? (
        <ListingDetails listing={listing} />
    ) : null;

    const listingBookingsElement = listingBookings ? (
        <ListingBookings
            listingBookings={listingBookings}
            bookingsPage={bookingsPage}
            limit={PAGE_LIMIT}
            setBookingsPage={setBookingsPage}
        />
    ) : null;

    const listingCreateBookingElement = listing ? (
    <ListingCreateBooking
    viewer={viewer}
    host={listing.host}
    bookingsIndex={listing.bookingsIndex}
    price={listing.price}
    checkInDate={checkInDate}
    checkOutDate={checkOutDate}
    setCheckInDate={setCheckInDate}
    setCheckOutDate={setCheckOutDate}
    setModalVisible = {setModalVisible}
    />) : null;

    const listingCreateBookingModalElement = listing && checkInDate && checkOutDate ? (
    	<ListingCreateBookingModal
        id={listing.id}
        price={listing.price}
        checkInDate={checkInDate}
        checkOutDate={checkOutDate}
        modalVisible = {modalVisible}
        setModalVisible = {setModalVisible}
        clearBookingData = {clearBookingData}
        handleListingRefetch= {handleListingRefetch}
        />
    ) : null;

    return <Content className='listings'>
            <Row gutter={24} justify="space-between">
                <Col xs={24} lg={14}>
                    {listingDetailsElement}
                    {listingBookingsElement}
                </Col>
                <Col xs={24} lg={10}>
                    {listingCreateBookingElement}
                </Col>
            </Row>
            {listingCreateBookingModalElement}
        </Content>;
};