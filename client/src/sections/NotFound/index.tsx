import React from 'react'
import { Empty, Layout, Typography } from "antd";
import { Link } from 'react-router-dom';

const { Content } = Layout;
const { Text } = Typography;


export const NotFound = () => {
    return (
        <Content className='not-found'>
            <Empty description= {
                <>
                    <Text className='not-found__description-title'>Uh Oh! Something went wrong :( </Text>
                    <Text className='not-found__description-subtitle'>The page you are looking for cannot be found.</Text>
                </>
            }
            />
            <Link to="/" className='not-found__cta ant-btn ant-btn-primary ant-btn-lg'>Go to Home</Link>
        </Content>
    )
};