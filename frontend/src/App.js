import 'regenerator-runtime/runtime'
import React, { useEffect, useState } from 'react'
import { Routes, Route } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Home from './views/Home'
import AboutUs from './views/AboutUs';
import Docs from './views/Docs';
import Help from './views/Help';
import UserProfile from './views/UserProfile';

import NavBar from './components/NavBar'
import Footer from './components/Footer'

export default function App() {

    return (
        <>
            <NavBar/>
            <Routes>
                <Route path="/" element={ <Home />} />
                <Route path="/about_us" element={<AboutUs />} />
                <Route path="/docs" element={<Docs />}/>
                <Route path="/help" element={<Help />}/>
                <Route path="/profile/:id" element={<UserProfile />}/>
            </Routes>
            <Footer/>
            <ToastContainer 
                position="bottom-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
        </>
    )
}
