import React, { useEffect, useState } from "react"
import { useParams } from "react-router-dom";
import CreateDisputeDialog from "../components/CreateDisputeDialog";
import DisputeCard from "../components/DisputeCard";
import MarkdownViewer from "../components/MarkdowViewer";
import { getDispute, updateDisputeStatus } from "../utils";

export default function Dispute() {
    const [loading, setLoading] = useState(true)
    let [isOpen, setIsOpen] = useState(false)
    const [dispute, setDispute] = useState()
    const params = useParams();

    useEffect(async () => {
        // await updateDisputeStatus(Number(params.id))
        setDispute(await getDispute(Number(params.id)))
        setLoading(false)
    }, [])

    function closeModal() {
        setIsOpen(false)
    }

    function openModal() {
        setIsOpen(true)
    }

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
        return s.getDate() + "/" + (s.getMonth() + 1) + "/" + s.getFullYear() + "  (" + s.getHours() + ":" + s.getMinutes() + ":" + s.getSeconds() + ")";
    }

    const getStatus = () => {
        // let s = new Date(Math.round((sold_moment) / 1000000)) - clock
        let s = new Date(Math.round((dispute.initial_timestamp) / 1000000))
        let now = new Date();
        const diff = dateDiffInDays(s, now)
        if (diff <= 5) {
            let f = s
            f.setDate(f.getDate() + 5)
            return (
                "La etapa de Open acabara el "
                + getTimeStamp(f) + "\n"
                + "La etapa de votacion "
                + getTimeStamp(new Date(f.setDate(f.getDate() + 10)))
            )
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
                            (!dispute.accused_proves && (dispute.accused == window.accountId)) &&
                            <div className="flex justify-center">
                                <button onClick={openModal} className="uppercase py-2 px-4 rounded-lg bg-red-500 border-transparent text-white text-md mb-4">
                                    Agregar pruebas!!!
                                </button>
                                <CreateDisputeDialog  isOpen={isOpen} closeModal={closeModal} openModal={openModal} disputeId={dispute.id}/>
                            </div>
                        }
                        <div className="border-2 rounded-lg px-6 py-4 ">
                            <div className="text-2xl flex justify-center font-bold text-gray-800 mb-2">Disputa</div>
                            <DisputeCard dispute={dispute} />
                        </div>
                        <div className="border-2 rounded-lg px-6 py-4 mt-4">
                            <div className="text-2xl  flex justify-center font-bold text-gray-800 mb-1">Pruebas</div>
                            <div className="flex flex-row">
                                <div className="w-[50%]">
                                    <div className="text-lg flex justify-center font-bold text-gray-800 mb-2">Acusador</div>
                                    <div className=" border-[#27C0EF] border-2 w-full min-h-[400px] rounded py-2 px-4 max-h-[400px] overflow-y-scroll overflow-x-scroll">
                                        <MarkdownViewer text={dispute.applicant_proves} />
                                    </div>
                                </div>
                                <div className="mx-2" />
                                <div className="w-[50%]">
                                    <div className="text-lg font-bold flex justify-center text-gray-800 mb-2">Acusado</div>
                                    {
                                        dispute.accused_proves &&
                                        <div className="border-[#27C0EF] border-2 w-full min-h-[400px] rounded py-2 px-4 max-h-[400px] overflow-y-scroll overflow-x-scroll">
                                            <MarkdownViewer text={dispute.accused_proves} />
                                        </div>
                                    }
                                </div>
                            </div>
                        </div>

                        <div className="border-2 rounded-lg px-6 py-4 mt-4">
                            <div className="text-2xl font-bold text-gray-800 mb-1">Etapas</div>
                            <div>Momento de creacion {getDate()}</div>
                            <div>
                                {getStatus()}
                            </div>
                        </div>

                    </div>
                )
            }
        </div>
    )
}