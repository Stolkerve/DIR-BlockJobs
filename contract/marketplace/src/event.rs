use std::fmt::Display;
use near_sdk::serde::{Deserialize, Serialize};
// use serde_with::skip_serializing_none;

// #[derive(Serialize, Deserialize, Debug)]
// #[serde(rename_all = "snake_case")]
// pub enum NearEvent {
//     Service(Event),
//     User(Event),
// }

// #[derive(Serialize, Deserialize, Debug)]
// pub struct Event {
//     #[serde(flatten)]
//     event_kind: EventKind,
// }

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "snake_case")]
// #[serde(tag = "event", content = "data")]
// #[allow(clippy::enum_variant_names)]
pub enum NearEvent {
    ServiceMint(ServiceMintData),
    ServiceBuy(ServiceBuyData),
    ServiceReclaim(ServiceReclaimData),
    ServiceReturn(ServiceReturnData),
    ServiceUpdateMetadata(ServiceUpdateMetadataData),
    ServiceUpdateDuration(ServiceUpdateDurationData),
    ServiceUpdateOnSale(ServiceUpdateOnSaleData),
    UserNew(UserNewData),
    UserUpdateRoles(UserUpdateRolesData),
    UserUpdateDates(UserUpdateDatesData),
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ServiceMintData {
    id: String,
    creator: String,
    title: String,
    description: String,
    categories: String,
    price: String,
    duration: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ServiceBuyData {id: String, buyer: String}

#[derive(Serialize, Deserialize, Debug)]
pub struct ServiceReclaimData {id: String, sender: String}

#[derive(Serialize, Deserialize, Debug)]
pub struct ServiceReturnData {id: String, creator: String}

#[derive(Serialize, Deserialize, Debug)]
pub struct ServiceUpdateMetadataData {
    id: String,
    title: String,
    description: String,
    categories: String,
    price: String,
    duration: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ServiceUpdateDurationData {id: String, new_duration: String}

#[derive(Serialize, Deserialize, Debug)]
pub struct ServiceUpdateOnSaleData {id: String, on_sale: String}

// #[skip_serializing_none]
#[derive(Serialize, Deserialize, Debug)]
pub struct UserNewData {id: String, employee: bool, data: Option<String>, reputation: String, banned: String}

#[derive(Serialize, Deserialize, Debug)]
pub struct UserUpdateRolesData {id: String, remove: bool}

#[derive(Serialize, Deserialize, Debug)]
pub struct UserUpdateDatesData {id: String, data: String}


impl NearEvent {
    // Minteo de uno o mas servicios.
    pub fn log_service_mint(
        id: String, 
        creator: String, 
        title: String,
        description: String,
        categories: String,
        price: String, 
        duration: String,) 
    {
        let data = ServiceMintData {
            id, creator, title, description, categories, price, duration}
        ;
        NearEvent::ServiceMint(data).log();
    }

    // Compra de un servicio.
    pub fn log_service_buy(id: String,  buyer: String) {
        let data = ServiceBuyData {id, buyer};
        NearEvent::ServiceBuy(data).log();
    }

    // Reclamo de un servicio por parte del profesional.
    pub fn log_service_reclaim(id: String,  sender: String) {
        let data = ServiceReclaimData {id, sender};
        NearEvent::ServiceReclaim(data).log();
    }

    // Retorno de un servicio por parte de un Admin.
    pub fn log_service_return(id: String,  creator: String) {
        let data = ServiceReturnData {id, creator};
        NearEvent::ServiceReturn(data).log();
    }

    // TODO segmentar la metadata
    // Update de la metadata de un servicio por parte del profesional.
    pub fn log_service_update_metadata(
        id: String, 
        title: String,
        description: String,
        categories: String,
        price: String, 
        duration: String,) 
    {
        let data = ServiceUpdateMetadataData {
            id, title, description, categories, price, duration}
        ;
        NearEvent::ServiceUpdateMetadata(data).log();
    }

    // Update de la duracion de un servicio por parte del profesional.
    pub fn log_service_update_duration(id: String,  new_duration: String) {
        let data = ServiceUpdateDurationData {id, new_duration};
        NearEvent::ServiceUpdateDuration(data).log();
    }

    // Update de si un servicio esta o no en venta por parte del profesional.
    pub fn log_service_update_on_sale(id: String,  on_sale: String) {
        let data = ServiceUpdateOnSaleData {id, on_sale};
        NearEvent::ServiceUpdateOnSale(data).log();
    }


    // Registro de un nuevo usuario.
    pub fn log_user_new(id: String, employee: bool, data: Option<String>, reputation: String, banned: String) {
        let data = UserNewData {id, employee, data, reputation, banned};
        NearEvent::UserNew(data).log();
    }

    // Modificar la data de un usuario.
    pub fn log_user_update_data(id: String, data: String) {
        let data = UserUpdateDatesData {id, data};
        NearEvent::UserUpdateDates(data).log();
    }

    // Modificar los roles de un usuario.
    pub fn log_user_update_roles(id: String, remove: bool) {
        let data = UserUpdateRolesData {id, remove};
        NearEvent::UserUpdateRoles(data).log();
    }


    // Funciones internas.
    fn log(&self) {
        near_sdk::env::log(&self.to_string().as_bytes());
    }

    pub(crate) fn to_json_string(&self) -> String {
        serde_json::to_string(self).unwrap()
    }    
}

impl Display for NearEvent {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&format!("EVENT_JSON:{}", self.to_json_string()))
    }
}

// #[cfg(test)]
// mod tests {
//     use super::*;

//     fn make_tokens(s_vec: Vec<&str) -> String> {
//         s_vec.iter().map(|t| t.to_string()).collect()
//     }

//     #[test]
//     fn service_mint() {
//         let owner = "bob".to_string();
//         let token = make_tokens("0", "1"]);
//         let mint_log = ServiceMintData { owner, token, memo: None };
//         let event_log = NearEvent::service_mint(mint_log]);
//         assert_eq!(
//             serde_json::to_string(&event_log).unwrap(),
//             r#"{"standard":"nep171","version":"1.0.0","event":"service_mint","data":[{"owner":"bob","token":["0","1"]}]}"#
//         );
//     }

//     #[test]
//     fn service_mints() {
//         let owner = "bob".to_string();
//         let token = make_tokens("0", "1"]);
//         let mint_log = ServiceMintData { owner, token, memo: None };
//         let event_log = NearEvent::service_mint(
//             mint_log,
//             ServiceMintData {
//                 owner: "alice".to_string(),
//                 token: make_tokens("2", "3"]),
//                 memo: Some("has memo".to_string()),
//             },
//         ]);
//         assert_eq!(
//             serde_json::to_string(&event_log).unwrap(),
//             r#"{"standard":"nep171","version":"1.0.0","event":"service_mint","data":[{"owner":"bob","token":["0","1"]},{"owner":"alice","token":["2","3"],"memo":"has memo"}]}"#
//         );
//     }

//     #[test]
//     fn service_buy() {
//         let owner = "bob".to_string();
//         let token = make_tokens("0", "1"]);
//         let log = NearEvent::service_buy(ServiceBuyData {
//             owner,
//             authorized: None,
//             token,
//             memo: None,
//         }])
//             .to_json_string();
//         assert_eq!(
//             log,
//             r#"{"standard":"nep171","version":"1.0.0","event":"service_buy","data":[{"owner":"bob","token":["0","1"]}]}"#
//         );
//     }

//     #[test]
//     fn service_buys() {
//         let owner = "bob".to_string();
//         let token = make_tokens("0", "1"]);
//         let log = NearEvent::service_buy(
//             ServiceBuyData {
//                 owner: "alice".to_string(),
//                 authorized: Some("4".to_string()),
//                 token: make_tokens("2", "3"]),
//                 memo: Some("has memo".to_string()),
//             },
//             ServiceBuyData { owner, authorized: None, token, memo: None },
//         ])
//             .to_json_string();
//         assert_eq!(
//             log,
//             r#"{"standard":"nep171","version":"1.0.0","event":"service_buy","data":[{"authorized":"4","owner":"alice","token":["2","3"],"memo":"has memo"},{"owner":"bob","token":["0","1"]}]}"#
//         );
//     }

//     #[test]
//     fn service_reclaim() {
//         let old_owner = "bob".to_string();
//         let new_owner = "alice".to_string();
//         let token = make_tokens("0", "1"]);
//         let log = NearEvent::service_reclaim(ServiceReclaimData {
//             old_owner,
//             new_owner,
//             authorized: None,
//             token,
//             memo: None,
//         }])
//             .to_json_string();
//         assert_eq!(
//             log,
//             r#"{"standard":"nep171","version":"1.0.0","event":"service_reclaim","data":[{"old_owner":"bob","new_owner":"alice","token":["0","1"]}]}"#
//         );
//     }

//     #[test]
//     fn service_reclaims() {
//         let old_owner = "bob";
//         let new_owner = "alice";
//         let token = make_tokens("0", "1"]);
//         let log = NearEvent::service_reclaim(
//             ServiceReclaimData {
//                 old_owner: new_owner.to_string(),
//                 new_owner: old_owner.to_string(),
//                 authorized: Some("4".to_string()),
//                 token: make_tokens("2", "3"]),
//                 memo: Some("has memo".to_string()),
//             },
//             ServiceReclaimData {
//                 old_owner: old_owner.to_string(),
//                 new_owner: new_owner.to_string(),
//                 authorized: None,
//                 token,
//                 memo: None,
//             },
//         ])
//             .to_json_string();
//         assert_eq!(
//             log,
//             r#"{"standard":"nep171","version":"1.0.0","event":"service_reclaim","data":[{"authorized":"4","old_owner":"alice","new_owner":"bob","token":["2","3"],"memo":"has memo"},{"old_owner":"bob","new_owner":"alice","token":["0","1"]}]}"#
//         );
//     }
// }