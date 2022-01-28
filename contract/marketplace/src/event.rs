use std::fmt::Display;
use near_sdk::serde::{Deserialize, Serialize};
use serde_with::skip_serializing_none;

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "snake_case")]
pub enum NearEvent {
    Service(Event),
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Event {
    #[serde(flatten)]
    pub event_kind: EventKind,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "event", content = "data")]
#[serde(rename_all = "snake_case")]
#[allow(clippy::enum_variant_names)]
pub enum EventKind {
    ServiceMint(Vec<ServiceMintData>),
    ServiceTransfer(Vec<ServiceTransferData>),
    ServiceBurn(Vec<ServiceBurnData>),
}

#[skip_serializing_none]
#[derive(Serialize, Deserialize, Debug)]
pub struct ServiceMintData {
    // pub owner_id: String,
    // pub token_ids: Vec<String>,
    // pub memo: Option<String>,
    pub id: u64,
    pub creator_id: String,
    pub title: String,
    pub description: String,
    pub categries: String,
    pub price: u128,
    pub duration: u16,
    // pub actual_owner: String,
    // pub sold: bool,
    // pub on_sale: bool,
    // pub on_dispute: bool,
}

#[skip_serializing_none]
#[derive(Serialize, Deserialize, Debug)]
pub struct ServiceTransferData {
    pub authorized_id: Option<String>,
    pub old_owner_id: String,
    pub new_owner_id: String,
    pub token_ids: Vec<String>,
    pub memo: Option<String>,
}

#[skip_serializing_none]
#[derive(Serialize, Deserialize, Debug)]
pub struct ServiceBurnData {
    pub authorized_id: Option<String>,
    pub owner_id: String,
    pub token_ids: Vec<String>,
    pub memo: Option<String>,
}

impl Display for NearEvent {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&format!("EVENT_JSON:{}", self.to_json_string()))
    }
}

impl NearEvent {
    pub fn new(event_kind: EventKind) -> Self {
        NearEvent::Service(Event { event_kind })
    }

    pub fn service_burn(data: Vec<ServiceBurnData>) -> Self {
        NearEvent::new(EventKind::ServiceBurn(data))
    }
    pub fn service_transfer(data: Vec<ServiceTransferData>) -> Self {
        NearEvent::new(EventKind::ServiceTransfer(data))
    }

    pub fn service_mint(data: Vec<ServiceMintData>) -> Self {
        NearEvent::new(EventKind::ServiceMint(data))
    }

    pub(crate) fn to_json_string(&self) -> String {
        serde_json::to_string(self).unwrap()
    }

    pub fn log(&self) {
        near_sdk::env::log(&self.to_string().as_bytes());
    }

    pub fn log_service_mint(
        id: u64, 
        creator_id: String, 
        title: String,
        description: String,
        categries: String,
        price: u128, 
        duration: u16,) {
        NearEvent::log_service_mints(vec![ServiceMintData {
            id, creator_id, title, description, categries, price, duration}]);
    }

    pub fn log_service_mints(data: Vec<ServiceMintData>) {
        NearEvent::service_mint(data).log();
    }

    pub fn log_service_transfer(
        old_owner_id: String,
        new_owner_id: String,
        token_ids: Vec<String>,
        memo: Option<String>,
        authorized_id: Option<String>,
    ) {
        NearEvent::log_service_transfers(vec![ServiceTransferData {
            authorized_id,
            old_owner_id,
            new_owner_id,
            token_ids,
            memo,
        }]);
    }

    pub fn log_service_transfers(data: Vec<ServiceTransferData>) {
        NearEvent::service_transfer(data).log();
    }

    pub fn log_service_burn(
        owner_id: String,
        token_ids: Vec<String>,
        memo: Option<String>,
        authorized_id: Option<String>,
    ) {
        NearEvent::log_service_burns(vec![ServiceBurnData { owner_id, authorized_id, token_ids, memo }]);
    }

    pub fn log_service_burns(data: Vec<ServiceBurnData>) {
        NearEvent::service_burn(data).log();
    }
}

// #[cfg(test)]
// mod tests {
//     use super::*;

//     fn make_tokens(s_vec: Vec<&str>) -> Vec<String> {
//         s_vec.iter().map(|t| t.to_string()).collect()
//     }

//     #[test]
//     fn service_mint() {
//         let owner_id = "bob".to_string();
//         let token_ids = make_tokens(vec!["0", "1"]);
//         let mint_log = ServiceMintData { owner_id, token_ids, memo: None };
//         let event_log = NearEvent::service_mint(vec![mint_log]);
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
//         let event_log = NearEvent::service_mint(vec![
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
//     fn service_burn() {
//         let owner_id = "bob".to_string();
//         let token_ids = make_tokens(vec!["0", "1"]);
//         let log = NearEvent::service_burn(vec![ServiceBurnData {
//             owner_id,
//             authorized_id: None,
//             token_ids,
//             memo: None,
//         }])
//             .to_json_string();
//         assert_eq!(
//             log,
//             r#"{"standard":"nep171","version":"1.0.0","event":"service_burn","data":[{"owner_id":"bob","token_ids":["0","1"]}]}"#
//         );
//     }

//     #[test]
//     fn service_burns() {
//         let owner_id = "bob".to_string();
//         let token_ids = make_tokens(vec!["0", "1"]);
//         let log = NearEvent::service_burn(vec![
//             ServiceBurnData {
//                 owner_id: "alice".to_string(),
//                 authorized_id: Some("4".to_string()),
//                 token_ids: make_tokens(vec!["2", "3"]),
//                 memo: Some("has memo".to_string()),
//             },
//             ServiceBurnData { owner_id, authorized_id: None, token_ids, memo: None },
//         ])
//             .to_json_string();
//         assert_eq!(
//             log,
//             r#"{"standard":"nep171","version":"1.0.0","event":"service_burn","data":[{"authorized_id":"4","owner_id":"alice","token_ids":["2","3"],"memo":"has memo"},{"owner_id":"bob","token_ids":["0","1"]}]}"#
//         );
//     }

//     #[test]
//     fn service_transfer() {
//         let old_owner_id = "bob".to_string();
//         let new_owner_id = "alice".to_string();
//         let token_ids = make_tokens(vec!["0", "1"]);
//         let log = NearEvent::service_transfer(vec![ServiceTransferData {
//             old_owner_id,
//             new_owner_id,
//             authorized_id: None,
//             token_ids,
//             memo: None,
//         }])
//             .to_json_string();
//         assert_eq!(
//             log,
//             r#"{"standard":"nep171","version":"1.0.0","event":"service_transfer","data":[{"old_owner_id":"bob","new_owner_id":"alice","token_ids":["0","1"]}]}"#
//         );
//     }

//     #[test]
//     fn service_transfers() {
//         let old_owner_id = "bob";
//         let new_owner_id = "alice";
//         let token_ids = make_tokens(vec!["0", "1"]);
//         let log = NearEvent::service_transfer(vec![
//             ServiceTransferData {
//                 old_owner_id: new_owner_id.to_string(),
//                 new_owner_id: old_owner_id.to_string(),
//                 authorized_id: Some("4".to_string()),
//                 token_ids: make_tokens(vec!["2", "3"]),
//                 memo: Some("has memo".to_string()),
//             },
//             ServiceTransferData {
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
//             r#"{"standard":"nep171","version":"1.0.0","event":"service_transfer","data":[{"authorized_id":"4","old_owner_id":"alice","new_owner_id":"bob","token_ids":["2","3"],"memo":"has memo"},{"old_owner_id":"bob","new_owner_id":"alice","token_ids":["0","1"]}]}"#
//         );
//     }
// }