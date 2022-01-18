import React, { useEffect } from "react";

import ServicesCard from "../components/ServicesCard";

export default function Services() {

    useEffect(() => {

    }, [])

    return (
        <div>
            <ServicesCard service={{
                id: 0,
                metadata: {
                    title: "Te hago tu pagina web",
                    description: "Descripcion larga larga larga",
                    icon: "https://blog.desdelinux.net/wp-content/uploads/2018/09/granja-servidores.jpg",
                    price: 12123222222,
                    categories: ""
                },
                creator_id: "stolkerve.testnet",
                actual_owner: "dariosanchez.testnet",
                employers_account_ids: ["dariosanchez.testnet"],
                duration: 7,
                buy_moment: 21312321323123213,
                sold: true,
                on_sale: false,
                on_dispute: false
            }}/>
        </div>
    )
}