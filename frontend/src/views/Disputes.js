import React, { useEffect, useState } from "react";
import DisputeCard from "../components/DisputeCard";
import SkeletonLoaderDispute from "../components/SkeletonLoaderDispute";
import { getDisputes, getMaxJurors } from "../utils";

export default function Disputes() {
    let [loading, setLoading] = useState(true)
    let [maxJurors, setMaxJurors] = useState(0)
    let [disputes, setDisputes] = useState()

    useEffect(async () => {
        const d = await getDisputes(0, 10)

        console.log(d)
        setDisputes(d)
        setMaxJurors(await getMaxJurors())
        setLoading(false)
    }, [])

    return (
        <div className="m-8">
            {
                loading ? (
                    <div className="shadow-md border-2 rounded-lg px-6 py-4 w-full mt-4">
                        <div className="text-xl font-bold text-gray-800">Mis servicios</div>
                        {
                            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((v, i) => {
                                return (
                                    <div key={v.id} className="my-6">
                                        <SkeletonLoaderDispute />
                                    </div>
                                )
                            })
                        }
                    </div>
                ) : (
                    <div>
                        {
                            disputes.map((v, i) => {
                                return (
                                    <div className="mb-4">
                                        <DisputeCard key={v.id} dispute={v} maxJurors={maxJurors} />
                                    </div>
                                )
                            })
                        }
                    </div>
                )
            }
        </div>
    )
}