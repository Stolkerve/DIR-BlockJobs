import { utils } from "near-api-js";
import React, { useEffect, useState } from "react";

import { FaWallet } from "react-icons/fa"

import BuyJobsCoinDialog from "../components/BuyJobsCoinDialog";
import { ftTransferCallJOBS, ftTransferCallUSDC, getFTBalanceOf, getJOBSBalanceOf, getUSDCBalanceOf, withdrawFT } from "../utils";

export default function MyTokens() {
	const [loading, setLoading] = useState(true)
	const [USDCBalance, setUSDCBalance] = useState(0)
	const [USDCWalletBalance, setUSDWalletCBalance] = useState(0)
	const [JOBSWalletBalance, setJOBSWalletCBalance] = useState(0)
	const [JOBSBalance, setJOBSBalance] = useState(0)
	const [nearBalance, setNearBalance] = useState(0)
	let [isOpen, setIsOpen] = useState(false)

	useEffect(async () => {
		console.log((0.1 * (10 ** 18)).toLocaleString().replaceAll(".", ""))

		// let balanceOfJOBS = await getFTBalanceOf(window.accountId, "ft.blockjobs.testnet");
		// if (balanceOfJOBS != 0) {
		//     balanceOfJOBS = balanceOfJOBS.toLocaleString().replaceAll(".", "")
		//     balanceOfJOBS = utils.format.formatNearAmount(balanceOfJOBS, 4)
		// }
		// let balanceOfUSDC = await getFTBalanceOf(window.accountId, "usdc.fakes.testnet");
		// if (balanceOfUSDC != 0) {
		//     balanceOfUSDC.toLocaleString().replaceAll(".", "")
		//     balanceOfUSDC = utils.format.formatNearAmount(balanceOfUSDC, 4)
		// }

		let jobsBal = await getJOBSBalanceOf(window.accountId)
		jobsBal = jobsBal.toLocaleString().replaceAll(".", "")
		jobsBal = utils.format.formatNearAmount(jobsBal, 4);
		console.log(jobsBal)
		setJOBSWalletCBalance(jobsBal)
		setUSDWalletCBalance(await getUSDCBalanceOf(window.accountId));
		// setUSDCBalance(balanceOfUSDC)
		// setJOBSBalance(balanceOfJOBS)
		setNearBalance(utils.format.formatNearAmount((await window.walletConnection.account().getAccountBalance()).available, 4))

		setLoading(false)
	}, [])

	function closeModal() {
		setIsOpen(false)
	}

	function openModal() {
		setIsOpen(true)
	}

	return (
		<div className="m-8 w-full">
			{
				loading ? (
					<div></div>
				) : (

					<div className="mx-auto">
						<table class="table-auto">
							<thead>
								<tr>
									<th className="text-left">Tokens</th>
									{/* <th className="text-left">
								<div className="flex flex-row items-center ml-8">
									<FaWallet className=" mr-2"/>
									NEAR
								</div>
							</th> */}
									<th className="text-left mr-8">
										<div className="flex flex-row items-center ml-8">
											<FaWallet className=" mx-2" />
											NEAR
										</div>
									</th>
									<th className="text-left mr-8">
										<div className="flex flex-row items-center ml-8">
											<FaWallet className=" mx-2" />
											BlockJobs
										</div>
									</th>
									<th></th>
								</tr>
							</thead>
							<tbody>

								<tr>
									<td>
										<div className="flex flex-row items-center">
											<img className="my-2 w-[40px]" src={require("../../assets/jobs_test.svg")}></img>
											<div className="font-semibold ml-2">JOBS</div>
										</div>
									</td>
									<td className="text-right">
										<div>
											{JOBSWalletBalance != 0 ? JOBSWalletBalance : "-"}
										</div>
									</td>
									<td className="text-right">
										<div>
											{JOBSBalance != 0 ? JOBSBalance : "-"}
										</div>
									</td>
									<td className="flex pl-8">
										<button
											className="uppercase py-2 px-4 rounded-lg border-transparent text-white text-md mr-4 bg-[#27C0EF] shadow-md transition ease-in-out hover:scale-105 hover:-translate-y-0.5 duration-300 shadow-[#27C0EF]/80"
											onClick={() => {
												openModal()
											}}
										>
											Compra
										</button>
										<button
											className="uppercase py-2 px-4 rounded-lg border-transparent text-white text-md mr-4 bg-[#27C0EF] shadow-md transition ease-in-out hover:scale-105 hover:-translate-y-0.5 duration-300 shadow-[#27C0EF]/80"
											onClick={() => {
												window.open("https://testnet.ref.finance/", "_blank")
											}}
										>
											Trade
										</button>
										<button
											className="uppercase py-2 px-4 rounded-lg border-transparent text-white text-md mr-4 bg-[#27C0EF] shadow-md transition ease-in-out hover:scale-105 hover:-translate-y-0.5 duration-300 shadow-[#27C0EF]/80"
											onClick={() => {
												ftTransferCallJOBS((0.05 * (10 ** 18)).toLocaleString().replaceAll(".", ""))
											}}
										>
											Depositar
										</button>
										<button
											className="uppercase py-2 px-4 rounded-lg border-transparent text-white text-md mr-4 bg-[#27C0EF] shadow-md transition ease-in-out hover:scale-105 hover:-translate-y-0.5 duration-300 shadow-[#27C0EF]/80"
											onClick={() => {
												withdrawFT((1 * (10 ** 18)), "jobs")
											}}
										>
											Withdraw
										</button>
									</td>
								</tr>
								<tr>
									<td>
										<div className="flex flex-row items-center">
											<img className="my-2 w-[40px]" src={require("../../assets/usd-coin-usdc-logo.svg")}></img>
											<div className="font-semibold ml-2">USDC</div>
										</div>
									</td>
									<td className="text-right">
										<div>
											{USDCWalletBalance != 0 ? USDCWalletBalance : "-"}
										</div>
									</td>
									<td className="text-right">
										<div>
											{USDCBalance != 0 ? USDCBalance : "-"}
										</div>
									</td>
									<td className="flex pl-8">
										<button
											className="uppercase py-2 px-4 rounded-lg border-transparent text-white text-md mr-4 bg-[#27C0EF] shadow-md transition ease-in-out hover:scale-105 hover:-translate-y-0.5 duration-300 shadow-[#27C0EF]/80"
											onClick={() => {
												ftTransferCallUSDC((0.1 * (10 ** 18)).toLocaleString().replaceAll(".", ""))
											}}
										>
											Depositar
										</button>
										<button
											className="uppercase py-2 px-4 rounded-lg border-transparent text-white text-md mr-4 bg-[#27C0EF] shadow-md transition ease-in-out hover:scale-105 hover:-translate-y-0.5 duration-300 shadow-[#27C0EF]/80"
											onClick={() => {
												withdrawFT(0.1 * (10 ** 18).toLocaleString().replaceAll(".", ""), "jobs")
											}}
										>
											Withdraw
										</button>
									</td>
								</tr>
								<tr>
									<td>
										<div className="flex flex-row items-center">
											<img className="my-2 w-[40px]" src={require("../../assets/logo-black.svg")}></img>
											<div className="font-semibold ml-2">NEAR</div>
										</div>
									</td>
									<td className="text-right">
										<div>
											{nearBalance}
										</div>
									</td>
									<td className="text-right">-</td>
								</tr>
							</tbody>

						</table>
						<BuyJobsCoinDialog closeModal={closeModal} isOpen={isOpen} openModal={openModal} />
					</div>
				)
			}
			{/* <div className="mt-8">
				<div className="shadow-md border-2 rounded-md mr-4 whitespace-pre-wrap p-4">
					<div className="text-2xl font-bold text-gray-800 mb-2 text-center">Transacciones</div>
					{
						[0, 1, 2, 3, 4, 5].map((v, i) => {
							return (
								<div key={i} className="my-6">
									<SkeletonLoaderService />
								</div>
							)
						})
					}
				</div>
			</div> */}
		</div>
	)
}