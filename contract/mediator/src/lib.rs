use near_sdk::{
    env, ext_contract, near_bindgen, AccountId, setup_alloc, Balance, PanicOnDefault, EpochHeight, Gas, PromiseResult
};
use near_sdk::collections::{UnorderedMap};
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::serde::{Serialize};
use near_sdk::json_types::{ValidAccountId};

use std::convert::TryFrom;
use std::collections::{HashSet};

const YOCTO_NEAR: u128 = 1000000000000000000000000;
const STORAGE_PRICE_PER_BYTE: Balance = 10_000_000_000_000_000_000;
const MAX_JUDGES: u8 = 2;
const MAX_EPOCHS_FOR_OPEN_DISPUTES: u64 = 6; // 1 epoch = 12h. 3 days 
const NO_DEPOSIT: Balance = 0;
const BASE_GAS: Gas = 5_000_000_000_000;

pub(crate) fn string_to_valid_account_id(account_id: &String) -> ValidAccountId{
    return ValidAccountId::try_from((*account_id).to_string()).unwrap();
}

pub(crate) fn unique_prefix(account_id: &AccountId) -> Vec<u8> {
    let mut prefix = Vec::with_capacity(33);
    prefix.push(b'o');
    prefix.extend(env::sha256(account_id.as_bytes()));
    return prefix
}

setup_alloc!();

pub type DisputeId = u128;
pub type ServiceAmount = u64;

#[derive(Serialize, BorshDeserialize, BorshSerialize, Debug, Hash, Eq, PartialOrd, PartialEq)]
#[serde(crate = "near_sdk::serde")]
pub struct Vote {
    // Miembro del jurado que emite el voto
    account: AccountId,
    // Decisión tomada 
    vote: bool,
}

#[derive(Serialize, BorshDeserialize, BorshSerialize, PartialEq, Debug)]
#[serde(crate = "near_sdk::serde")]
pub enum DisputeStatus {
    Open,
    Resolving,
    Executable,
    Finished,
    Failed
}

#[derive(BorshDeserialize, BorshSerialize, Serialize)]
#[serde(crate = "near_sdk::serde")]
pub struct Dispute {
    // Identificador para cada disputa
    id: DisputeId,
    services_id: u64,

    // Cantidad de  miembros de jurado para la disputa
    num_of_judges: u8,

    // Lista de miembros del jurado y sus respectivos services a retirar
    judges: HashSet<AccountId>,
    votes: HashSet<Vote>,
    dispute_status: DisputeStatus,
    initial_epoch_height: EpochHeight, //time
    
    applicant: AccountId, // demandante
    accused: AccountId, // acusado
    winner: Option<AccountId>,

    applicant_proves: String, // Un markdown con todas las pruebas
    accused_proves: Option<String> // Un markdown con todas las pruebas
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct Mediator {
    // admin: ValidAccountId,
    disputes: UnorderedMap<DisputeId, Dispute>,
    disputes_counter: u128,
    marketplace_account_id: AccountId
}

#[near_bindgen]
impl Mediator {
    #[init]
    pub fn new(marketplace_account_id: AccountId) -> Self{
        assert!(!env::state_exists(), "Contract already inicialized");
        let this = Self {
            disputes: UnorderedMap::new(b"d"),
            disputes_counter: 0,
            marketplace_account_id: marketplace_account_id
        };
        return this;
    }

    #[payable]
    pub fn new_dispute(&mut self, services_id: u64, accused: ValidAccountId, proves: String) -> Dispute{
        if env::attached_deposit() < 1 {
            env::panic(b"Para crear una nueva disputa, deposita 0.1 near");
        }

        let sender = env::predecessor_account_id();
        let dispute = Dispute {
            id: self.disputes_counter.clone(),
            services_id: services_id.clone(),
            num_of_judges: 0,
            judges: HashSet::new(),
            votes: HashSet::new(),
            dispute_status: DisputeStatus::Open,
            initial_epoch_height: env::epoch_height(),
            applicant: sender.clone(),
            accused: accused.to_string(),
            winner: None,
            applicant_proves: proves,
            accused_proves: None
        };

        self.disputes.insert(&self.disputes_counter, &dispute);

        self.disputes_counter += 1;

        return dispute;
    }

    pub fn add_accused_proves(&mut self, dispute_id: DisputeId, accused_proves: String) -> Dispute {
        let mut dispute = self.disputes.get(&dispute_id).expect("Disputa no encontrada");
        if dispute.dispute_status != DisputeStatus::Open {
            env::panic(b"El tiempo para subir las pruebas ya paso");
        }
        if dispute.accused_proves.is_some() {
            env::panic(b"Usted ya subio pruebas!");
        }

        dispute.accused_proves.insert(accused_proves);

        self.disputes.insert(&dispute_id, &dispute);

        return dispute;
    }
    
    pub fn add_judge_test(&mut self, dispute_id: DisputeId) -> Dispute {
        let sender = env::predecessor_account_id();
        let mut dispute = self.disputes.get(&dispute_id).expect("Disputa no encontrada");

        if dispute.dispute_status != DisputeStatus::Open {
            env::panic(b"Ya paso el tiempo para agregar juez");
        }
        if dispute.judges.len() > MAX_JUDGES as usize {
            env::panic(b"No hay espacio para mas juezes");
        }
        if !dispute.judges.insert(sender) {
            env::panic(b"Ya eres un juez");
        }

        return dispute;
    }

    pub fn vote(&mut self, dispute_id: DisputeId, vote: bool) -> Dispute {
        let sender = env::predecessor_account_id();
        let mut dispute = self.disputes.get(&dispute_id).expect("Disputa no encontrada");

        if dispute.dispute_status != DisputeStatus::Resolving {
            env::panic(b"No se puede votar cuando el estarus es distinto de resolviendo");
        }

        if !dispute.votes.insert(Vote {
            account: sender.clone(),
            vote: vote
        }) {
            env::panic(b"Usted ya voto");
        }
        self.disputes.insert(&dispute_id, &dispute);
        return dispute;
    }

    pub fn update_dispute_status(&mut self, dispute_id: DisputeId) -> Dispute {
        let mut dispute = self.disputes.get(&dispute_id).expect("Disputa no encontrada");

        let actual_epoch = env::epoch_height();
        let dif_epoch = actual_epoch - dispute.initial_epoch_height;

        // Open is 4 epochs, resolve 8 epochs and execute 1 epoch, finish 0 epoch

        if (dif_epoch >= 4 && dif_epoch < 14) && dispute.dispute_status == DisputeStatus::Open {
            dispute.dispute_status = DisputeStatus::Resolving;
        }

        if (dif_epoch >= 14 && dif_epoch < 18) && dispute.dispute_status == DisputeStatus::Resolving {
            dispute.dispute_status = DisputeStatus::Executable;
        }

        if dispute.dispute_status == DisputeStatus::Executable {
            let mut agains_votes_counter = 0;
            let mut pro_votes_counter = 0;
            for v in dispute.votes.iter() {
                if v.vote {
                    pro_votes_counter += 1;
                }
                else {
                    agains_votes_counter += 1;
                }
            }

            if pro_votes_counter == agains_votes_counter {
                dispute.dispute_status = DisputeStatus::Failed;
            }
            else {
                dispute.dispute_status = DisputeStatus::Finished;
                if pro_votes_counter > agains_votes_counter {
                    // dispute.winner = Some(dispute.applicant);
                    dispute.winner = Some(dispute.applicant.clone());
                }
                else {
                    dispute.winner = Some(dispute.accused.clone());
                }
            }
        }

        self.disputes.insert(&dispute_id, &dispute);

        return dispute;
    }

    fn add_judge(&mut self, dispute_id: DisputeId) {
        ext_marketplace::get_users_account_id(&self.marketplace_account_id, NO_DEPOSIT, BASE_GAS).
        then(ext_self::on_get_users_account_id(&env::current_account_id(), NO_DEPOSIT, BASE_GAS));  
    }

    #[private]
    fn on_get_users_account_id(&mut self) {
        let success = is_promise_success();
    }
}

#[ext_contract(ext_marketplace)]
pub trait Marketplace {
    fn get_users_account_id(&self) -> Vec<AccountId>;
}
#[ext_contract(ext_self)]
pub trait ExtSelf {
    fn on_get_users_account_id() -> bool;
}

fn is_promise_success() -> bool {
    assert_eq!(
        env::promise_results_count(),
        1,
        "Contract expected a result on the callback"
    );
    match env::promise_result(0) {
        PromiseResult::Successful(_) => true,
        _ => false,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::test_utils::{VMContextBuilder, accounts};
    use near_sdk::MockedBlockchain;
    use near_sdk::{testing_env, VMContext};

    fn get_context(is_view: bool) -> VMContext {
        VMContextBuilder::new()
            .signer_account_id(accounts(1))
            .predecessor_account_id(accounts(2))
            .attached_deposit(100000000000000000)
            .is_view(is_view)
            .build()
    }

    fn get_account(id: usize) -> String {
        return accounts(id).to_string()
    }

    #[test]
    fn test1() {
        let contract_account = "Mediator.near";
        let applicant = get_account(0);
        let accused = get_account(1);
        let judges = [get_account(2), get_account(3)];

        let mut context = get_context(false);
        context.attached_deposit = 58700000000000000000000;
        context.epoch_height = 0;
        context.predecessor_account_id = applicant.clone();
        context.current_account_id = contract_account.to_string();
        testing_env!(context);

        let mut contract = Mediator::new("marketplace.near".to_string());
        let mut dispute = contract.new_dispute(2, string_to_valid_account_id(&"employer".to_string()), "Prueba en markdown".to_string());

        let mut context = get_context(false);
        context.attached_deposit = 58700000000000000000000;
        context.epoch_height = 0;
        context.predecessor_account_id = judges[0].clone();
        context.current_account_id = contract_account.to_string();
        testing_env!(context);
        contract.add_judge_test(dispute.id.clone());

        let mut context = get_context(false);
        context.attached_deposit = 58700000000000000000000;
        context.epoch_height = 0;
        context.predecessor_account_id = judges[1].clone();
        context.current_account_id = contract_account.to_string();
        testing_env!(context);
        contract.add_judge_test(dispute.id.clone());

        let mut context = get_context(false);
        context.attached_deposit = 58700000000000000000000;
        context.epoch_height = 0;
        context.predecessor_account_id = accused.clone();
        context.current_account_id = contract_account.to_string();
        testing_env!(context);
        contract.add_accused_proves(dispute.id.clone(), "Markdown accused proves".to_string());

        let max_epochs = 26;
        let mut judges_votes = 0;
        for i in 0..max_epochs {
            let mut context = get_context(false);
            if dispute.dispute_status == DisputeStatus::Resolving && judges_votes < 2{
                context.predecessor_account_id = judges[judges_votes].clone();
                contract.vote(dispute.id.clone(), true); //judges_votes != 0
                judges_votes += 1;
            }
            else {
                context.predecessor_account_id = applicant.clone();
            }
            context.attached_deposit = 58700000000000000000000;
            context.epoch_height = i;
            context.current_account_id = contract_account.to_string();
            testing_env!(context.clone());
            dispute = contract.update_dispute_status(dispute.id.clone());


            println!("Epoca: {}, estatus: {:#?}, {:?}", context.epoch_height, dispute.dispute_status, dispute.votes);
        }
    }
}