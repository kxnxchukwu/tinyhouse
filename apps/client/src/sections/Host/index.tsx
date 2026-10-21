import React, { useState } from "react";
import { useMutation } from "@apollo/react-hooks";
import {
  Button,
  Form,
  Layout,
  Input,
  InputNumber,
  message,
  Radio,
  Typography,
  Upload,
} from "antd";
import { Viewer } from "../../lib/types";
import { Link, Navigate } from "react-router-dom";
import { UploadChangeParam } from "antd/lib/upload";
import {
  iconColor,
  displayErrorMessage,
  displaySuccessNotification,
} from "../../lib/utils";
import {
  HomeOutlined,
  BankOutlined,
  LoadingOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { ListingType } from "../../lib/graphql/globalTypes";
import { HOST_LISTING } from "../../lib/graphql/mutations";
import {
  HostListing as HostListingData,
  HostListingVariables,
} from "../../lib/graphql/mutations/HostListing/__generated__/HostListing";
import { useScrollToTop } from '../../lib/hooks';

interface Props {
  viewer: Viewer;
}

const { Content } = Layout;

const { Text, Title } = Typography;

const { Item } = Form;

export const Host = ({ viewer }: Props) => {
  const [form] = Form.useForm();
  const [imageLoading, setImageLoading] = useState(false);
  const [imageBase64Value, setImageBase64Value] = useState<string | null>(null);

  const [hostListing, { loading, data }] = useMutation<
    HostListingData,
    HostListingVariables
  >(HOST_LISTING, {
    onCompleted: () => {
      displaySuccessNotification("You've successfully created your listing!");
    },
    onError: () => {
      displayErrorMessage(
        "Sorry! We weren't able to create your listing. Please try again later."
      );
    },
  });

  useScrollToTop();

  const dummyRequest = ({ file, onSuccess }: any) => {
    setTimeout(() => {
      onSuccess("ok");
    }, 1500);
  };

  const handleImageUpload = (info: UploadChangeParam) => {
    const { file } = info;

    if (file.status === "uploading") {
      setImageLoading(true);
      message.info(`${info.file.name} is uploading.`);
      return;
    }

    if (file.status === "done" && file.originFileObj) {
        getBase64Value(file.originFileObj, imageBase64Value => {
          setImageBase64Value(imageBase64Value);
          setImageLoading(false);
        });
    }

    if (info.file.status === 'error') {
        displayErrorMessage(`${info.file.name} file upload failed.`);
    }
  };

  const handleHostListing = (values: any) => {
    const fullAddress = `${values.address}, ${values.city}, ${values.state}, ${values.postalCode}`;

    const input = {
      ...values,
      address: fullAddress,
      image: imageBase64Value,
      price: values.price * 100,
    };
    delete input.city;
    delete input.state;
    delete input.postalCode;

    hostListing({
      variables: {
        input,
      },
    });
  };

  if (!viewer.id || !viewer.hasWallet) {
    return (
      <Content className="host-content">
        <div className="host__form-header">
          <Title level={4} className="host__form-title">
            You'll have to be signed in and connected with Stripe to host a
            listing!
          </Title>
          <Text type="secondary">
            We only allow users who have signed in to o ur application and have
            connected with Stripe to host new listings. You can sign in at the{" "}
            <Link to="/login">/login</Link> page and connect with Stripe shortly
            after.
          </Text>
        </div>
      </Content>
    );
  }

  if (loading) {
    return (
      <Content className="host-content">
        <div className="host__form-header">
          <Title level={3} className="host__form-title">
            Please wait!
          </Title>
          <Text type="secondary">We're creating your listing now.</Text>
        </div>
      </Content>
    );
  }

  if (data && data.hostListing) {
    return <Navigate to={`/listing/${data.hostListing.id}`} />;
  }

  return (
    <Content className="host-content">
      <Form form={form} layout="vertical" onFinish={handleHostListing}>
        <div className="host__form-header">
          <Title level={3} className="host__form-title">
            Hi! Let's get started listing your place.
          </Title>
          <Text type="secondary">
            In this form, we will collect some basic and addditional information
            about your listing.
          </Text>
        </div>

        <Item
          label="House Type"
          name="type"
          rules={[{ required: true, message: "Please select a home type!" }]}
        >
          <Radio.Group>
            <Radio.Button value={ListingType.APARTMENT}>
              <BankOutlined style={{ color: iconColor }} />{" "}
              <span>Apartment</span>
            </Radio.Button>
            <Radio.Button value={ListingType.HOUSE}>
              <HomeOutlined style={{ color: iconColor }} /> <span>House</span>
            </Radio.Button>
          </Radio.Group>
        </Item>

        <Item
          label="Max number of Guests"
          name="numOfGuests"
          rules={[
            {
              required: true,
              message: "Please enter the maximum number of guests!",
            },
          ]}
        >
          <InputNumber min={1} placeholder="4" />
        </Item>

        <Item
          label="Title"
          extra="Max Character count of 50"
          name="title"
          rules={[
            {
              required: true,
              message: "Please enter a title for your listing!",
            },
          ]}
        >
          <Input
            maxLength={50}
            placeholder="The Iconic and Luxurious Bel-Air Mansion"
          />
        </Item>

        <Item
          label="Description of Listing"
          extra="Max Character count of 500"
          name="description"
          rules={[
            {
              required: true,
              message: "Please enter a description for your listing!",
            },
          ]}
        >
          <Input.TextArea
            rows={3}
            maxLength={400}
            placeholder="Modern, clean, and iconic home of the Fresh Prince. Situated in the heart of Bel-Air, Los Angeles"
          />
        </Item>

        <Item
          label="Address"
          name="address"
          rules={[
            {
              required: true,
              message: "Please enter an address for your listing!",
            },
          ]}
        >
          <Input placeholder="251 North Bristol Avenue" />
        </Item>

        <Item
          label="City / Town"
          name="city"
          rules={[
            {
              required: true,
              message: "Please enter a City, Region or Town for your listing!",
            },
          ]}
        >
          <Input placeholder="Los Angeles" />
        </Item>

        <Item
          label="State / Province"
          name="state"
          rules={[
            {
              required: true,
              message: "Please enter a State or Province for your listing!",
            },
          ]}
        >
          <Input placeholder="California" />
        </Item>

        <Item
          label="Zip / Postal Code"
          name="postalCode"
          rules={[
            {
              required: true,
              message: "Please enter a zip or postal code for your listing!",
            },
          ]}
        >
          <Input placeholder="Please enter the zip or postal code for your listing" />
        </Item>

        <Item
          label="Image"
          extra="Images have to be under 1MB in size and of type JPG or PNG"
          name="image"
          rules={[
            {
              required: true,
              message: "Please provide an image for your listing!",
            },
          ]}
        >
          <div className="host__form-image-upload">
            <Upload
              name="image"
              listType="picture-card"
              headers= {{authorization: 'authorization-text'}}
              showUploadList={false}
              customRequest={dummyRequest}
              beforeUpload={beforeImageUpload}
              onChange={handleImageUpload}
              progress={{
                    strokeColor: {
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    },
                    strokeWidth: 3,
                    format: (percent) => percent && `${parseFloat(percent.toFixed(2))}%`,
              }}
            >
              {imageBase64Value ? (
                <img src={imageBase64Value} alt="Listing" />
              ) : (
                <div>
                  {imageLoading ? <LoadingOutlined /> : <PlusOutlined />}
                  <div className="ant-upload-text">Upload</div>
                </div>
              )}
            </Upload>
          </div>
        </Item>

        <Item
          label="Price"
          extra="All prices in €EUR / day"
          name="price"
          rules={[
            {
              required: true,
              message: "Please enter a price for your listing!",
            },
          ]}
        >
          <InputNumber min={0} placeholder="120" />
        </Item>

        <Item>
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
        </Item>
      </Form>
    </Content>
  );
};

const beforeImageUpload = (file: File) => {
  const fileIsValidImage =
    file.type === "image/jpeg" || file.type === "image/png";
  const fileIsValidSize = file.size / 1024 / 1024 < 1;

  if (!fileIsValidImage) {
    displayErrorMessage("You are only able to upload valid JPG or PNG files!");
    return false;
  }

  if (!fileIsValidSize) {
    displayErrorMessage(
      "You are only able to upload valid image files of under 1MB in size"
    );
    return false;
  }

  return fileIsValidImage && fileIsValidSize;
};

const getBase64Value = (
  img: File | Blob,
  callback: (imageBase64Value: string) => void
) => {
  const reader = new FileReader();
  reader.readAsDataURL(img);
  reader.onload = () => {
    callback(reader.result as string);
  };
};