import React, { useState, useEffect } from "react";
import DisputeCard from "../components/DisputeCard";
import { getDisputes, getMaxJurors } from "../utils";
import SkeletonLoaderDispute from "../components/SkeletonLoaderDispute";
import DisputesFilter from "../components/DisputesFilter";

export default function MyDisputes() {
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
        <div className="m-8 w-full">
            {
                loading ? (
                    <div className="">
                        <div className="shadow-md border-2 rounded-lg px-6 py-4 w-full mt-4">
                            <div className="text-xl font-bold text-gray-800 mb-2">Mis disputas</div>
                            {
                                [0, 1].map((v, i) => {
                                    return (
                                        <div key={v.id} className="my-6">
                                            <SkeletonLoaderDispute />
                                        </div>
                                    )
                                })
                            }
                        </div>
                        <div className="shadow-md border-2 rounded-lg px-6 py-4 w-full mt-4">
                            <div className="text-xl font-bold text-gray-800 mb-2">Mis disputas</div>
                            {
                                [0, 1].map((v, i) => {
                                    return (
                                        <div key={v.id} className="my-6">
                                            <SkeletonLoaderDispute />
                                        </div>
                                    )
                                })
                            }
                        </div>
                        <div className="shadow-md border-2 rounded-lg px-6 py-4 w-full mt-4">
                            <div className="text-xl font-bold text-gray-800 mb-2">Mis disputas</div>
                            {
                                [0, 1].map((v, i) => {
                                    return (
                                        <div key={v.id} className="my-6">
                                            <SkeletonLoaderDispute />
                                        </div>
                                    )
                                })
                            }
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-row">
                        <div className="relative">
                            <DisputesFilter />
                        </div>
                        <div>
                            <div className="shadow-md border-2 rounded-lg px-6 py-4 w-full mt-4">
                                <div className="text-xl font-bold text-gray-800 mb-2">Mis disputas</div>
                                {
                                    disputes.filter((v) => window.accountId === v.applicant).map((v, i) => {
                                        return (
                                            <div className="mb-4" key={v.id}>
                                                <DisputeCard dispute={v} maxJurors={maxJurors} />
                                            </div>
                                        )
                                    })
                                }
                            </div>

                            <div className="shadow-md border-2 rounded-lg px-6 py-4 w-full mt-4">
                                <div className="text-xl font-bold text-gray-800 mb-2">Disputas en contra</div>
                                {
                                    disputes.filter((v) => window.accountId === v.accused).map((v, i) => {
                                        return (
                                            <div className="mb-4" key={v.id}>
                                                <DisputeCard dispute={v} maxJurors={maxJurors} />
                                            </div>
                                        )
                                    })
                                }
                            </div>

                            <div className="shadow-md border-2 rounded-lg px-6 py-4 w-full mt-4">
                                <div className="text-xl font-bold text-gray-800 mb-2">Juez</div>
                                {
                                    (disputes.filter((v) => v.jury_members.find((v) => v === window.accountId))).map((v, i) => {
                                        return (
                                            <div className="mb-4" key={v.id}>
                                                <DisputeCard dispute={v} maxJurors={maxJurors} />
                                            </div>
                                        )
                                    })
                                }
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    )
}