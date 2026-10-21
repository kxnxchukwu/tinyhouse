import React, { useState, useEffect, useRef } from "react";
import { createRoot } from 'react-dom/client';
import {BrowserRouter as Router, Routes as Switch, Route} from "react-router-dom"
import { ApolloClient, ApolloProvider, InMemoryCache, createHttpLink, useMutation } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { AppHeader, Home, Host, Listing, Listings, Login, NotFound, Stripe, User } from "./sections";
import { Affix, Layout, Spin } from "antd";
import { Viewer } from "./lib/types";
import { LOG_IN } from "./lib/graphql/mutations";
import { LogIn as LogInData, LogInVariables } from "./lib/graphql/mutations/LogIn/__generated__/LogIn";
import "./styles/index.css";
import { AppHeaderSkeleton, ErrorBanner } from "./lib/components";
import { StripeProvider, Elements } from "react-stripe-elements";
import { Navigate } from 'react-router-dom'
import { routerFuture } from "./lib/router";

const csrfLink = setContext((_operation, { headers }) => ({
  headers: {
    ...headers,
    "X-CSRF-TOKEN": sessionStorage.getItem("token") || ""
  }
}));

const client = new ApolloClient({
  link: csrfLink.concat(createHttpLink({ uri: "/api" })),
  cache: new InMemoryCache()
});

const container = document.getElementById('root')!;
const root = createRoot(container);

const initialViewer: Viewer = {
  id: null,
  token: null,
  avatar: null,
  hasWallet: null,
  didRequest: false
}

const App = () => {
  const [viewer, setViewer] = useState<Viewer>(initialViewer);
  const [logIn, {error}] = useMutation<LogInData, LogInVariables>(LOG_IN, {
    onCompleted: data => {
      if (data && data.logIn) {
        setViewer(data.logIn);

        if (data.logIn.token) {
          sessionStorage.setItem("token", data.logIn.token);
        }
        else {
          sessionStorage.removeItem("token");
        }
      }
    },
    onError: () => {} // `error` above drives the banner; this stops the promise rejecting unhandled
  });

  const logInRef = useRef(logIn);

  useEffect(() => {
    logInRef.current();
  }, []);

  if (!viewer.didRequest && !error) {
    return (
      <Layout className="app-skeleton">
        <AppHeaderSkeleton />
        <div className="app-skeleton__spin-section">
          <Spin size="large" tip="Launching TinyHouse." />
        </div>
      </Layout>
    );
  }

  const logInErrorBannerElement = error ? <ErrorBanner description="We weren't able to verify if you were logged in. Please try again later!" /> : null;

  return (
    <>
    <StripeProvider apiKey={import.meta.env.VITE_S_PUBLISHABLE_KEY}>
    <Router future={routerFuture}>
    <Layout id="app">
      {logInErrorBannerElement}
    <Affix offsetTop={0} className="app__affix-header">
      <AppHeader viewer={viewer} setViewer={setViewer} />
    </Affix>
    <Switch>
    <Route path="/" element={<Home />} />
    <Route path="/host" element={<Host viewer={viewer} />} />
    <Route path="/listing/:id" element={<Elements><Listing viewer={viewer} /></Elements>} />
    <Route path="/listings/:location" element={<Listings />} />
    <Route path="/listings" element={<Listings />} />
    <Route path="/login" element={<Login setViewer={setViewer} />} />
    <Route path="/stripe" element={<Stripe viewer={viewer} setViewer={setViewer} />} />
    <Route path="/user/:id" element={<User viewer={viewer} setViewer={setViewer} />} />
    <Route path="/404" element={<NotFound/>} />
    <Route path="*" element={<Navigate replace to="/404" />} />
    </Switch>
    </Layout>
    </Router>
    </StripeProvider>
    </>
  );
}

root.render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>
);

// Older Create React App builds registered a service worker; remove it from returning browsers.
navigator.serviceWorker?.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.unregister());
});
