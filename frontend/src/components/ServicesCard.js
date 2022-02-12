import React from "react";

import { ImCross, ImCheckmark } from "react-icons/im"
import { useNavigate } from "react-router-dom";

export default function ServicesCard({ service }) {
    const navigate = useNavigate()
    return (
        <div onClick={() => { navigate(`/service/${service.id}`) }} className="hover:cursor-pointer rounded-md border-2 shadow-md border-[#27C0EF] p-4 bg-[#F8F7FF] font-semibold text-[#74787B] transition ease-in-out hover:scale-[1.02]">
            <div className="flex">
                <div className="flex self-baseline">
                    {
                        service.metadata.icon ? (
                            <img className="w-24 h-24 rounded-full mr-4 object-cover" src={service.metadata.icon} />
                        ) :
                            (
                                <></>
                            )

                    }
                    <div>
                        <div className="text-[#034D82] text-lg">{service.metadata.title}</div>
                        <div className="truncate text-slate-900">{service.metadata.description}</div>
                    </div>
                </div>
                {/* <div class="border mx-2"></div> */}

            </div>

            <div className="font-light text-sm flex items-center mt-1 whitespace-pre-wrap">
                <div className="flex whitespace-pre-wrap">
                    <div className="mr-2">
                        <span className="font-semibold">Creador: </span>{service.creator_id}
                    </div>
                    <div className="mr-2"><span className="font-semibold">Dueño: </span>{service.actual_owner}</div>

                    <div className="mr-2 font-semibold">Duration:
                        <span className="font-light"> {service.duration} Days</span>
                    </div>

                    <div className="flex items-center mr-2 font-semibold">Sold:
                        <span className="font-light mx-1">
                            {
                                service.sold ? (<ImCheckmark color="green" />) : (<ImCross color="red" />)
                            }
                        </span>
                    </div>

                    <div className="flex items-center mr-2 font-semibold">On Sale:
                        <span className="font-light mx-1">
                            {
                                service.on_sale ? (<ImCheckmark color="green" />) : (<ImCross color="red" />)
                            }
                        </span>
                    </div>

                    <div className="flex items-center mr-2 font-semibold">On Dispute:
                        <span className="font-light mx-1">
                            {
                                service.on_dispute ? (<ImCheckmark color="green" />) : (<ImCross color="red" />)
                            }
                        </span>
                    </div>
                </div>
            </div>
            <div className=" text-sm flex items-center">
                {service.metadata.price}
                <img className="w-[26px]" src={require("../../assets/logo-black.svg")}></img>
            </div>
        </div>
    )
}