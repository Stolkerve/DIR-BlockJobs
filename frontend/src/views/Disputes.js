import React, { useEffect, useState } from "react";
import DisputeCard from "../components/DisputeCard";
import { getDisputes } from "../utils";

export default function Disputes() {
    let [loading, setLoading] = useState(true)
    let [disputes, setDisputes] = useState()
    useEffect(async () => {
        const d = await getDisputes(0, 10)
        console.log(d)
        setDisputes(d)
        setLoading(false)
    }, [])

    return (
        <div className="m-8">
            {
                 loading ? (
                    <div className="h-screen">
                        <svg className="spinner" viewBox="0 0 50 50">
                            <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                        </svg>
                    </div>
                ) : (
                    <div>
                        {
                            disputes.map((v, i) => { return (
                                <DisputeCard key={v.id} dispute={v} />
                            )})
                        }
                    </div>
                )
            }
        </div>
    )
}