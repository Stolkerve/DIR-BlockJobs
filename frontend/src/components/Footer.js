import React from "react"

export default function Footer() {
    return (
        <div className="bg-[#081315]">
            <div className="flex justify-between font-sans py-14 px-10">
                <div className="">
                    <div className="text-white font-bold text-xl">
                        <span className="font-normal">Block</span>
                        Jobs
                    </div>
                </div>
                <div className="">
                    <div className="text-white font-bold">Learn More</div>
                    <span className="text-[#D3D6D8]">
                        <div className="">Learn More</div>
                        <div className="">Learn More</div>
                    </span>
                </div>
                <div className="">
                    <div className="text-white font-bold">Get Started</div>
                    <span className="text-[#D3D6D8]">
                        <div className="">Get Started</div>
                        <div className="">Get Started</div>
                        <div className="">Get Started</div>
                    </span>
                </div>
            </div>
        </div>
    )
}