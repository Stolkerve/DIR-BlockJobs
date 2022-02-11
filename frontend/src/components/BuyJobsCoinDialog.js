import React, { Fragment, useState } from "react"
import { Transition, Dialog } from '@headlessui/react'
import { buyFT } from "../utils"
import { toast } from "react-toastify"

export default function BuyJobsCoinDialog({ isOpen, closeModal, openModal }) {
    const [amountOfNears, setAmountOfNears] = useState(1.0)

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog
                as="div"
                className="fixed inset-0 z-50 overflow-y-auto"
                onClose={closeModal}
            >
                <div className="min-h-screen px-4 text-center">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <Dialog.Overlay className="fixed inset-0 bg-[#F8F7FF]" />
                    </Transition.Child>

                    {/* This element is to trick the browser into centering the modal contents. */}
                    <span
                        className="inline-block h-screen align-middle"
                        aria-hidden="true"
                    >
                        &#8203;
                    </span>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                    >
                        <div className="min-w-[50%] inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                            <Dialog.Title
                                as="h3"
                                className="text-lg font-semibold leading-6 text-gray-900 text-center"
                            >
                                Comprar JOBS
                            </Dialog.Title>
                            <div className="mt-2">
                                <div className="h-auto w-32 mr-4">
                                    <label className="w-full block text-gray-700 text-sm font-semibold">
                                        NEARs
                                    </label>
                                    <div className="flex items-center">
                                        <div className="flex flex-row h-10 w-full rounded-lg relative bg-transparent mt-1 mr-4">
                                            <button className=" bg-gray-300 text-gray-600 hover:text-gray-700 hover:bg-gray-400 h-full w-20 rounded-l cursor-pointer outline-none" onClick={() => {
                                                setAmountOfNears(amountOfNears <= 1 ? (amountOfNears) : (amountOfNears - 0.1)) 
                                            }}>
                                                <span className="m-auto text-2xl font-thin">−</span>
                                            </button>
                                            <input className="outline-none focus:outline-none text-center w-full bg-gray-300 font-semibold text-md hover:text-black focus:text-black  md:text-basecursor-default flex items-center text-gray-700"
                                                value={amountOfNears.toFixed(1)}
                                            ></input>
                                            <button className="bg-gray-300 text-gray-600 hover:text-gray-700 hover:bg-gray-400 h-full w-20 rounded-r cursor-pointer" onClick={() => {
                                                setAmountOfNears(amountOfNears + 0.1) 
                                            }}>
                                                <span className="m-auto text-2xl font-thin">+</span>
                                            </button>
                                        </div>
                                        <div className="whitespace-pre-wrap">
                                            <div className="flex"><div>JOBS: </div>{(amountOfNears * 1000).toFixed(1)}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4">
                                <button
                                    type="button"
                                    className="inline-flex justify-center items-center px-4 py-2 mr-4 text-white bg-[#27C0EF] border border-transparent rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 font-bold"
                                    onClick={async () => {
                                        await buyFT(amountOfNears)
                                    }}
                                >
                                    Comprar!
                                </button>
                            </div>
                        </div>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    )
}