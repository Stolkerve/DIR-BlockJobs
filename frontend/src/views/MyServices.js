import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import ServicesCard from "../components/ServicesCard";
import CreateServiceDialog from "../components/CreateServiceDialog";
import SkeletonLoaderService from "../components/SkeletonLoaderService";

import { getUserServices } from "../utils";
import ServicesFilter from "../components/ServicesFilter";

export default function MyServices() {
    let [services, setServices] = useState([]);
    let [loading, setLoading] = useState(true)
    let [isOpen, setIsOpen] = useState(false)
    const navigate = useNavigate()

    useEffect(async () => {
        const _services = await getUserServices()
        console.log(_services)
        if (_services) {
            setServices(await getUserServices())
        }

        setLoading(false)
    }, [])

    function closeModal() {
        setIsOpen(false)
    }

    function openModal() {
        setIsOpen(true)
    }

    useEffect(() => {

    }, [])

    return (
        <div className="m-8 w-full">
            {
                loading ? (
                    <div className="">
                        <div className="shadow-md border-2 rounded-lg px-6 py-4 w-full mt-4">
                            <div className="text-xl font-bold text-gray-800">Mis servicios</div>
                            {
                                [0, 1].map((v, i) => {
                                    return (
                                        <div key={v.id} className="my-6">
                                            <SkeletonLoaderService />
                                        </div>
                                    )
                                })
                            }
                        </div>
                        <div className="shadow-md border-2 rounded-lg px-6 py-4 w-full mt-4">
                            <div className="text-xl font-bold text-gray-800">Servicios adquiridos</div>
                            {
                                [0, 1].map((v, i) => {
                                    return (
                                        <div key={v.id} className="my-4">
                                            <SkeletonLoaderService />
                                        </div>
                                    )
                                })
                            }
                        </div>
                        <div className="shadow-md border-2 rounded-lg px-6 py-4 w-full mt-4">
                            <div className="text-xl font-bold text-gray-800">Servicios vendidos</div>
                            {
                                [0, 1].map((v, i) => {
                                    return (
                                        <div key={v.id} className="my-4">
                                            <SkeletonLoaderService />
                                        </div>
                                    )
                                })
                            }
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-row">
                        <CreateServiceDialog isOpen={isOpen} closeModal={closeModal} openModal={openModal} service={null} />
                        <div className="relative">
                            <ServicesFilter mains={true} />
                        </div>
                        <div className="mx-auto">
                            <div >
                                <div>
                                    <button
                                        className="uppercase shadow-md transition ease-in-out hover:scale-105 hover:-translate-y-0.5 duration-300 shadow-[#27C0EF]/80 py-2 px-4 rounded-lg border-transparent text-white text-md mr-4 bg-[#27C0EF]"
                                        onClick={openModal}
                                    >
                                        Crear Servicio
                                    </button>
                                </div>

                                <div className="shadow-md border-2 rounded-lg px-6 py-4 w-full mt-4">
                                    <div className="text-xl font-bold text-gray-800">Mis servicios</div>
                                    {
                                        services.filter(v => !v.sold).map((v, i) => {
                                            return (
                                                <div key={v.id} className="my-6">
                                                    <ServicesCard service={v} />
                                                </div>
                                            )
                                        })
                                    }
                                </div>
                                <div className="shadow-md border-2 rounded-lg px-6 py-4 w-full mt-4">
                                    <div className="text-xl font-bold text-gray-800">Servicios adquiridos</div>
                                    {
                                        services.filter(v => (v.actual_owner == window.accountId) && (v.sold)).map((v, i) => {
                                            return (
                                                <div key={v.id} className="my-4">
                                                    <ServicesCard service={v} />
                                                </div>
                                            )
                                        })
                                    }
                                </div>
                                <div className="shadow-md border-2 rounded-lg px-6 py-4 w-full mt-4">
                                    <div className="text-xl font-bold text-gray-800">Servicios vendidos</div>
                                    {
                                        services.filter(v => (v.actual_owner != window.accountId) && (v.sold)).map((v, i) => {
                                            return (
                                                <div key={v.id} className="my-4">
                                                    <ServicesCard service={v} />
                                                </div>
                                            )
                                        })
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    )
}
