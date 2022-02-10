import React, { Fragment, useEffect, useState } from "react";

import SkeletonLoaderService from "../components/SkeletonLoaderService";
import ServicesCard from "../components/ServicesCard";
import { getServices, getUserServices } from "../utils";

export default function Services() {
    let [services, setServices] = useState([]);
    let [loading, setLoading] = useState(true)

    useEffect(async () => {
        let s = await getServices(0, 15)
        setLoading(false)
        console.log(s)
        setServices(s)
    }, [])

    return (
        <div className="w-full">
            <div className="m-8 ">
                {
                    loading ? (
                        <div className="shadow-md border-2 rounded-lg px-6 py-4 w-full mt-4">
                            <div className="text-xl font-bold text-gray-800">Mis servicios</div>
                            {
                                [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((v, i) => {
                                    return (
                                        <div key={v.id} className="my-6">
                                            <SkeletonLoaderService />
                                        </div>
                                    )
                                })
                            }
                        </div>
                    ) : (
                        <div className="border-2 rounded-lg px-6 py-4 mt-4">
                            {/* <div className="text-xl font-bold text-gray-800">Servicios</div> */}
                            {
                                services.map((v, i) => {
                                    return (
                                        <div className="my-4" key={v.id}>
                                            <ServicesCard service={v} />
                                        </div>
                                    )
                                })
                            }
                        </div>
                    )
                }
            </div>
        </div>
    )
}