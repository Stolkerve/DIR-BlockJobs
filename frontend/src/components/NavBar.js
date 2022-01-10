import 'regenerator-runtime/runtime'
import React from 'react'
import { login, logout } from '../utils'

function NavBarContent() {
    if (!window.walletConnection.isSignedIn()) {
        return (
            <nav className="font-sen text-white uppercase text-base lg:flex items-center hidden">
                <a href="#" className="py-2 px-6 flex">
                    Home
                </a>
                <a href="#" className="py-2 px-6 flex">
                    Docs
                </a>
                <a href="#" className="py-2 px-6 flex">
                    Help
                </a>
                <a href="#" className="py-2 pl-3 pr-4 flex items-center">
                    <img src={require("../../assets/logo-white.svg")}></img>
                    <button className="uppercase" onClick={login}>Login</button>
                </a>
            </nav>
        )
    }
    
    return (
        <button onClick={logout}>Sign out</button>
    )
}

export default function NavBar() {
    return (
        <div className="h-24 flex items-center z-30 w-full">
            <div className="container mx-auto px-6 flex items-center justify-between">
                <div className="text-white font-bold text-4xl">
                    <span className="font-normal">Block</span>
                    Jobs
                </div>
                <div className="flex items-center">
                    <NavBarContent/>
                </div>
            </div>
        </div>
    )
}