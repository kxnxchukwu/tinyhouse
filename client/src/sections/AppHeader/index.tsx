import React, { useState, useEffect } from "react";
import {Link, useNavigate} from "react-router-dom";
import { useLocation } from 'react-router-dom'
import { Input, Layout } from "antd";
import { Viewer } from "../../lib/types";
import { displayErrorMessage } from "../../lib/utils";
import logo from "./assets/tinyhouse-logo.png";
import { MenuItems } from "./components";

interface Props {
    viewer: Viewer
    setViewer: (viewer: Viewer) => void
}

const {Header} = Layout;
const {Search} = Input;

export const AppHeader = ({viewer, setViewer}: Props) => {
    const navigate = useNavigate();
    const location = useLocation();
    const pathname = location.pathname;
    const [search, setSearch] = useState("");
    useEffect(() => {
        const pathnameSubStrings = pathname.split("/")
        if (!pathname.includes("/listings")) {
            setSearch("");
            return;
        }
        if (pathname.includes("/listings") && pathnameSubStrings.length === 3) {
            setSearch(pathnameSubStrings[2]);
            return;
        }
    }, [pathname])
    const onSearch = (value: string) => {
        const trimmedValue = value.trim();

        if (trimmedValue) {
            navigate(`/listings/${trimmedValue}`);
        }
        else {
            displayErrorMessage("Please enter a valid search");
        }
    }

    return (
        <Header className="app-header">
            <div className="app-header__logo-search-section">
                <div className="app-header__logo">
                    <Link to="/">
                        <img src={logo} alt="App Logo" />
                    </Link>
                </div>
                <div className="app-header__search-input">
                        <Search 
                            placeholder="Search 'San Fransisco'"
                            enterButton
                            value={search}
                            onChange={event => setSearch(event.target.value)}
                            onSearch={onSearch}
                        />
                </div>
            </div>
            <div className="app-header__menu-section">
                <MenuItems viewer={viewer} setViewer={setViewer} />
            </div>
        </Header>
    );
};