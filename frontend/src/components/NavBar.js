import 'regenerator-runtime/runtime'
import React from 'react'
import { login, logout } from '../utils'

import {BsPersonFill} from "react-icons/bs"

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
        <nav className="font-sen text-white uppercase text-base lg:flex items-center hidden">
            <div className="p-2 rounded-full bg-[#ffffff] cursor-pointer" onClick={logout}>
                <BsPersonFill color="#27C0EF" size={24}/>
            </div>
        </nav>
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