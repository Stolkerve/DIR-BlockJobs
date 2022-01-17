import React, { useEffect, useState } from "react";
import { Routes, Route, useMatch, useLocation, useNavigate } from "react-router-dom";

import UserProfile from '../views/UserProfile';
import Services from '../views/Services';
import Disputes from '../views/Disputes';

export default function DashBoard() {
	const leftSize = ["Profile", "Services", "Disputes"]
	const navigate = useNavigate()
	const location = useLocation()

	let [selectedLeftSize, setSelectedLeftSize] = useState(0)
	

	useEffect(() => {
		for (let index = 0; index < leftSize.length; index++) {
			console.log(location.pathname)
			console.log(`/dashboard/${leftSize[index]}`)
			let match = location.pathname == `/dashboard/${leftSize[index]}`
			console.log(match)
			if(match) {
				setSelectedLeftSize(index)
				break
			} 
		}
	}, [])

    return (
	<div className="flex">
	    <div className="min-w-[100px] min-h-screen h-auto bg-[#F8F7FF]">
			{
				["Profile", "Services", "Disputes"].map((v, i) => {return (
					<div className="flex justify-between" key={i}>
						{
							selectedLeftSize == i ? (
								<button onClick={() => {
										setSelectedLeftSize(i)
										navigate(`/dashboard/${leftSize[i]}`)
									}}
									className="text-[#352E5B] border-violet-600 border-r-2 text-left py-4 pl-6 w-full pr-14"
								>{v}</button>
							) : (
								<button onClick={() => {
									setSelectedLeftSize(i)
									navigate(`/dashboard/${leftSize[i]}`)
								}}
								className="text-[#A5A2B8] text-left py-4 pl-6 w-full pr-14"
								>{v}</button>
							)
						}
					</div>
				)})
			}
		</div>
		<Routes>
            <Route 	path="profile" 		element={<UserProfile />}/>
            <Route 	path="services" 	element={<Services />}/>
            <Route 	path="disputes" 	element={<Disputes />}/>
        </Routes>
	</div>
    )
}
