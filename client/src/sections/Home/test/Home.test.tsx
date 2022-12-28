import React from "react";
import "@testing-library/jest-dom";
import { createMemoryHistory } from "history";
import { Home } from "../index";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { MemoryRouter } from "react-router-dom";
import { LISTINGS } from "../../../lib/graphql/queries";
import { ListingsFilter } from "../../../lib/graphql/globalTypes"

describe("Home Component", () => {
  window.scrollTo = () => {};
  it("First Test!", () => {
    expect(1).toEqual(1);
  });

describe("Search Input", () => {
    it("Renders an Empty Search Input on Inital Render", async () => {
      //const history = createMemoryHistory();
      const homeRoute = "/";

      const { getByPlaceholderText } = render(
        <MockedProvider mocks={[]}>
          <MemoryRouter initialEntries={[homeRoute]}>
            <Home />
          </MemoryRouter>
        </MockedProvider>
      );

      await waitFor(() => {
        const searchInput = getByPlaceholderText(
          "Search 'San Fransisco'"
        ) as HTMLInputElement;
        expect(searchInput.value).toEqual("");
      });
    });

    it("Redirects the User to the /listings page when a valid search is provided", async () => {
      const history = createMemoryHistory();
      const homeRoute = "/";
      const { getByPlaceholderText } = render(
        <MockedProvider mocks={[]}>
          <MemoryRouter initialEntries={[homeRoute]}>
            <Home />
          </MemoryRouter>
        </MockedProvider>
      );

      await waitFor(() => {
        const searchInput = getByPlaceholderText(
          "Search 'San Fransisco'"
        ) as HTMLInputElement;
        
        fireEvent.change(searchInput, { target: { value: "Toronto" }});
        fireEvent.keyDown(searchInput, {
          key: "Enter",
          keyCode: 13
        });

        expect(history.location.pathname).toBe("/listings/Toronto");
      });
    });

    it("Does not Redirect the User to the /listings page when an invalid search is provided", async () => {
      const history = createMemoryHistory();
      const homeRoute = "/";
      const { getByPlaceholderText } = render(
        <MockedProvider mocks={[]}>
          <MemoryRouter initialEntries={[homeRoute]}>
            <Home />
          </MemoryRouter>
        </MockedProvider>
      );

      await waitFor(() => {
        const searchInput = getByPlaceholderText(
          "Search 'San Fransisco'"
        ) as HTMLInputElement;
        
        fireEvent.change(searchInput, { target: { value: "" }});
        fireEvent.keyDown(searchInput, {
          key: "Enter",
          keyCode: 13
        });

        expect(history.location.pathname).toBe("/");
      });
    })
  });
});

describe("Premium Listings", () => {

  it("Renders the Loading State when the query is loading", async () => {
    const history = createMemoryHistory();
    const homeRoute = "/";
    const { queryByText } = render(
      <MockedProvider mocks={[]}>
        <MemoryRouter initialEntries={[homeRoute]}>
          <Home />
        </MemoryRouter>
      </MockedProvider>
    );

    await waitFor(() => {
      expect(queryByText("Premium Listings - Loading")).not.toBeNull();
      expect(queryByText("Premium Listings")).toBeNull();
    });

  });

  it("Renders the intended UI when the query is successful", async () => {
    const listingsMock = {
      request: {
        query: LISTINGS,
        variables: {
          filter: ListingsFilter.PRICE_HIGH_TO_LOW,
          limit: 4,
          page: 1,
        },
      },
      result: {
        data: {
          listings: {
            region: null,
            total: 10,
            result: [
              {
                id: "1234",
                title: "Bev. Hills",
                image: "image.png",
                address: "90210 Bev. Hills",
                price: 9000,
                numOfGuests: 5,
              }
            ]
          }
        }
      } 
    };
    const homeRoute = "/";
    const { queryByText } = render(
      <MockedProvider mocks={[listingsMock]} addTypename={false}>
        <MemoryRouter initialEntries={[homeRoute]}>
          <Home />
        </MemoryRouter>
      </MockedProvider>
    );

    await waitFor(() => {
      expect(queryByText("Premium Listings")).not.toBeNull();
      expect(queryByText("Premium Listings - Loading")).toBeNull();
    });
  });

  it("Does not Render the loading section or the listing section when the query has an error", async () => {
    const listingsMock = {
      request: {
        query: LISTINGS,
        variables: {
          filter: ListingsFilter.PRICE_HIGH_TO_LOW,
          limit: 4,
          page: 1,
        },
      },
      error: new Error("Network Error"),
    };
    const homeRoute = "/";
    const { queryByText } = render(
      <MockedProvider mocks={[listingsMock]} addTypename={false}>
        <MemoryRouter initialEntries={[homeRoute]}>
          <Home />
        </MemoryRouter>
      </MockedProvider>
    );

    await waitFor(() => {
      expect(queryByText("Premium Listings")).toBeNull();
      expect(queryByText("Premium Listings - Loading")).toBeNull();
    });
  });
});
