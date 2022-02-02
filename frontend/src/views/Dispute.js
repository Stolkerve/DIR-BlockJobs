import React, { useEffect, useState } from "react"
import { useParams } from "react-router-dom";
import DisputeCard from "../components/DisputeCard";
import { getDispute, updateDisputeStatus } from "../utils";

export default function Dispute() {
    const [loading, setLoading] = useState(true)
    const [dispute, setDispute] = useState()
    const params = useParams();

    useEffect(async () => {
        // await updateDisputeStatus(Number(params.id))
        setDispute(await getDispute(Number(params.id)))
        setLoading(false)
    }, [])
    const _MS_PER_DAY = 1000 * 60 * 60 * 24;

    // a and b are javascript Date objects
    function dateDiffInDays(a, b) {
      // Discard the time and time-zone information.
      const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
      const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
    
      return Math.floor((utc2 - utc1) / _MS_PER_DAY);
    }
    const getDate = () => {
        // let s = new Date(Math.round((sold_moment) / 1000000)) - clock
        let s = new Date(Math.round((dispute.initial_timestamp) / 1000000))
        return getTimeStamp(s)
    }

    const getTimeStamp = (s) => {
        return s.getDate() + "/" + (s.getMonth() + 1) + "/" + s.getFullYear() + "  (" +  s.getHours() + ":" + s.getMinutes() + ":" + s.getSeconds() + ")";
    }

    const getStatus = () => {
        // let s = new Date(Math.round((sold_moment) / 1000000)) - clock
        let s = new Date(Math.round((dispute.initial_timestamp) / 1000000))
        let now = new Date();
        const diff = dateDiffInDays(s, now)
        if (diff <= 5) {
            let f = s
            f.setDate(f.getDate() + 5)
            console.log(f)
            return "La etapa de Open acabara el " + getTimeStamp(f)
        }
    }

    return (
        <div>
            {
                loading ? (
                    <div className="h-screen">
                        <svg className="spinner" viewBox="0 0 50 50">
                            <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                        </svg>
                    </div>
                ) : (
                    <div className="m-8">
                        {

                        }
                        <DisputeCard dispute={dispute} />
                        <div>
                            Momento de creacion {getDate()}
                        </div>
                        <div>
                            {getStatus()}
                        </div>
                    </div>
                )
            }
        </div>
    )
}