import React, { useState, useEffect, useRef } from "react";
import { createRoot } from 'react-dom/client';
import {BrowserRouter as Router, Routes as Switch, Route} from "react-router-dom"
import ApolloClient from "apollo-boost";
import { ApolloProvider, useMutation } from "@apollo/react-hooks";
import { AppHeader, Home, Host, Listing, Listings, Login, NotFound, Stripe, User } from "./sections";
import { Affix, Layout, Spin } from "antd";
import { Viewer } from "./lib/types";
import { LOG_IN } from "./lib/graphql/mutations";
import { LogIn as LogInData, LogInVariables } from "./lib/graphql/mutations/LogIn/__generated__/LogIn";
import * as serviceWorker from "./serviceWorker";
import "./styles/index.css";
import { AppHeaderSkeleton, ErrorBanner } from "./lib/components";
import { StripeProvider, Elements } from "react-stripe-elements";

const client = new ApolloClient({
  uri: "/api",
  request: async operation => {
    const token = sessionStorage.getItem("token");
    operation.setContext({
      headers: {
        "X-CSRF-TOKEN": token || ""
      }
    });
  }
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
    }
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
    <StripeProvider apiKey={process.env.REACT_APP_S_PUBLISHABLE_KEY as string}>
    <Router>
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
    <Route element={<NotFound />} />
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

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
