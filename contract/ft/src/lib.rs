use near_contract_standards::fungible_token::metadata::{
    FungibleTokenMetadata, FungibleTokenMetadataProvider, FT_METADATA_SPEC,
};
use near_contract_standards::fungible_token::FungibleToken;
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::collections::{LazyOption, LookupMap};
use std::collections::HashSet;
use near_sdk::json_types::{ValidAccountId, U128};
use near_sdk::{env, log, near_bindgen, AccountId, Balance,
    PanicOnDefault, PromiseOrValue};

near_sdk::setup_alloc!();

const DECIMALS: Balance = 1_000_000; 

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Debug, Hash, Eq, PartialOrd, PartialEq, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct Vote {
    account: AccountId,
    vote: bool,
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct Token {
    token: FungibleToken,
    metadata: LazyOption<FungibleTokenMetadata>,
    pub owner: ValidAccountId,
    // Determina quien puede mintear los tokens pendientes y modificar la locked_tokens.
    pub minter: AccountId,
    // Tokens a poder retirar por parte de cada jurado.
    locked_tokens: LookupMap<AccountId, Balance>,
    // Total de tokens pendiente a mintear.
    pub pending_to_mint: Balance,
    // Cantidad de tokens bloqueados minima para poder ser miembro del jurado.
    pub min_blocked_amount: Balance,
    sales_contract: AccountId,
}

const IMAGE_ICON: &str = "data:image/svg+xml;charset=UTF-8,%3c?xml version='1.0' encoding='UTF-8'?%3e%3csvg width='210mm' height='297mm' version='1.1' viewBox='0 0 210 297' xmlns='http://www.w3.org/2000/svg%27%3e%3ccircle cx='105.84' cy='131.98' r='100' fill='%2327c0ef' fill-rule='evenodd' stroke-width='.26458'/%3e%3cpath transform='matrix(.43882 -.11048 .1113 .44207 -425.91 18.123)' d='m1247.1 385.15-135.85 359.34 153.92-100.71-383.73-18.162 143.35 115.27-101.31-370.56-65.327 171.95 321.12-210.86-183.72-8.9942 299.77 240.25z' fill='%23fff'/%3e%3ctext transform='matrix(1.0661 .1816 -.13523 .91493 0 0)' x='100.96188' y='160.4895' fill='%231a1a1a' font-family=''Bernard MT Condensed'' font-size='79.9px' stroke-width='.93633' style='line-height:1.25' xml:space='preserve'%3e%3ctspan x='100.96188' y='160.4895' fill='%231a1a1a' font-family=''Bernard MT Condensed'' font-size='79.9px' stroke-width='.93633'%3eJ%3c/tspan%3e%3c/text%3e%3cellipse cx='102.38' cy='90.819' rx='7.3871' ry='7.5765' fill='%231a1a1a' stroke-width='.26458'/%3e%3c/svg%3e";

#[near_bindgen]
impl Token {
    /// Inicializa el contrato estableciendo el total supply
    /// Asigna la metadata por default
    #[init]
    pub fn new_default_meta(owner_id: ValidAccountId, initial_supply: U128, sales_contract: AccountId) -> Self {
        Self::new(
            owner_id,
            initial_supply,
            FungibleTokenMetadata {
                spec: FT_METADATA_SPEC.to_string(),
                name: "JobsCoin".to_string(),
                symbol: "JOBS".to_string(),
                icon: Some(IMAGE_ICON.to_string()),
                reference: None,
                reference_hash: None,
                decimals: 6,
            },
            sales_contract,
        )
    }

    /// Verifica que el contrato no este ya inicializado
    #[init]
    pub fn new(
        owner_id: ValidAccountId,
        total_supply: U128,
        metadata: FungibleTokenMetadata,
        sales_contract: AccountId
    ) -> Self {
        assert!(!env::state_exists(), "Already initialized");
        metadata.assert_valid();
        let mut this = Self {
            token: FungibleToken::new(b"t".to_vec()),
            metadata: LazyOption::new(b"m".to_vec(), Some(&metadata)),
            minter: env::predecessor_account_id(),
            owner: owner_id.clone(),
            locked_tokens: LookupMap::new(b"a".to_vec()),
            pending_to_mint: 0,
            min_blocked_amount: 10_000*DECIMALS,
            sales_contract: sales_contract
        };
        let amount: Balance = total_supply.into();
        this.token.internal_register_account(owner_id.as_ref());
        this.token.internal_deposit(owner_id.as_ref(), amount);
        this
    }

    /*******************/
    /*  CORE FUNCTIONS */
    /*******************/

    /// Mintear nuevos tokens, limitado por pending_amount.
    /// No se puede mintear por sobre esa cantidad.
    /// 
    pub fn mint(&mut self, receiver: ValidAccountId) {
        self.assert_minter(env::predecessor_account_id());
        self.mint_into(&receiver.to_string(), self.pending_to_mint);

        self.pending_to_mint = 0;
    }


    /// Cambiar la cuenta con permisos para mintear.
    /// Solo puede haber un Minter.
    /// 
    pub fn update_minter(&mut self, account: AccountId) {
        self.assert_owner();
        self.minter = account;
    }

    /// Cambiar la cantidad minima de tokens a bloquear para poder
    /// ser miembro del jurado.
    /// 
    pub fn update_min_blocked_amount(&mut self, amount: Balance) -> bool {
        self.assert_owner();
        self.min_blocked_amount = amount;
        true
    }

    // pub fn transfer_ft(&mut self, to: AccountId, amount: U128) -> U128 {
    //     let sender = env::predecessor_account_id();
    //     self.token.internal_register_account(&to);
    //     if !self.token.accounts.contains_key(&to) {
    //         self.token.accounts.insert(&to, &0);
    //     }
    //     self.token.internal_transfer(&sender, &to, amount.into(), None);
    //     amount
    // }

    /// Send tokens a este contrato para poder er miembro de los jurados.
    /// Estos tokens aumentan o disminuyen a partir de las votaciones.
    /// 
    #[payable]
    pub fn block_tokens(&mut self, amount: Balance) -> Balance {
        let sender = env::signer_account_id();
        let contract = self.owner.clone();
        self.ft_transfer(contract, (amount).into() , None);

        // Modificar locked_tokens sumando lo bloqueado
        self.locked_tokens.insert(&sender, &(amount + self.locked_tokens.get(&sender).unwrap_or(0)));

        // Retornar locked_tokens
        self.locked_tokens.get(&sender).unwrap_or(0)
    }

    /// Redimir tokens segun la cantidad bloqueada actual.
    /// Solo ejecutable por quien los bloqueo inicialmente.
    #[payable]
    pub fn withdraw_tokens(&mut self, amount: Balance) -> Balance {
        let sender = env::signer_account_id();
        let contract = self.owner.clone().into();

        assert!(self.locked_tokens.get(&sender) >= Some(amount), "Insufficient balance");
        
        self.token.internal_transfer(&contract, &sender, amount, None);
        
        let new_locked_tokens = self.locked_tokens.get(&sender).unwrap_or(0) - amount;
        
        // Modificar locked_tokens restando lo que se retira
        self.locked_tokens.insert(&sender, &new_locked_tokens);
        // Retornar la locked_tokens actualizada
        self.locked_tokens.get(&sender).unwrap_or(0)
    }


    /// Incrementa o decrementa en 3% el balance de un miembro de los jurados
    /// segun sus votos.
    /// Solo ejecutable por y desde Mediator, cuando gana el empleador.
    /// 
    pub fn applicant_winner(&mut self, votes: HashSet<Vote>) {
        self.assert_minter(env::predecessor_account_id());

        for i in votes.iter() {
            if i.vote {
                self.pending_to_mint += self.locked_tokens.get(&i.account)
                .unwrap_or(0) * 103 / 100 - self.locked_tokens.get(&i.account).unwrap_or(0);

                // Modificar locked_tokens aumentando en 3%
                let new_locked_tokens = self.locked_tokens.get(&i.account).unwrap_or(0) * 103 / 100 ;
                self.locked_tokens.insert(&i.account, &new_locked_tokens);
            }
            else {
            // Modificar locked_tokens disminuyendo en 3%
            let new_locked_tokens = self.locked_tokens.get(&i.account).unwrap_or(0) * 100 / 103;
            self.locked_tokens.insert(&i.account, &new_locked_tokens);
            }
        }
    }

    /// Incrementa o decrementa en 3% el balance de un miembro de los jurados
    /// segun sus votos.
    /// Solo ejecutable por y desde Mediator, cuando gana el profesional.
    /// 
    pub fn accused_winner(&mut self, votes: HashSet<Vote>) {
        self.assert_minter(env::predecessor_account_id());

        for i in votes.iter() {
            if !i.vote {
                self.pending_to_mint += self.locked_tokens.get(&i.account)
                .unwrap_or(0) * 103 / 100 - self.locked_tokens.get(&i.account).unwrap_or(0);

                // Modificar locked_tokens aumentando en 3%
                let new_locked_tokens = self.locked_tokens.get(&i.account).unwrap_or(0) * 103 / 100 ;
                self.locked_tokens.insert(&i.account, &new_locked_tokens);
            }
            else {
            // Modificar locked_tokens disminuyendo en 3%
            let new_locked_tokens = self.locked_tokens.get(&i.account).unwrap_or(0) * 100 / 103;
            self.locked_tokens.insert(&i.account, &new_locked_tokens);
            }
        }
    }


    /// Verificar que el ususario tenga el suficiente balance bloqueado para poder ser jurado.
    /// Solo ejecutable por y desde desde Mediator.
    /// 
    pub fn validate_tokens(&self, account_id: AccountId) -> bool {
        let balance = self.get_locked_tokens_of(&account_id);
        
        if balance < self.min_blocked_amount {
            env::panic(b"Insufficient balance");
        } else {
            return true;
        }
    }

    /// Modificar el contrato de ventas
    /// near call $FT change_sales_contract '{"new_account_id": "sales.blockjobs.testnet"}' --accountId $FT
    pub fn change_sales_contract(&mut self, new_account_id: AccountId) {
        self.assert_owner();
        self.sales_contract = new_account_id;
    }


    // #[payable]
    pub fn ft_sale(&mut self, from: AccountId, to: AccountId, amount: Balance) -> Balance {    
        assert!(env::predecessor_account_id() == self.sales_contract, "You haven't permissions");

        if !self.token.accounts.contains_key(&to) {
            self.token.accounts.insert(&to, &0);
        }
        self.token.internal_transfer(&from, &to, amount, None);
        amount
    }

    /**********************/
    /*** GET FUNCTIONS  ***/
    /**********************/

    pub fn get_total_supply(&self) -> Balance {
        self.token.total_supply
    }

    pub fn get_balance_of(&self, account: &AccountId) -> Balance {
        self.token.accounts.get(&account).unwrap_or(0)
    }

    pub fn get_minter(&self) -> AccountId {
        self.minter.clone()
    }

    pub fn get_pending_to_mint(&self) -> Balance {
        self.pending_to_mint.clone()
    }

    pub fn get_locked_tokens_of(&self, account: &AccountId) -> Balance {
        self.locked_tokens.get(&account).unwrap_or(0)
    }

    /// Verificar que la cantidad bloqueada de un usuario cumpla con el 
    /// minimo para ser miembro del jurado.
    /// 
    pub fn verify_blocked_amount(&self, account: &AccountId) -> bool {
        if self.get_locked_tokens_of(account) >= self.min_blocked_amount {
            return true;
        }
        else { return false; }
    }

    /***********************
     *  PRIVATE FUNCTIONS  *
     ***********************/

    fn mint_into(&mut self, account_id: &AccountId, amount: Balance) {
        let balance = self.get_balance_of(account_id);
        self.internal_update_account(&account_id, balance + amount);
        self.token.total_supply += amount;
    }

    fn internal_update_account(&mut self, account_id: &AccountId, balance: u128) {
        self.token.accounts.insert(account_id, &balance); 
    }

    // Verificar que sea el Owner.
    fn assert_owner(&self) {
        assert!(
            env::predecessor_account_id() == self.owner.to_string(),
            "Can only be called by the owner"
        );
    }

    // Verificar que tenga permisos para mintear tokens.
    fn assert_minter(&self, account_id: String) {
        assert_eq!(self.minter == account_id, true, "Not is the minter");
    }

    // Verificar deposito.
    pub fn assert_one_yocto(&self) {
        assert_eq!(env::attached_deposit(), 1, "Requires attached deposit of exactly 1 yoctoNEAR")
    }

    fn on_account_closed(&mut self, account_id: AccountId, balance: Balance) {
        log!("Closed @{} with {}", account_id, balance);
    }

    fn on_tokens_burned(&mut self, account_id: AccountId, amount: Balance) {
        log!("Account @{} burned {}", account_id, amount);
    }
}

near_contract_standards::impl_fungible_token_core!(Token, token, on_tokens_burned);
near_contract_standards::impl_fungible_token_storage!(Token, token, on_account_closed);

#[near_bindgen]
impl FungibleTokenMetadataProvider for Token {
    fn ft_metadata(&self) -> FungibleTokenMetadata {
        self.metadata.get().unwrap()
    }
}

#[cfg(all(test, not(target_arch = "wasm32")))]
mod tests {
    use near_sdk::test_utils::{accounts, VMContextBuilder};
    use near_sdk::MockedBlockchain;
    use near_sdk::{testing_env, Balance};

    use super::*;

    const TOTAL_SUPPLY: Balance = 1_000_000_000_000_000;

    fn get_context(predecessor_account_id: ValidAccountId) -> VMContextBuilder {
        let mut builder = VMContextBuilder::new();
        builder
            .current_account_id(accounts(0))
            .signer_account_id(predecessor_account_id.clone())
            .predecessor_account_id(predecessor_account_id);
        builder
    }

    #[test]
    fn test_new() {
        let mut context = get_context(accounts(1));
        testing_env!(context.build());
        let contract = Token::new_default_meta(accounts(1).into(), TOTAL_SUPPLY.into(), "sales.blockjob.testnet".to_string());
        testing_env!(context.is_view(true).build());
        assert_eq!(contract.ft_total_supply().0, TOTAL_SUPPLY);
        assert_eq!(contract.ft_balance_of(accounts(1)).0, TOTAL_SUPPLY);
    }

    #[test]
    #[should_panic(expected = "The contract is not initialized")]
    fn test_default() {
        let context = get_context(accounts(1));
        testing_env!(context.build());
        let _contract = Token::default();
    }

    #[test]
    fn test_transfer() {
        let mut context = get_context(accounts(2));
        testing_env!(context.build());
        let mut contract = Token::new_default_meta(accounts(2).into(), TOTAL_SUPPLY.into(), "sales.blockjob.testnet".to_string());
        testing_env!(context
            .storage_usage(env::storage_usage())
            .attached_deposit(contract.storage_balance_bounds().min.into())
            .predecessor_account_id(accounts(1))
            .build());
        // Paying for account registration, aka storage deposit
        contract.storage_deposit(None, None);

        testing_env!(context
            .storage_usage(env::storage_usage())
            .attached_deposit(1)
            .predecessor_account_id(accounts(2))
            .build());
        let transfer_amount = TOTAL_SUPPLY / 3;
        contract.ft_transfer(accounts(1), transfer_amount.into(), None);

        testing_env!(context
            .storage_usage(env::storage_usage())
            .account_balance(env::account_balance())
            .is_view(true)
            .attached_deposit(0)
            .build());
        assert_eq!(contract.ft_balance_of(accounts(2)).0, (TOTAL_SUPPLY - transfer_amount));
        assert_eq!(contract.ft_balance_of(accounts(1)).0, transfer_amount);
    }
}