import React from 'react';
import { useLocation } from 'react-router-dom';

const Sphere = () => {
    // useLocation hook provides access to the current URL path
    const location = useLocation();

    // Check if the current path is the home page ('/')
    const isHomePage = location.pathname === '/';

    // Render a div with a className that changes based on whether it’s the home page
    // If on the home page, the 'notcentered' class is applied to offset styling
    return <div className={`sphere ${isHomePage ? 'notcentered' : ''}`}></div>;
};

export default Sphere;