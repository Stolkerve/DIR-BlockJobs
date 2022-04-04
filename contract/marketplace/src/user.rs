use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{AccountId};

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone, Debug)]
#[serde(crate = "near_sdk::serde")]
pub struct Idiom {
    idiom: String,
    level: String
}

// No deberia dar problemas
#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone, Debug)]
#[serde(crate = "near_sdk::serde")]
pub struct PersonalData {
    pub legal_name: String,
    pub education: String,
    pub links: Vec<String>,
    pub picture: String,
    pub bio: String,
    pub country: String,
    pub email: String,
    pub idioms: Vec<Idiom>
}
 
#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone, Debug)]
#[serde(crate = "near_sdk::serde")]
pub struct User {
    pub account_id: AccountId,
    pub reputation: u16,
    pub votes: u16,
    pub is_employee: bool,
    pub is_company: bool,
    pub personal_data: Option<String>,
    /*
        personal_data:  {
            legal_name: "",
            education: "",
            links: "",
            picture: "",
            bio: "",
            country: "",
            languages: [{
                language: "Ingles",
                level: "Intermedio"
            }]
        }
    */
    pub banned: bool,
}
