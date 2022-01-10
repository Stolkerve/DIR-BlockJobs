import 'regenerator-runtime/runtime'
import React from 'react'
import NavBar from '../components/NavBar'
import Footer from '../components/Footer'

export default function Home() {
    return (
        <>
            <div className="landing-background relative overflow-hidden h-screen">
                <NavBar/>

                {/* Primera seccion */}
                <div className="flex mx-10 mb-20 justify-between ">
                    <div className="sm:w-2/3 lg:w-2/5 flex flex-col relative z-20 justify-center">
                        <h1 className="mb-8 font-bebas-neue uppercase text-8xl sm:text-5xl font-black flex flex-col leading-none text-white pr-4">
                            Find your next job
                        </h1>
                        {/* <img src={require("../assets/Smile.svg")} className="w-120 h-10 mt-6 mb-8"></img> */}
                        <p className="text-sm sm:text-base text-white">
                            BlockJob is a dapp to search for jobs and freelancers. In addition to being an arbitrator to ensure that both parties are compliant.
                        </p>
                        <div className="flex mt-8">
                            <a href="#" className="uppercase py-2 px-4 rounded-lg bg-white border-transparent text-cyan-500 text-md mr-4">
                                See how it works
                            </a>
                            <a href="#" className="uppercase py-2 px-4 rounded-lg bg-transparent border-2 text-white text-md">
                                Start now
                            </a>
                        </div>
                    </div>
                    <div className="flex lg:h-auto lg:w-1/2">
                        <div className="object-cover w-full max-w-full rounded-md lg:h-full">
                            <img src={require("../../assets/freelancer.svg")} className=""/>
                        </div>
                    </div>
                </div>
            </div>

                    {/* <div className="">
                        <div className="text-[#034D82] font-bold text-4xl pb-10">
                            No artificial costs or restrictions
                        </div>
                        <div className="text-xl text-gray-600">
                            BlockJob doesn’t take a percentage of your earned Near. The amount of Near the employer pays is the amount the freelancer gets.
                        </div>
                    </div> */}
            {/* Segunda seccion */}
            <div className="bg-[#d2f0fa] p-10">
                <div className="font-bebas-neue grid grid-cols-2 gap-4">
                    <div className="flex justify-center">
                        <img src={require("../../assets/iphone-12.svg")}></img>
                    </div>
                    <div className="flex items-center">
                        <div>
                            <div className="text-[#034D82] font-bold text-4xl pb-10">
                                No artificial costs or restrictions
                            </div>
                            <div className="text-xl text-gray-600">
                                BlockJob doesn’t take a percentage of your earned Near. The amount of Near the employer pays is the amount the freelancer gets.
                            </div>
                            <div className="mt-10 flex">
                                <a className="text-[#04AADD] font-bold">Learn about this</a>
                                <svg xmlns="http://www.w3.org/2000/svg" role="img" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24">
                                    <path d="M13.293 7.293a.999.999 0 0 0 0 1.414L15.586 11H8a1 1 0 0 0 0 2h7.586l-2.293 2.293a.999.999 0 1 0 1.414 1.414L19.414 12l-4.707-4.707a.999.999 0 0 0-1.414 0z" fill="currentColor"/>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Tercera seccion */}
            <div className="p-10">
                <div className="font-bebas-neue grid grid-cols-2 gap-4">
                    <div className="flex items-center">
                        <div>
                            <div className="text-[#034D82] font-bold text-4xl pb-10">It’s all on blockchain!</div>
                            <div className="text-xl text-gray-600">The BlockJob database is distributed on the Near public blockchain and the source files are on IPFS. BlockJob is accessible to everyone forever, without any central authority having control over it.</div>
                            <div className="mt-10 flex">
                                <a className="text-[#04AADD] font-bold">Learn about this</a>
                                <svg xmlns="http://www.w3.org/2000/svg" role="img" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24">
                                    <path d="M13.293 7.293a.999.999 0 0 0 0 1.414L15.586 11H8a1 1 0 0 0 0 2h7.586l-2.293 2.293a.999.999 0 1 0 1.414 1.414L19.414 12l-4.707-4.707a.999.999 0 0 0-1.414 0z" fill="currentColor"/>
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-center">
                        <img src={require("../../assets/logo-black.svg")}></img>
                    </div>
                </div>
            </div>

            <Footer/>
        </>
    )
}
