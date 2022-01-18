import React from "react";

export default function ServicesCard(props) {
    return (
        <div className="rounded-md border-2 border-sky-400 p-4 my-8 mx-4">
            <div className="flex items-center">
                <img className="w-32 h-32 rounded-full mr-8" src={props.service.metadata.icon}/>
                <div>
                    <div>{props.service.metadata.title}</div>
                    <div>{props.service.metadata.description}</div>
                </div>
            </div>
            <div className="flex">
                <div>Actual Owner {props.service.actual_owner}</div>
                <div>Duration {props.service.duration} Days</div>
                <div>Sold {props.service.sold}</div>
                <div>On Sale {props.service.on_sale}</div>
                <div>On Dispute {props.service.on_dispute}</div>
            </div>
            <div>
                Creator {props.service.creator_id}
            </div>
        </div>
    )
}