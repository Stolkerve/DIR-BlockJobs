#[allow(dead_code)] 

use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::json_types::{ValidAccountId};
use near_sdk::serde::{Serialize};
//use near_sdk::serde_json;
use near_sdk::{env, near_bindgen, AccountId};
use near_sdk::collections::{LookupMap, UnorderedMap};

#[global_allocator]
static ALLOC: near_sdk::wee_alloc::WeeAlloc<'_> = near_sdk::wee_alloc::WeeAlloc::INIT;

pub type DisputeId = u128;
pub type TokenAmount = u64;

#[derive(Serialize, BorshDeserialize, BorshSerialize)]
#[serde(crate = "near_sdk::serde")]
pub struct Vote {
    // Miembro del jurado que emite el voto
    account: AccountId,
    // Decisión tomada 
    ruling: u8,
}

#[derive(Serialize, BorshDeserialize, BorshSerialize)]
#[serde(crate = "near_sdk::serde")]
pub struct VoteCounter {
    // Votos realizados
    votes: Vec<u8>,
    // Contador de votos
    votes_counter: u8
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
    // Cantidad de  miembros de jurado para la disputa
    number_jurors: u8,
    // Lista de miembros del jurado y sus respectivos tokens a retirar
    jury: LookupMap<AccountId, TokenAmount>,
    dispute_status: DisputeStatus,
    vote: Vote,
    vote_counter: VoteCounter,
    winner: u8,
    //TODO agregar contador para el tiempo

}

#[near_bindgen]
pub struct Mediator {
    admin: ValidAccountId,
    disputes: UnorderedMap<DisputeId, Dispute>,
    disputes_counter: u128,
}

impl Default for Mediator {
    fn default() -> Self {
        env::panic(b"Mediator should be initialized before usage");
    }
}

#[near_bindgen]
impl Mediator {

    #[private]
    fn finished_assert(&self, dispute_id: &DisputeId) {
        assert_eq!(*dispute_id, DisputeStatus::Finished, "The dispute must be finished");
    }

    #[private]
    fn admin_assert(&self, account_id: &AccountId) {
        assert_eq!(*account_id, self.admin, "Must be admin_id how call its function");
    }
}