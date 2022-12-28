import React from "react";
import { MemoryRouter } from "react-router-dom";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/react-testing";
import { Login } from "../index";
import { AUTH_URL } from "../../../lib/graphql/queries";
import { LOG_IN } from "../../../lib/graphql/mutations";
import { GraphQLError } from "graphql";

const defaultProps = {
  setViewer: () => {},
};

describe("Login", () => {
  // avoid console warnings around scrollTo
  window.scrollTo = () => {};

  describe("AUTH_URL Query", () => {
    it("redirects the user when query is successful", async () => {
      window.location.assign = jest.fn();
      const authUrlMock = {
        request: {
          query: AUTH_URL,
        },
        result: {
          data: {
            authUrl: "https://google.com/signin",
          },
        },
      };
      const loginRoute = "/login";
      const { getByRole, queryByText } = render(
        <MockedProvider mocks={[authUrlMock]} addTypename={false}>
          <MemoryRouter initialEntries={[loginRoute]}>
            <Login {...defaultProps} />
          </MemoryRouter>
        </MockedProvider>
      );
      const authUrlButton = getByRole("button");
      fireEvent.click(authUrlButton);

      await waitFor(() => {
        expect(window.location.assign).toHaveBeenCalledWith(
          "https://google.com/signin"
        );
        expect(
          queryByText(
            "Sorry! We weren't able to log you in. Please try again later!"
          )
        ).toBeNull();
      });
    });

    it("does not redirect the user when query is not successful", async () => {
      window.location.assign = jest.fn();

      const authUrlMock = {
        request: {
          query: AUTH_URL,
        },
        errors: [new GraphQLError("Something went wrong!")],
      };

      const loginRoute = "/login";

      const { getByRole, queryByText } = render(
        <MockedProvider mocks={[authUrlMock]} addTypename={false}>
          <MemoryRouter initialEntries={[loginRoute]}>
            <Login {...defaultProps} />
          </MemoryRouter>
        </MockedProvider>
      );

      const authUrlButton = getByRole("button");

      fireEvent.click(authUrlButton);

      await waitFor(() => {
        expect(window.location.assign).not.toHaveBeenCalledWith(
          "https://google.com/signin"
        );
        expect(
          queryByText(
            "Sorry! We weren't able to log you in. Please try again later!"
          )
        ).not.toBeNull();
      });
    });
  });

  describe("LOGIN Mutation", () => {
    it("when no code exists ion the /login route, the mutation is not fired", async () => {
      const logInMock = {
        request: {
          query: LOG_IN,
          variables: {
            input: {
              code: "1234",
            },
          },
        },
        result: {
          data: {
            logIn: {
              id: "112",
              token: "token-1234",
              avatar: "image.png",
              hasWallet: false,
              didRequest: true,
            },
          },
        },
      };

      const loginRoute = "/login";

      render(
        <MockedProvider mocks={[logInMock]} addTypename={false}>
          <MemoryRouter initialEntries={[loginRoute]}>
            <Login {...defaultProps} />
          </MemoryRouter>
        </MockedProvider>
      );

      await waitFor(() => {
        expect(window.location.pathname).not.toBe("/user/112");
      });
    });

    describe("when code exists in the /login route as a query parameter", () => {
      it("redirects the user to their user page when the login mutation is sucessful", async () => {
        const logInMock = {
          request: {
            query: LOG_IN,
            variables: {
              input: {
                code: "1234",
              },
            },
          },
          result: {
            data: {
              logIn: {
                id: "112",
                token: "token-1234",
                avatar: "image.png",
                hasWallet: false,
                didRequest: true,
              },
            },
          },
        };

        const loginRoute = "/login?code=1234";

        render(
          <MockedProvider mocks={[logInMock]} addTypename={false}>
            <MemoryRouter initialEntries={[loginRoute]}>
              <Login {...defaultProps} />
            </MemoryRouter>
          </MockedProvider>
        );

        await waitFor(() => {
          expect(window.location.pathname).toBe("/user/112");
        });
      });

      it("does not redirect the user to their user page and displays an error message when the login mutation is unsuccesful", async () => {
        const logInMock = {
          request: {
            query: LOG_IN,
            variables: {
              input: {
                code: "1234",
              },
            },
          },
          errors: [new GraphQLError("Something went wrong")],
        };

        const loginRoute = "/login?code=1234";

        const { queryByText } = render(
          <MockedProvider mocks={[logInMock]} addTypename={false}>
            <MemoryRouter initialEntries={[loginRoute]}>
              <Login {...defaultProps} />
            </MemoryRouter>
          </MockedProvider>
        );

        await waitFor(() => {
          expect(window.location.pathname).not.toBe("/user/112");
          expect(
            queryByText(
              "Sorry! We weren't able to log you in. Please try again later!"
            )
          ).not.toBeNull();
        });
      });
    });
  });
});
