import React, {useEffect, useState} from 'react'
import {useParams} from 'react-router-dom';
import {toast} from 'react-toastify'

export default function UserProfile(props) {
    let [loading, setLoading] = useState(true)
    let [user, setUser] = useState()
    const params = useParams();

    let userNearId = null 
    if (params.id) {
	userNearId = params.id
    }
    else {
	userNearId = props.userid
    }

    useEffect(async ()=>{
	console.log(userNearId)
	try {
	    let user = await window.contract.get_user({account_id: window.accountId})
	    user.personal_data = JSON.parse(user.personal_data)
	    setUser(user)
	    setLoading(false)
	    console.log(user)
	} catch(e) {
	    setLoading(false)
	    toast.error(String(e.message.match("\".*\"")))
	    console.log(e)
	}
    }, [])

    return (
        <>
	    {
		loading ? (
		    <div className="h-screen">
			<svg className="spinner" viewBox="0 0 50 50">
			    <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
			</svg>
		    </div>
		) : (
		    <div>
		    {
			`
			user NEAR id: ${user.account_id}
			user mint: ${user.mints}
			user roles: ${user.roles}
			user reputation: ${user.reputation}
			user personal data:
			    lega name: ${user.personal_data.legal_name} 
			    lega name: ${user.personal_data.education} 
			    lega name: ${user.personal_data.links} 
			    lega name: ${user.personal_data.picture}
			    lega name: ${user.personal_data.bio} 
			    lega name: ${user.personal_data.country} 
			`
		    }	
		    </div>
		)	    
	    }
	</>
    )
}
