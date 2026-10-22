import { MockedProvider, MockedResponse } from "@apollo/client/testing";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { Home } from "../index";
import { LISTINGS } from "../../../lib/graphql/queries";
import { ListingsFilter } from "../../../lib/graphql/globalTypes";
import { routerFuture } from "../../../lib/router";

const listingsRequest = {
  query: LISTINGS,
  variables: {
    filter: ListingsFilter.PRICE_HIGH_TO_LOW,
    limit: 4,
    page: 1
  }
};

const listingsSuccess: MockedResponse = {
  request: listingsRequest,
  result: {
    data: {
      listings: {
        __typename: "Listings",
        region: null,
        total: 10,
        result: [
          {
            __typename: "Listing",
            id: "1234",
            title: "Bev. Hills",
            image: "image.png",
            address: "90210 Bev. Hills",
            price: 9000,
            numOfGuests: 5
          }
        ]
      }
    }
  }
};

const LocationDisplay = () => <div data-testid="location">{useLocation().pathname}</div>;

const renderHome = (mocks: MockedResponse[] = [listingsSuccess]) =>
  render(
    <MockedProvider mocks={mocks}>
      <MemoryRouter initialEntries={["/"]} future={routerFuture}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/listings/:location" element={<div>Listings page</div>} />
        </Routes>
        <LocationDisplay />
      </MemoryRouter>
    </MockedProvider>
  );

const search = (value: string) => {
  const input = screen.getByPlaceholderText("Search 'San Fransisco'");
  fireEvent.change(input, { target: { value } });
  fireEvent.keyDown(input, { key: "Enter", keyCode: 13 });
};

describe("Home", () => {
  describe("search input", () => {
    it("renders empty on first render", () => {
      renderHome();

      expect(screen.getByPlaceholderText("Search 'San Fransisco'")).toHaveValue("");
    });

    it("navigates to the listings page for a valid search", async () => {
      renderHome();

      search("  Toronto ");

      expect(await screen.findByText("Listings page")).toBeInTheDocument();
      expect(screen.getByTestId("location")).toHaveTextContent("/listings/Toronto");
    });

    it("stays on the home page and shows an error for an empty search", async () => {
      renderHome();

      search("   ");

      expect(await screen.findByText("Please enter a valid search!")).toBeInTheDocument();
      expect(screen.getByTestId("location")).toHaveTextContent(/^\/$/);
    });
  });

  describe("premium listings", () => {
    it("shows the loading state while the query is in flight", () => {
      renderHome();

      expect(screen.getByText("Premium Listings - Loading")).toBeInTheDocument();
      expect(screen.queryByText("Premium Listings")).not.toBeInTheDocument();
    });

    it("shows the listings when the query succeeds", async () => {
      renderHome();

      expect(await screen.findByText("Premium Listings")).toBeInTheDocument();
      expect(screen.getByText("Bev. Hills")).toBeInTheDocument();
      expect(screen.queryByText("Premium Listings - Loading")).not.toBeInTheDocument();
    });

    it("renders neither section when the query fails", async () => {
      renderHome([{ request: listingsRequest, error: new Error("Network Error") }]);

      await waitFor(() => {
        expect(screen.queryByText("Premium Listings - Loading")).not.toBeInTheDocument();
      });
      expect(screen.queryByText("Premium Listings")).not.toBeInTheDocument();
    });
  });
});
