import { utils } from "near-api-js";
import React, { useEffect, useState } from "react";

import SkeletonLoaderService from "../components/SkeletonLoaderService"
import { getBalanceOf } from "../utils";

export default function MyTokens() {
    const [loading, setLoading] = useState(true)
    const [jobsCoinBalance, setJobsCoinBalance] = useState(0)
    const [nearBalance, setNearBalance] = useState(0)
    useEffect(async () => {
        //await getBalanceOf(window.accountId)
        setJobsCoinBalance(0)
        setNearBalance(utils.format.formatNearAmount((await window.walletConnection.account().getAccountBalance()).available, 4))
        setLoading(false)
    }, [])

    return (
        <div className="m-8 w-full">
            <div className="flex justify-center">

                <div className="shadow-md border-2 rounded-md whitespace-pre-wrap p-4 w-fit">
                    <div className="text-2xl font-bold text-gray-800 mb-2 text-center">Tokens </div>
                    <div className="text-lg font-bold text-gray-800">
                        <div className="flex">
                            <div className="mr-4">
                                <img className="my-2 w-[32px]" src={require("../../assets/dai-2.svg")}></img>
                                <img className="my-2 w-[32px]" src={require("../../assets/logo-black.svg")}></img>
                                <img className="my-2 w-[32px]" src={require("../../assets/daii.svg")}></img>
                            </div>
                            <div>
                                <div className="my-2">
                                    {
                                        loading ? (
                                        <svg className="spinner-normal ml-2" viewBox="0 0 50 50">
                                            <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="4"></circle>
                                        </svg>
                                        ) : (
                                            <div>{jobsCoinBalance}</div>
                                        )
                                    }
                                </div>
                                <div className="my-2">
                                    {
                                        loading ? (
                                        <svg className="spinner-normal ml-2" viewBox="0 0 50 50">
                                            <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="4"></circle>
                                        </svg>
                                        ) : (
                                            <div>{nearBalance}</div>
                                        )
                                    }
                                </div>
                                <div className="my-2">
                                    {
                                        loading ? (
                                        <svg className="spinner-normal ml-2" viewBox="0 0 50 50">
                                            <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="4"></circle>
                                        </svg>
                                        ) : (
                                            <div>{"aaa"}</div>
                                        )
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mx-4"></div>

                <div>
                    <div className="shadow-md border-2 rounded-md whitespace-pre-wrap p-4 w-fit">
                        <div className="text-2xl font-bold text-gray-800 mb-2 text-center">JobsCoin</div>
                        <div class="grid grid-cols-2 gap-4">
                            <button
                                className="uppercase py-2 px-4 rounded-lg border-transparent text-white text-md mr-4 bg-[#27C0EF] shadow-md transition ease-in-out hover:scale-105 hover:-translate-y-0.5 duration-300 shadow-[#27C0EF]/80"
                                onClick={() => {
                                    window.open("https://testnet.ref.finance/", "_blank")
                                }}
                            >
                                🤑 Compra 🤑
                            </button>
                            <button
                                className="uppercase py-2 px-4 rounded-lg border-transparent text-white text-md mr-4 bg-[#27C0EF] shadow-md transition ease-in-out hover:scale-105 hover:-translate-y-0.5 duration-300 shadow-[#27C0EF]/80"
                                onClick={() => {
                                    window.open("https://testnet.ref.finance/", "_blank")
                                }}
                            >
                                🤑 Trade 🤑
                            </button>
                            <button
                                className="uppercase py-2 px-4 rounded-lg border-transparent text-white text-md mr-4 bg-[#27C0EF] shadow-md transition ease-in-out hover:scale-105 hover:-translate-y-0.5 duration-300 shadow-[#27C0EF]/80"

                            >
                                🤑 Transferir 🤑
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mx-4"></div>

                <div>
                    <div className="shadow-md border-2 rounded-md whitespace-pre-wrap p-4 w-fit">
                        <div className="text-2xl font-bold text-gray-800 mb-2 text-center">Wallets</div>
                        <div class="grid grid-cols-2 gap-4">
                            <button
                                className="uppercase py-2 px-4 rounded-lg border-transparent text-white text-md mr-4 bg-[#27C0EF] shadow-md transition ease-in-out hover:scale-105 hover:-translate-y-0.5 duration-300 shadow-[#27C0EF]/80"
                                onClick={() => {
                                    window.open("https://wallet.testnet.near.org/", "_blank")
                                }}
                            >
                                NEAR wallet
                            </button>

                            <button
                                className="uppercase py-2 px-4 rounded-lg border-transparent text-white text-md mr-4 bg-[#27C0EF] shadow-md transition ease-in-out hover:scale-105 hover:-translate-y-0.5 duration-300 shadow-[#27C0EF]/80"
                                onClick={() => {
                                    window.open("")
                                }}
                            >
                                DAI wallet
                            </button>

                        </div>
                    </div>
                </div>

            </div>
            <div className="mt-8">
                <div className="shadow-md border-2 rounded-md mr-4 whitespace-pre-wrap p-4">
                    <div className="text-2xl font-bold text-gray-800 mb-2 text-center">Transacciones</div>
                    {
                        [0, 1, 2, 3, 4, 5].map((v, i) => {
                            return (
                                <div key={v.id} className="my-6">
                                    <SkeletonLoaderService />
                                </div>
                            )
                        })
                    }
                </div>
            </div>
        </div>
    )
}