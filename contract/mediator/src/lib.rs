use near_sdk::{env, near_bindgen, AccountId, setup_alloc, Balance, PanicOnDefault, EpochHeight};
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::json_types::{ValidAccountId};
use near_sdk::serde::{Serialize};
use near_sdk::collections::{LookupMap, UnorderedMap, LazyOption, Vector};
use std::convert::TryFrom;

const YOCTO_NEAR: u128 = 1000000000000000000000000;
const STORAGE_PRICE_PER_BYTE: Balance = 10_000_000_000_000_000_000;
const MAX_JURIES: u8 = 20;

pub(crate) fn string_to_valid_account_id(account_id: &String) -> ValidAccountId{
    return ValidAccountId::try_from((*account_id).to_string()).unwrap();
}

pub(crate) fn unique_prefix(account_id: &AccountId) -> Vec<u8> {
    let mut prefix = Vec::with_capacity(33);
    prefix.push(b'o');
    prefix.extend(env::sha256(account_id.as_bytes()));
    prefix
}

setup_alloc!();

pub type DisputeId = u128;
pub type ServiceAmount = u64;

#[derive(Serialize, BorshDeserialize, BorshSerialize)]
#[serde(crate = "near_sdk::serde")]
pub struct Vote {
    // Miembro del jurado que emite el voto
    account: AccountId,
    // Decisión tomada 
    ruling: bool,
}

#[derive(Serialize, BorshDeserialize, BorshSerialize)]
#[serde(crate = "near_sdk::serde")]
pub enum DisputeStatus {
    Open,
    Resolving,
    Executable,
    Finished
}

#[derive(BorshDeserialize, BorshSerialize)]
pub struct Dispute {
    // Identificador para cada disputa
    id: DisputeId,
    services_id: u64,

    // Cantidad de  miembros de jurado para la disputa
    max_juries: u8,

    // Lista de miembros del jurado y sus respectivos services a retirar
    jury: LookupMap<AccountId, ServiceAmount>,
    dispute_status: DisputeStatus,
    votes: Vector<Vote>,
    initial_epoch_height: EpochHeight, //time
    
    winner: LazyOption<AccountId>,
    applicant: AccountId, // demandante
    accused: AccountId, // acusado

    applicant_proves: LazyOption<String>, // Un markdown con todas las pruebas
    accusedt_proves: LazyOption<String> // Un markdown con todas las pruebas
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct Mediator {
    // admin: ValidAccountId,
    disputes: UnorderedMap<DisputeId, Dispute>,
    disputes_counter: u128,
}

#[near_bindgen]
impl Mediator {
    #[init]
    pub fn new() -> Self{
        assert!(!env::state_exists(), "Contract already inicialized");
        let this = Self {
            disputes: UnorderedMap::new(b"d"),
            disputes_counter: 0
        };
        return this;
    }

    pub fn new_dispute(services_id: u64, max_juries: u8, accused: ValidAccountId, proves: String) {
        
    }
}