import React from "react";
import { Card, List, Skeleton, Typography } from "antd";

import listingLoadingCardCover from "../../assets/listing-loading-card-cover.jpg";

interface Props {
  title: string;
}

const { Title } = Typography;

export const HomeListingsSkeleton = ({ title }: Props) => {
  const emptyData = [{}, {}, {}, {}];

  return (
    <div className="home-listings-skeleton">
      <Title level={4} className="home-listings__title">
        {title}
      </Title>
      <Skeleton paragraph={{ rows: 0 }} />
      <List
        grid={{
          gutter: 8,
          xs: 1,
          sm: 2,
          lg: 4
        }}
        dataSource={emptyData}
        renderItem={() => (
          <List.Item>
            <Card
              cover={
                <div
                  style={{ backgroundImage: `url(${listingLoadingCardCover})` }}
                  className="home-listings-skeleton__card-cover-img"
                ></div>
              }
              loading
            />
          </List.Item>
        )}
      />
    </div>
  );
};
