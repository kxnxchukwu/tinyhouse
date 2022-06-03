import React, { useEffect, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/react-hooks';
import { Layout, Spin } from 'antd';
import { CONNECT_STRIPE } from '../../lib/graphql/mutations';
import { ConnectStripe as ConnectStripeData, ConnectStripeVariables } from '../../lib/graphql/mutations/ConnectStripe/__generated__/ConnectStripe';
import { Viewer } from '../../lib/types';
import { displaySuccessNotification } from '../../lib/utils';

interface Props {
    viewer: Viewer;
    setViewer: (viewer: Viewer) => void;
}

const { Content } = Layout;

export const Stripe = ({viewer, setViewer}: Props) => {
    const history = useNavigate();
    const [connectStripe, {data, loading, error}] = useMutation<
    ConnectStripeData, 
    ConnectStripeVariables>(CONNECT_STRIPE, {
        onCompleted: data => {
            if (data && data.connectStripe) {
                setViewer({...viewer, hasWallet: data.connectStripe.hasWallet});
                displaySuccessNotification(
                    "You have successfully connected your Stripe Account!",
                    "You can now begin to create Listings in the Host Page."
                );
            }
        }
    });

    const connectStripeRef = useRef(connectStripe);

    useEffect(() => {
        const code = new URL(window.location.href).searchParams.get("code");

        if (code) {
            connectStripeRef.current({
                variables: {
                    input: {code}
                }
            })
        } else {
            history("/login", { replace: true });
        }

    }, [history]);

    if (data && data.connectStripe) {
        return (<Navigate to={`/user/${viewer.id}`}  />)
    }

    if (loading) {
        return (
            <Content className='stripe'>
                <Spin size='large' tip='Connecting your Stripe Account...' />
            </Content>
        )
    }

    if (error) {
        return (<Navigate to={`/user/${viewer.id}?stripe_error=true`}  />)
    }

    return null;

}