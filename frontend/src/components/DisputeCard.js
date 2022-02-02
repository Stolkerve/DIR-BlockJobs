import React from "react";

import { VscArrowRight, VscArrowDown } from 'react-icons/vsc';
import { useNavigate } from "react-router-dom";
export default function DisputeCard({ dispute }) {
    const navigate = useNavigate()

    return (
        <div onClick={()=>{navigate(`/dispute/${dispute.id}`)}}  className="hover:cursor-pointer rounded-md border-2 border-[#27C0EF] p-4 bg-[#F8F7FF] font-semibold text-[#313335] flex">
            <div className="">
                <div className="flex items-center whitespace-pre-wrap mb-2">
                    <div className="mr-6">Disputa № {dispute.id}</div>
                </div>
                <div className="flex items-center whitespace-pre-wrap font-normal">
                    <div className="mr-4">Votes: <span className="">{dispute.votes.length}</span></div>
                    <div className="mr-4">Status: <span className="text-green-700">{dispute.dispute_status}</span></div>
                    <div className="">Servicio ID: <span className="">{dispute.service_id}</span></div>
                </div>

            </div>
            <div style={{borderLeftWidth: 2}} className="border-l-1 border-gray-600 mx-4"></div>
            <div>
                <div className="flex items-center whitespace-pre-wrap">
                    {dispute.applicant} <VscArrowRight className="mx-2 stroke-2" width={34} height={20} /> <span className="text-red-600">{dispute.accused}</span>
                </div>
                <div className="font-normal">
                    <div className="mr-4">Jueces: [{dispute.jury_members.toString()}]</div>
                </div>
            </div>
        </div>
    )
}