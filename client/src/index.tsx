import React from "react";
import { render } from 'react-dom';
import {BrowserRouter as Router, Routes as Switch, Route} from "react-router-dom"
import ApolloClient from "apollo-boost";
import { ApolloProvider } from "@apollo/react-hooks";
import { Home, Host, Listing, Listings, NotFound, User } from "./sections";
import * as serviceWorker from "./serviceWorker";
import "./styles/index.css";

const client = new ApolloClient({
  uri: "/api"
});

const App = () => {
  return (
    <>
    <Router>
    <Switch>
    <Route path="/" element={<Home />} />
    <Route path="/host" element={<Host />} />
    <Route path="/listing/:id" element={<Listing />} />
    <Route path="/listing/:location?" element={<Listings title="Tinyhouse Listings" />} />
    <Route path="/user/:id" element={<User />} />
    <Route element={<NotFound />} />
    </Switch>
    </Router>
    </>
  );
}


render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
