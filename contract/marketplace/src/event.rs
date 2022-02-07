use std::fmt::Display;
use std::string::ToString;
use near_sdk::serde::{Deserialize, Serialize};
use serde_with::skip_serializing_none;

// #[derive(Serialize, Deserialize, Debug)]
// #[serde(rename_all = "snake_case")]
// pub enum Event {
//     Service(Event),
//     Services,
//     User(Event),
// }

// #[derive(Serialize, Deserialize, Debug)]
// pub struct Event {
//     #[serde(flatten)]
//     event_kind: Event,
// }

#[derive(Serialize, Deserialize, Debug)]
// #[serde(tag = "event", content = "data")]
#[serde(rename_all = "snake_case")]
// #[allow(clippy::enum_variant_names)]
pub enum Event {
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
    id: u64,
    creator_id: String,
    title: String,
    description: String,
    categories: String,
    price: u128,
    duration: u16,
    // actual_owner: String,
    // sold: bool,
    // on_sale: bool,
    // on_dispute: bool,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ServiceBuyData {id: u64, buyer_id: String}

#[derive(Serialize, Deserialize, Debug)]
pub struct ServiceReclaimData {id: u64, sender_id: String}

#[derive(Serialize, Deserialize, Debug)]
pub struct ServiceReturnData {id: u64, creator_id: String}

#[derive(Serialize, Deserialize, Debug)]
pub struct ServiceUpdateMetadataData {
    id: u64,
    title: String,
    description: String,
    categories: String,
    price: u128,
    duration: u16,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ServiceUpdateDurationData {id: u64, new_duration: u16}

#[derive(Serialize, Deserialize, Debug)]
pub struct ServiceUpdateOnSaleData {id: u64, on_sale: bool}

#[skip_serializing_none]
#[derive(Serialize, Deserialize, Debug)]
pub struct UserNewData {id: String, roles: String, data: Option<String>, reputation: i16, banned: bool}

#[derive(Serialize, Deserialize, Debug)]
pub struct UserUpdateRolesData {id: String, roles: String}

#[derive(Serialize, Deserialize, Debug)]
pub struct UserUpdateDatesData {id: String, data: String}



impl Display for Event {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        // f.write_str(&format!("EVENT_JSON:{}", self.to_json_string()))
        f.write_str(&format!("{}", self.to_json_string()))
    }
}

impl Event {
    // Minteo de uno o mas servicios.
    pub fn log_service_mint(
        id: u64, 
        creator_id: String, 
        title: String,
        description: String,
        categories: String,
        price: u128, 
        duration: u16,) 
    {
        let data = ServiceMintData {
            id, creator_id, title, description, categories, price, duration
        };
        Event::ServiceMint(data).log();
    }

    // Compra de un servicio.
    pub fn log_service_buy(id: u64,  buyer_id: String) {
        let data = ServiceBuyData {id, buyer_id};
        Event::ServiceBuy(data).log();
    }

    // Reclamo de un servicio por parte del profesional.
    pub fn log_service_reclaim(id: u64,  sender_id: String) {
        let data = ServiceReclaimData {id, sender_id};
        Event::ServiceReclaim(data).log();
    }

    // Retorno de un servicio por parte de un Admin.
    pub fn log_service_return(id: u64,  creator_id: String) {
        let data = ServiceReturnData {id, creator_id};
        Event::ServiceReturn(data).log();
    }

    // TODO segmentar la metadata
    // Update de la metadata de un servicio por parte del profesional.
    pub fn log_service_update_metadata(
        id: u64, 
        title: String,
        description: String,
        categories: String,
        price: u128, 
        duration: u16,) 
    {
        let data = ServiceUpdateMetadataData {
            id, title, description, categories, price, duration
        };
        Event::ServiceUpdateMetadata(data).log();
    }

    // Update de la duracion de un servicio por parte del profesional.
    pub fn log_service_update_duration(id: u64,  new_duration: u16) {
        let data = ServiceUpdateDurationData {id, new_duration};
        Event::ServiceUpdateDuration(data).log();
    }

    // Update de si un servicio esta o no en venta por parte del profesional.
    pub fn log_service_update_on_sale(id: u64,  on_sale: bool) {
        let data = ServiceUpdateOnSaleData {id, on_sale};
        Event::ServiceUpdateOnSale(data).log();
    }

    // Registro de un nuevo usuario.
    pub fn log_user_new(id: String, roles: String, data: Option<String>, reputation: i16, banned: bool) {
        let data = UserNewData {id, roles, data, reputation, banned};
        Event::UserNew(data).log();
    }

    // Modificar la data de un usuario.
    pub fn log_user_update_data(id: String, data: String) {
        let data = UserUpdateDatesData {id, data};
        Event::UserUpdateDates(data).log();
    }

    // Modificar los roles de un usuario.
    pub fn log_user_update_roles(id: String, roles: String) {
        let data = UserUpdateRolesData {id, roles};
        Event::UserUpdateRoles(data).log();
    }


    // Funciones internas.
    fn log(&self) {
        near_sdk::env::log(&self.to_string().as_bytes());
    }

    pub(crate) fn to_json_string(&self) -> String {
        serde_json::to_string(self).unwrap()
    }    
    
}

// #[cfg(test)]
// mod tests {
//     use super::*;

//     fn make_tokens(s_vec: Vec<&str>) -> String> {
//         s_vec.iter().map(|t| t.to_string()).collect()
//     }

//     #[test]
//     fn service_mint() {
//         let owner_id = "bob".to_string();
//         let token_ids = make_tokens(vec!["0", "1"]);
//         let mint_log = ServiceMintData { owner_id, token_ids, memo: None };
//         let event_log = Event::service_mint(vec![mint_log]);
//         assert_eq!(
//             serde_json::to_string(&event_log).unwrap(),
//             r#"{"standard":"nep171","version":"1.0.0","event":"service_mint","data":[{"owner_id":"bob","token_ids":["0","1"]}]}"#
//         );
//     }

//     #[test]
//     fn service_mints() {
//         let owner_id = "bob".to_string();
//         let token_ids = make_tokens(vec!["0", "1"]);
//         let mint_log = ServiceMintData { owner_id, token_ids, memo: None };
//         let event_log = Event::service_mint(vec![
//             mint_log,
//             ServiceMintData {
//                 owner_id: "alice".to_string(),
//                 token_ids: make_tokens(vec!["2", "3"]),
//                 memo: Some("has memo".to_string()),
//             },
//         ]);
//         assert_eq!(
//             serde_json::to_string(&event_log).unwrap(),
//             r#"{"standard":"nep171","version":"1.0.0","event":"service_mint","data":[{"owner_id":"bob","token_ids":["0","1"]},{"owner_id":"alice","token_ids":["2","3"],"memo":"has memo"}]}"#
//         );
//     }

//     #[test]
//     fn service_buy() {
//         let owner_id = "bob".to_string();
//         let token_ids = make_tokens(vec!["0", "1"]);
//         let log = Event::service_buy(ServiceBuyData {
//             owner_id,
//             authorized_id: None,
//             token_ids,
//             memo: None,
//         }])
//             .to_json_string();
//         assert_eq!(
//             log,
//             r#"{"standard":"nep171","version":"1.0.0","event":"service_buy","data":[{"owner_id":"bob","token_ids":["0","1"]}]}"#
//         );
//     }

//     #[test]
//     fn service_buys() {
//         let owner_id = "bob".to_string();
//         let token_ids = make_tokens(vec!["0", "1"]);
//         let log = Event::service_buy(vec![
//             ServiceBuyData {
//                 owner_id: "alice".to_string(),
//                 authorized_id: Some("4".to_string()),
//                 token_ids: make_tokens(vec!["2", "3"]),
//                 memo: Some("has memo".to_string()),
//             },
//             ServiceBuyData { owner_id, authorized_id: None, token_ids, memo: None },
//         ])
//             .to_json_string();
//         assert_eq!(
//             log,
//             r#"{"standard":"nep171","version":"1.0.0","event":"service_buy","data":[{"authorized_id":"4","owner_id":"alice","token_ids":["2","3"],"memo":"has memo"},{"owner_id":"bob","token_ids":["0","1"]}]}"#
//         );
//     }

//     #[test]
//     fn service_reclaim() {
//         let old_owner_id = "bob".to_string();
//         let new_owner_id = "alice".to_string();
//         let token_ids = make_tokens(vec!["0", "1"]);
//         let log = Event::service_reclaim(ServiceReclaimData {
//             old_owner_id,
//             new_owner_id,
//             authorized_id: None,
//             token_ids,
//             memo: None,
//         }])
//             .to_json_string();
//         assert_eq!(
//             log,
//             r#"{"standard":"nep171","version":"1.0.0","event":"service_reclaim","data":[{"old_owner_id":"bob","new_owner_id":"alice","token_ids":["0","1"]}]}"#
//         );
//     }

//     #[test]
//     fn service_reclaims() {
//         let old_owner_id = "bob";
//         let new_owner_id = "alice";
//         let token_ids = make_tokens(vec!["0", "1"]);
//         let log = Event::service_reclaim(vec![
//             ServiceReclaimData {
//                 old_owner_id: new_owner_id.to_string(),
//                 new_owner_id: old_owner_id.to_string(),
//                 authorized_id: Some("4".to_string()),
//                 token_ids: make_tokens(vec!["2", "3"]),
//                 memo: Some("has memo".to_string()),
//             },
//             ServiceReclaimData {
//                 old_owner_id: old_owner_id.to_string(),
//                 new_owner_id: new_owner_id.to_string(),
//                 authorized_id: None,
//                 token_ids,
//                 memo: None,
//             },
//         ])
//             .to_json_string();
//         assert_eq!(
//             log,
//             r#"{"standard":"nep171","version":"1.0.0","event":"service_reclaim","data":[{"authorized_id":"4","old_owner_id":"alice","new_owner_id":"bob","token_ids":["2","3"],"memo":"has memo"},{"old_owner_id":"bob","new_owner_id":"alice","token_ids":["0","1"]}]}"#
//         );
//     }
// }