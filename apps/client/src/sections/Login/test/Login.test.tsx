import { MockedProvider, MockedResponse } from "@apollo/client/testing";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { GraphQLError } from "graphql";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Login } from "../index";
import { AUTH_URL } from "../../../lib/graphql/queries";
import { LOG_IN } from "../../../lib/graphql/mutations";
import { redirectTo } from "../../../lib/utils";
import { routerFuture } from "../../../lib/router";

vi.mock("../../../lib/utils", async importOriginal => ({
  ...(await importOriginal<typeof import("../../../lib/utils")>()),
  redirectTo: vi.fn()
}));

const ERROR_TEXT = "Sorry! We weren't able to log you in. Please try again later!";

const viewer = {
  __typename: "Viewer",
  id: "112",
  token: "token-1234",
  avatar: "image.png",
  hasWallet: false,
  didRequest: true
};

const logInRequest = {
  query: LOG_IN,
  variables: { input: { code: "1234", state: "abcd" } }
};

const renderLogin = (route: string, mocks: MockedResponse[], setViewer = vi.fn()) =>
  render(
    <MockedProvider mocks={mocks}>
      <MemoryRouter initialEntries={[route]} future={routerFuture}>
        <Routes>
          <Route path="/login" element={<Login setViewer={setViewer} />} />
          <Route path="/user/:id" element={<div>User page</div>} />
        </Routes>
      </MemoryRouter>
    </MockedProvider>
  );

describe("Login", () => {
  beforeEach(() => {
    vi.mocked(redirectTo).mockClear();
  });

  describe("sign in with Google", () => {
    it("redirects to the Google auth URL when the query succeeds", async () => {
      renderLogin("/login", [
        { request: { query: AUTH_URL }, result: { data: { authUrl: "https://google.com/signin" } } }
      ]);

      fireEvent.click(screen.getByRole("button", { name: /sign in with google/i }));

      await waitFor(() => {
        expect(redirectTo).toHaveBeenCalledWith("https://google.com/signin");
      });
      expect(screen.queryByText(ERROR_TEXT)).not.toBeInTheDocument();
    });

    it("shows an error and stays put when the query fails", async () => {
      renderLogin("/login", [
        { request: { query: AUTH_URL }, result: { errors: [new GraphQLError("Something went wrong!")] } }
      ]);

      fireEvent.click(screen.getByRole("button", { name: /sign in with google/i }));

      expect(await screen.findByText(ERROR_TEXT)).toBeInTheDocument();
      expect(redirectTo).not.toHaveBeenCalled();
    });
  });

  describe("Google callback", () => {
    it("does not log in when there is no code in the URL", async () => {
      const result = vi.fn(() => ({ data: { logIn: viewer } }));
      renderLogin("/login", [{ request: logInRequest, result }]);

      expect(await screen.findByRole("button", { name: /sign in with google/i })).toBeInTheDocument();
      expect(result).not.toHaveBeenCalled();
    });

    it("logs in with the code and state, stores the CSRF token and opens the user page", async () => {
      const setViewer = vi.fn();
      renderLogin("/login?code=1234&state=abcd", [{ request: logInRequest, result: { data: { logIn: viewer } } }], setViewer);

      expect(await screen.findByText("User page")).toBeInTheDocument();
      expect(setViewer).toHaveBeenCalledWith(viewer);
      expect(sessionStorage.getItem("token")).toBe("token-1234");
    });

    it("shows an error and stays on the login page when the mutation fails", async () => {
      renderLogin("/login?code=1234&state=abcd", [
        { request: logInRequest, result: { errors: [new GraphQLError("Login state does not match.")] } }
      ]);

      expect(await screen.findByText(ERROR_TEXT)).toBeInTheDocument();
      expect(screen.queryByText("User page")).not.toBeInTheDocument();
      expect(sessionStorage.getItem("token")).toBeNull();
    });
  });
});
