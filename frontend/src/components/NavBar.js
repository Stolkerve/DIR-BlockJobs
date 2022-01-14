import 'regenerator-runtime/runtime'
import React, { Fragment, useState, useEffect } from 'react'
import { BsPersonFill } from "react-icons/bs"
import { Menu, Transition, Dialog } from '@headlessui/react'
import { useNavigate, Link } from "react-router-dom";
import { utils } from "near-api-js";
import { login, logout } from '../utils'

export default function NavBar() {
    return (
        <div className="bg-[#27C0EF] h-24 flex items-center z-30 w-full relative">
            <div className="container mx-auto px-6 flex items-center justify-between">
                <Link to="/" className="text-white font-bold text-4xl">
                    <span className="font-normal">Block</span>
                    Jobs
                </Link>
                <div className="flex items-center">
                    <NavBarContent />
                </div>
            </div>
        </div>
    )
}

function NavBarContent() {
    let [isOpen, setIsOpen] = useState(false)
    let [isUserCreated, setIsUserCreated] = useState(true)
    let [beEmployeer, setbeEmployeer] = useState(false)

    let [educacionInput, setEducacionInput] = useState("")
    let [socialMediasInput, setSocialMediasInput] = useState(["", "", "", ""])
    let [pictureInput, setPictureInput] = useState("")

    const navegation = useNavigate();

    useEffect( async () => {
        // let timeout
        if (window.walletConnection.isSignedIn()) {
            try {
                console.log(await window.contract.get_user({account_id: window.accountId}));
                setIsUserCreated(false);
            }
            catch(e) {
                setIsUserCreated(false);
                console.log(e)
            }
        }
    }, [])


    function closeModal() {
        setIsOpen(false)
    }

    function openModal() {
        setIsOpen(true)
    }

    if (!window.walletConnection.isSignedIn()) {
        return (
            <nav className="font-sen text-white uppercase text-base lg:flex items-center hidden">
                <div className="py-2 pl-3 pr-4 flex items-center">
                    <button className="uppercase font-medium text-lg border-2 rounded-lg px-4 py-2" onClick={login}>
                        Login
                    </button>
                    {/* <img src={require("../../assets/logo-white.svg")}></img> */}
                </div>
            </nav>
        )
    }

    return (
        <nav className="lg:flex items-center hidden">
            { !isUserCreated ? (
                <div className="mx-6">
                    <button className="rounded-lg bg-transparent border-2 py-2 px-2 font-sen text-white uppercase text-base"
                        onClick={openModal}
                    >
                        Crear usuario
                    </button>
                </div> ) :
                (<></>)
            }
            <Menu as="div" className="relative inline-block text-left z-30">
                <div>
                    <Menu.Button className="w-full p-2 bg-white rounded-full">
                        <BsPersonFill color="#27C0EF" size={24} />
                    </Menu.Button>
                </div>
                <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                >
                    <Menu.Items className="absolute right-0 w-56 mt-2 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <div className="px-1 py-1 normal-case">
                            <Menu.Item>
                                <div className="text-[#00A8DB] font-semibold text-lg w-full px-2 py-2 text-sm border-b-2 text-center">
                                    {window.accountId}
                                </div>
                            </Menu.Item>
                            <Menu.Item>
                                {({ active }) => (
                                    <Link to={`/profile/${window.accountId}`} className={`${active ? 'bg-[#00A8DB] text-white' : 'text-[#00A8DB]'
                                        } group flex rounded-md items-center w-full px-2 py-2 mt-1 text-sm`}>
                                        My profile
                                    </Link>
                                )}
                            </Menu.Item>
                            <Menu.Item>
                                {({ active }) => (
                                    <button onClick={logout} className={`${active ? 'bg-[#00A8DB] text-white' : 'text-[#00A8DB]'
                                        } group flex rounded-md items-center w-full px-2 py-2 text-sm`}>
                                        Logout
                                    </button>
                                )}
                            </Menu.Item>
                        </div>
                    </Menu.Items>
                </Transition>
            </Menu>
            { !isUserCreated ? (
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
                                <Dialog.Overlay className="fixed inset-0" />
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
                                        className="text-lg font-medium leading-6 text-gray-900"
                                    >
                                        Crear un usuario nuevo
                                    </Dialog.Title>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500 border-b-2 pb-2">
                                            Por favor, rellene este formulario para poder crear tu usuario. Al finalizar se va a cobrar un peaje de 0.05 NEARS para cubrir el storage,
                                            el sobrante se rotornara. <br/><span className="font-bold">Estos datos son opcionales</span>
                                        </p>
                                    </div>
                                    <div className="mt-2">
                                        <label class="text-gray-900 mb-1 pr-4">
                                            Educacion
                                        </label>
                                        <input onChange={(e)=>{setEducacionInput(e.target.value)}} className="mb-2 bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-[#27C0EF]"></input>
                                        
                                        {
                                            [0, 1, 2, 3].map((i) => {
                                                return (
                                                    <>
                                                        <input onChange={(e)=>{
                                                            let newArr = [... socialMediasInput]
                                                            newArr[i] = e.target.value
                                                            setSocialMediasInput(newArr)}} className="mb-2 bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-[#27C0EF]"></input>
                                                    </>
                                                )
                                            })
                                        }
                                        <div>
                                        </div>
                                        {/* <label class="text-gray-900 mb-1 pr-4"> */}
                                            {/* Social Media Link 2 */}
                                        {/* </label> */}
                                        {/* <input onChange={(e)=>{setSocialMediaInput2(e.target.value)}} className="mb-2 bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-[#27C0EF]"></input> */}

                                        <label class="text-gray-900 mb-1 pr-4">
                                            Picture Link
                                        </label>
                                        <input onChange={(e)=>{setPictureInput(e.target.value)}} className="mb-2 bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-[#27C0EF]"></input>
                                        <input checked={beEmployeer} onChange={(e)=>{setbeEmployeer(!beEmployeer)}} type="checkbox" className="checked:bg-[#27C0EF]"></input>
                                        <label class="form-check-label inline-block text-gray-800 pl-2" for="flexCheckDefault">
                                            Ser empleador
                                        </label>
                                    </div>
                                    <div className="mt-4">
                                        <button
                                            type="button"
                                            className="inline-flex justify-center px-4 py-2 mr-4 text-white bg-[#27C0EF] border border-transparent rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 font-bold"
                                            onClick={async () => {
                                                let amt = utils.format.parseNearAmount("0.05");
                                                let links = JSON.stringify({
                                                    links: {
                                                        socialMedia: [socialMediaInput1, socialMediaInput2],
                                                        pictue: pictureInput
                                                    }
                                                })
                                                try {
                                                    
                                                    let roles = ["Professional"];
                                                    if (beEmployeer) {
                                                        roles.push("Employeer");
                                                    }
                                                    let user = await window.contract.add_user({roles: roles, categories: "hola", links: links, education: educacionInput}, "300000000000000", amt);
                                                    console.log(beEmployeer)
                                                } catch(e) {
                                                    console.log(e)
                                                }
                                            }}
                                        >
                                            Crear!
                                        </button>
                                        <button
                                            type="button"
                                            className="inline-flex justify-center px-4 py-2 text-white bg-[#FF0000] border border-transparent rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 font-bold"
                                            onClick={closeModal}
                                        >
                                            Ahora no!
                                        </button>
                                    </div>
                                </div>
                            </Transition.Child>
                        </div>
                    </Dialog>
                </Transition> ) :
                (<></>)
            }
        </nav>
    )
}