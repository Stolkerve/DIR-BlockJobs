import 'regenerator-runtime/runtime'
import React from 'react'
import { Routes, Route } from "react-router-dom";
import Home from './views/Home'

export default function App() {
    return (
        <>
            <Routes>
                <Route path="/" element={ <Home />} />
                {/* <Route path="about" element={<About />} /> */}
            </Routes>
        </>
    )
}
