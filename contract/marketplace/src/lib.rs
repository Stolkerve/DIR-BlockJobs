use near_env::PanicMessage;
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{LookupMap, UnorderedMap, UnorderedSet};
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::serde_json;
use near_sdk::{env, near_bindgen, AccountId, Balance, PanicOnDefault, Promise, StorageUsage};
use std::collections::{HashSet};

use crate::internal::*;
pub use crate::nft_core::*;
use crate::user::*;
use crate::categories::*;

mod internal;
mod nft_core;
mod user;
mod categories;

near_sdk::setup_alloc!();

// const ON_CALLBACK_GAS: u64 = 20_000_000_000_000;
// const GAS_FOR_RESOLVE_TRANSFER: Gas = 10_000_000_000_000;
// const GAS_FOR_NFT_TRANSFER_CALL: Gas = 25_000_000_000_000 + GAS_FOR_RESOLVE_TRANSFER;
// const NO_DEPOSIT: Balance = 0;
// const MAX_MARKET_DEPOSIT: u128 = 100_000_000_000_000_000_000_000;
// const ACCESS_KEY_ALLOWANCE: u128 = 100_000_000_000_000_000_000_000;
// const SPONSOR_FEE: u128 = 100_000_000_000_000_000_000_000;

const USER_MINT_LIMIT: u8 = 5;
const USERS_LIMIT: u16 = u16::MAX;

pub type TokenId = String;

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct Token {
    pub owner_id: AccountId,
    pub metadata: TokenMetadata,
    pub approved_account_ids: HashSet<AccountId>,
    pub approval_id: u64,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct TokenMetadata {
    pub fullname: String,
    pub profile_photo_url: String,
    pub price: u16,
    pub active: bool,
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct Marketplace {
    pub total_supply: u128,
    pub tokens_per_owner: LookupMap<AccountId, UnorderedSet<TokenId>>,
    pub tokens_by_id: UnorderedMap<TokenId, Token>,
    pub contract_owner: AccountId,
    // The storage size in bytes for one account.
    pub extra_storage_in_bytes_per_token: StorageUsage,

    pub users: UnorderedMap<AccountId, User>,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct Category {
    pub category: String,
    pub subcategory: String,
    pub areas: String,
}

#[near_bindgen]
impl Marketplace {
    /// Inicializa el contrato y asigna el propietario del contrato. El cual sera el primer admin
    ///
    /// #Arguments
    /// * `owner_id`    - La cuenta de mainnet/testnet de quien sera el owner del contrato.
    #[init]
    #[payable]
    pub fn new(owner_id: AccountId) -> Self {
        assert!(!env::state_exists(), "Contract already inicialized");
        let mut this = Self {
            total_supply: 0,
            tokens_per_owner: LookupMap::new(b"a".to_vec()),
            tokens_by_id: UnorderedMap::new(b"t".to_vec()),
            users: UnorderedMap::new(b"u".to_vec()),
            contract_owner: owner_id.clone().into(),
            extra_storage_in_bytes_per_token: 0,
        };

        // El owner del contrato debe ser un usuario con rol de Admin
        let mut lenguages = HashSet::new();
        lenguages.insert(ProgramingLenguages::Rust);

        let mut areas = HashSet::new();
        areas.insert(ProgrammerAreas::Blockchain);
        areas.insert(ProgrammerAreas::Backend);

        this.add_user(owner_id, UserRoles::Admin, vec!(Categories::Programmer(
            ProgrammerCategoryData {
                lenguages: lenguages,
                area: areas,
            }))
        );

        this.measure_min_token_storage_cost();
        return this;
    }
    
    /// Mintea uno o varios servios de un usuario que sea un profesional (tambien si eres un admin)
    ///
    /// #Arguments
    /// * `metadata`             - La metadata que el profesional asigna a su servicio.
    /// * `active_services`      - La cantidad de tokens que se desea mintear.
    #[payable]
    pub fn mint_service(&mut self, metadata: TokenMetadata, mut _active_services: u8) -> Token {

        if _active_services > 5 {
            Panic::InvalidMintAmount{}.panic();
        }

        let user = self.user_update_mint_amount(USER_MINT_LIMIT); // cantidad de servicios
        let owner_id = user.account_id;

        let is_professional = user.roles.get(&UserRoles::Professional).is_none();
        let is_admin = user.roles.get(&UserRoles::Admin).is_none();
        assert_eq!(is_professional || is_admin, true, "Only professional can mint a service");

        let initial_storage_usage = env::storage_usage();
        env::log(format!("initial store usage: {}", initial_storage_usage).as_bytes());

        let mut token = Token {
            owner_id: owner_id.clone(),
            metadata: metadata,
            approved_account_ids: Default::default(),
            approval_id: 0,
        };

        for _i in 0 .. USER_MINT_LIMIT {
            token.metadata.active = false;
            if _active_services != 0 {
                token.metadata.active = true;
                _active_services -= 1;
            }
            assert!(
                self.tokens_by_id.insert(&self.total_supply.to_string(), &token).is_none(),
                "Token already exists"
            );
            self.internal_add_token_to_owner(&token.owner_id, &self.total_supply.to_string());
            self.total_supply += 1;
        }

        let new_tokens_size_in_bytes = env::storage_usage() - initial_storage_usage;
        env::log(format!("New tokens size in bytes: {}", new_tokens_size_in_bytes).as_bytes());

        let required_storage_in_bytes = self.extra_storage_in_bytes_per_token + new_tokens_size_in_bytes;
        env::log(format!("Required storage in bytes: {}", required_storage_in_bytes).as_bytes());

        deposit_refund(required_storage_in_bytes);

        return token;
    }

    // Quitar un servicio ofrecido
    pub fn delete_service(&mut self, token_id: TokenId) -> Token {
        // Verificar que el servicio exista
        assert_eq!(
            token_id.trim().parse::<u128>().unwrap() < self.total_supply,
            true,
            "The indicated TokenID doesn't exist"
        );
        //Comprobar que sea el creador o un admin
        let user = self.user_update_mint_amount(USER_MINT_LIMIT); // cantidad de servicios
        let owner_id = user.account_id;

        let is_professional = user.roles.get(&UserRoles::Professional).is_none();
        let is_admin = user.roles.get(&UserRoles::Admin).is_none();
        assert_eq!(is_professional || is_admin, true, "Only owner or admin can delete the service");

        let mut token = self.get_service(token_id.clone());

        token.metadata.active = false;

        token
    }

    #[payable]
    // Adquisición de un servicio
    pub fn buy_service(&mut self, token_id: TokenId) -> Token {
        // Verificar que el servicio exista
        assert_eq!(
            token_id.trim().parse::<u128>().unwrap() < self.total_supply,
            true,
            "The indicated TokenID doesn't exist"
        );

        //Si no cuenta con los fondos se hace rollback
        //let amount = env::attached_deposit();
        // assert_eq!(
        //     metadata.price.as_ref().unwrap().parse::<u128>().unwrap(), amount,
        //     "Fondos insuficientes"
        // );
        // assert_eq!(
        //     metadata.on_sale.as_ref().unwrap(), &true,
        //     "No esta a la venta"
        // );

        //Obtener los metadatos del token
        // let metadata = Token::metadata.as_ref()
            // .and_then(|by_id| by_id.get(&token_id)).unwrap();

        let mut token = self.get_service(token_id.clone());

        // Revisa que este a la venta y obtiene el dueño del token
        let owner_id = self.get_user_service_by_id(token_id);
        let buyer_id = &env::signer_account_id();

        // Verifica que quien compra no sea ya el dueño
        assert_eq!(buyer_id == &owner_id, false, "Ya es dueño del token ");
        // Cambiarla metadata
        // self.service
        //     .token_metadata_by_id
        //     .as_mut()
        //     .and_then(|by_id| by_id.insert(&token_id, &metadata));
        // Transferir los nears
        // let promise = Promise::new(owner_id.clone())
        //     .transfer(amount)
        //     .function_call("tx_status_callback".into(), vec![], 0, 0);
        // Promise::new(owner_id.clone()).transfer(amount);
        
        //Transferir el nft
        // &self.token.internal_transfer(&token_id, &owner_id, buyer_id);

        //Retornar la metadata
        token
    }


    /// #Arguments
    /// * `account_id`  - La cuenta de mainnet/testnet del usuario.
    pub fn get_service(&self, token_id: TokenId) -> Token {
        self.tokens_by_id.get(&token_id.into()).expect("No users found. Register the user first")
    }

    /// #Arguments
    /// * `account_id`  - La cuenta de mainnet/testnet del usuario.
    pub fn get_user_service_by_id(&self, token_id: TokenId) -> String {
        let token = self.tokens_by_id.get(&token_id.into()).expect("No users found. Register the user first");
        token.owner_id
    }

    /// Registra usuarios! Asignandoles un role y a que se dedican por categorias
    ///
    /// #Arguments
    /// * `account_id`  - La cuenta de mainnet/testnet de quien sera registrado.
    /// * `role`        - El role que tendra el usuario. Solo los admin puenden decir quien es moderador.
    /// * `category`    - La categoria en la cual el usuario puede decir a que se dedica.
    #[payable]
    pub fn add_user(&mut self, account_id: AccountId, role: UserRoles, categories: Vec<Categories>) -> User {
        self.admin_assert(&env::predecessor_account_id());

        if self.users.len() >= USERS_LIMIT as u64 {
            
        }

        let s_account_id: AccountId = account_id.into();
        let tokens_set = UnorderedSet::new(unique_prefix(&s_account_id));
        self.tokens_per_owner.insert(&s_account_id, &tokens_set);

        let initial_storage_usage = env::storage_usage();
        env::log(format!("initial store usage: {}", initial_storage_usage).as_bytes());

        let categories_not_repited: Vec<Categories> = self.categories_eliminate_repited(categories);

        let mut new_user = User{
            account_id: s_account_id.clone(),
            mints: 0,
            roles: HashSet::new(),
            rep: 0,
            categories: categories_not_repited,
            links: None,
            education: None, 
        };
        new_user.roles.insert(role);

        if self.users.insert(&s_account_id, &new_user).is_some() {
            env::panic(b"User account already added");
        }

        let new_tokens_size_in_bytes = env::storage_usage() - initial_storage_usage;
        env::log(format!("New tokens size in bytes: {}", new_tokens_size_in_bytes).as_bytes());

        let required_storage_in_bytes = self.extra_storage_in_bytes_per_token + new_tokens_size_in_bytes;
        env::log(format!("Required storage in bytes: {}", required_storage_in_bytes).as_bytes());

        deposit_refund(required_storage_in_bytes);

        return new_user;
    }

    /// Elimina un usuarios y sus tokens
    ///
    /// #Arguments
    /// * `account_id`  - La cuenta de mainnet/testnet de quien sera registrado.
    // pub fn remove_user(&mut self, account_id: AccountId) {
    //     assert_eq!(env::predecessor_account_id(), self.owner_id, "must be owner_id");
    //     let guest = self.users.get(&account_id.clone().into()).expect("Could not find the user");
    //     // TODO transfer NFTs
    //     self.tokens_per_owner.remove(&guest.account_id);
    //     self.users.remove(&account_id.into());

    // }

    /// Reescribe las categorias del usuario
    ///
    /// #Arguments
    /// * `account_id`  - La cuenta de mainnet/testnet de quien sera registrado.
    /// * `category`    - La categoria en la cual el usuario puede decir a que se dedica.
    pub fn update_user_categories(&mut self, account_id: AccountId, categories: Vec<Categories>) -> User {
        if env::predecessor_account_id() == account_id.to_string() {
            env::panic(b"Only the user cant modify it self");
        }

        let mut user = self.get_user(account_id.clone());

        // por ahora solo soporta una sola categoria, por lo que no crece y siempre sera 0
        user.categories = self.categories_eliminate_repited(categories);
        self.users.insert(&account_id.into(), &user);

        return user;
    }

    /// Agrega un role mas al usuario
    ///
    /// #Arguments
    /// * `account_id`  - La cuenta de mainnet/testnet de quien sera registrado.
    /// * `role`        - El role que tendra el usuario. Solo los admin puenden decir quien es moderador.
    pub fn set_user_role(&mut self, account_id: AccountId, role: UserRoles, remove: bool) -> User {
        let is_user_sender = env::predecessor_account_id() != account_id.to_string();
        let is_owner_sender = env::predecessor_account_id() != self.contract_owner;
        if is_user_sender && is_owner_sender {
            env::panic(b"Only the user and admins cant modify it self");
        }

        if is_owner_sender && (role as u8 > 1) {
            env::panic(b"Only the admins cant grant the admin or mod role");
        }

        let mut user = self.get_user(account_id.clone());

        if !remove {
            user.roles.insert(role);
        }
        else {
            user.roles.remove(&role);
        }

        self.users.insert(&account_id.into(), &user);
        
        return user;
    }

    /// #Arguments
    /// * `account_id`  - La cuenta de mainnet/testnet del usuario.
    pub fn get_user(&self, account_id: AccountId) -> User {
        self.users.get(&account_id.into()).expect("No users found. Register the user first")
    }

    // TODO(Sebas): Optimizar con paginacion
    /// #Arguments
    /// * `account_id`  - La cuenta de mainnet/testnet del usuario.
    pub fn get_user_by_role(&self, role: UserRoles) -> Vec<User> {

        let mut users: Vec<User> = Vec::new();
        for (_account_id, user) in self.users.iter() {
            if user.roles.get(&role).is_some() {
                users.push(user);
            }
        }

        return users;
    }

    /// Obtener los token y sus metadata de un usuario
    ///
    /// #Arguments
    /// * `account_id`  - La cuenta de mainnet/testnet del usuario.
    /// * `only_active`  - Retornar solo los tokens activos.
    pub fn get_user_services(&self, account_id: AccountId, only_active: bool) -> Vec<Token> {
        let mut tokens: Vec<Token> = Vec::new();
        let tokens_id = self.get_user_services_ids(account_id.clone());
        for i in 0 .. tokens_id.len() {
            let token = self.tokens_by_id.get(&tokens_id[i]).expect("Token id dont match");
            if only_active {
                if token.metadata.active {
                    tokens.push( token ); 
                }
            }
            else {
                tokens.push( token );
            }
        }
        return tokens;
    }

    // TODO(Sebas): Optimizar con colocar un limite
    /// Obtener los token y sus metadata de un usuario
    ///
    /// #Arguments
    /// * `account_id`  - La cuenta de mainnet/testnet del usuario.
    pub fn get_service_by_ids(&self, ids: HashSet<u128>) -> Vec<Token> {
        if ids.len() > self.tokens_by_id.len() as usize {
            env::panic(b"The amounts of ids supere the amount of tokens");
        }
        let mut tokens: Vec<Token> = Vec::new();
        for id in ids.iter() {
            tokens.push(self.tokens_by_id.get(&id.to_string()).expect("Token id dont match"));
        }
        return tokens;
    }

    /// Obtener id de los tokens de un usuario
    ///
    /// #Arguments
    /// * `account_id`  - La cuenta de mainnet/testnet del usuario.
    pub fn get_user_services_ids(&self, account_id: AccountId) -> Vec<String> {
        return self.tokens_per_owner.get(&account_id.into()).expect("No users found or dont have any token").to_vec();
    }

    // TODO(Sebas): Optimizar con paginacion
    /// Filtra los usuarios por las categorias seleccionadas
    ///
    /// #Arguments
    /// * `category`    - La categoria en la cual los usuarios van a ser filtrados
    pub fn user_get_by_category(&self, categories: Vec<Categories>) -> Vec<User> {
        let mut users: Vec<User> = Vec::new();

        let a = self.categories_eliminate_repited(categories);
        let mut programmer_data: Option<ProgrammerCategoryData> = None;
        let mut artist_data: Option<ArtistCategoryData> = None;
        for category in a.iter() {
            match category {
                Categories::Programmer(data) => {
                    programmer_data = Some(data.clone());
                }
                Categories::Artist(data) => {
                    artist_data= Some(data.clone());
                }
            }
        }

        for (_account_id, user) in self.users.iter() {
            for category in user.categories.iter() {
                match category {
                    Categories::Programmer(data) => {
                        if programmer_data.is_some() {
                            let looking_data = programmer_data.as_ref().unwrap();
                            let mut found_lenguages = false;
                            let mut found_area = false;
                            if looking_data.lenguages.len() > 0 && !found_lenguages{
                                // let mut matchs = 0; // strict modes
                                for l in data.lenguages.iter() {
                                    if looking_data.lenguages.get(l).is_some() {
                                        // env::log(format!("LEN: {:?}", user).as_bytes());
                                        found_lenguages = true;
                                        break;
                                    }
                                }
                            }
                            if looking_data.area.len() > 0 && !found_area{
                                for a in data.area.iter() {
                                    if looking_data.area.get(a).is_some() {
                                        // env::log(format!("AREA: {:?}", user).as_bytes());
                                        found_area = true;
                                        break;
                                    }
                                }
                            }

                            if found_lenguages || found_area {
                                users.push(user.clone());
                            }
                        }
                    }
                    Categories::Artist(data) => {
                        if artist_data.is_some() {
                            let looking_data = artist_data.as_ref().unwrap();
                            let mut found_area = false;
                            if looking_data.area.len() > 0 && !found_area {
                                for a in data.area.iter() {
                                    if looking_data.area.get(a).is_some() {
                                        found_area = true;
                                        // break;
                                    }
                                }
                            }

                            if found_area {
                                users.push(user.clone());
                            }
                        }
                    }
                }
            }
        }

        return users;
    }

    #[private]
    fn measure_min_token_storage_cost(&mut self) {
        let initial_storage_usage = env::storage_usage();
        let tmp_account_id = "a".repeat(64);
        let u = UnorderedSet::new(unique_prefix(&tmp_account_id));
        self.tokens_per_owner.insert(&tmp_account_id, &u);

        let tokens_per_owner_entry_in_bytes = env::storage_usage() - initial_storage_usage;
        let owner_id_extra_cost_in_bytes = (tmp_account_id.len() - self.contract_owner.len()) as u64;

        self.extra_storage_in_bytes_per_token =
            tokens_per_owner_entry_in_bytes + owner_id_extra_cost_in_bytes;

        self.tokens_per_owner.remove(&tmp_account_id);
    }

    #[private]
    fn user_update_mint_amount(&mut self, new_mints: u8) -> User {
        let sender_id = env::predecessor_account_id();
        let mut user = self.users.get(&sender_id).expect("Before mint a nft, create an user");
        assert!(
            user.mints < USER_MINT_LIMIT,
            "Exceeded user mint limit {}", USER_MINT_LIMIT
        );
        user.mints += new_mints;
        self.users.insert(&sender_id, &user);
        return user;
    }

    #[private]
    fn admin_assert(&self, account_id: &AccountId) {
        assert_eq!(*account_id, self.contract_owner, "Must be owner_id how call its function");
    }

    #[private]
    fn categories_eliminate_repited(& self, categories: Vec<Categories>) -> Vec<Categories> {
        let mut categories_not_repited: Vec<Categories> = Vec::new();

        let mut programmer_found: bool = false;
        let mut artist_found: bool = false;

        for category in categories.iter() {
            match category {
                Categories::Programmer(data) => {
                    if !programmer_found {
                        categories_not_repited.push(Categories::Programmer(data.clone()));
                        programmer_found = true;
                    }
                }
                Categories::Artist(data) => {
                    if !artist_found {
                        categories_not_repited.push(Categories::Artist(data.clone()));
                        artist_found = true;
                    }
                }
            }
        }

        return categories_not_repited;
    }

    #[private]
    fn string_to_json(&self, token_id: TokenId) -> Category {
        let example = Category {
            category: "Programmer".to_string(),
            subcategory: "Backend".to_string(),
            areas: "Python, SQL".to_string()
        };
        let serialized = serde_json::to_string(&example).unwrap();

        let string = format!("String: {}", &serialized);
        env::log(string.as_bytes());

        let deserialized: Category = serde_json::from_str(&serialized).unwrap();
        deserialized
    }
}

// fn is_promise_success() -> bool {
//     assert_eq!(
//         env::promise_results_count(),
//         1,
//         "Contract expected a result on the callback"
//     );
//     match env::promise_result(0) {
//         PromiseResult::Successful(_) => true,
//         _ => false,
//     }
// }

/// Posibles errores que se usan posteriormente como Panic error
#[derive(Serialize, Deserialize, PanicMessage)]
#[serde(crate = "near_sdk::serde", tag = "err")]
pub enum Panic {
    #[panic_msg = "Invalid argument for service title `{}`: {}"]
    InvalidTitle { len_title: usize, reason: String },

    #[panic_msg = "Invalid argument for service description `{}`: {}"]
    InvalidDescription { len_description: usize, reason: String },

    #[panic_msg = "Token ID must have a positive quantity and less than 10"]
    InvalidMintAmount { },
    /*
    #[panic_msg = "Operation is allowed only for admin"]
    AdminRestrictedOperation,
    #[panic_msg = "Unable to delete Account ID `{}`"]
    NotAuthorized { account_id: AccountId },
    #[panic_msg = "Token ID `{:?}` was not found"]
    TokenIdNotFound { token_id: U64 },
    #[panic_msg = "Token ID `{:?}` does not belong to account `{}`"]
    TokenIdNotOwnedBy { token_id: U64, owner_id: AccountId },
    #[panic_msg = "Sender `{}` is not authorized to make transfer"]
    SenderNotAuthToTransfer { sender_id: AccountId },
    #[panic_msg = "The token owner and the receiver should be different"]
    ReceiverIsOwner,
    */
}

#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::MockedBlockchain;
    use near_sdk::test_utils::{VMContextBuilder, accounts};
    use near_sdk::{testing_env, VMContext};

    fn get_context(is_view: bool) -> VMContext {
        VMContextBuilder::new()
            .signer_account_id(accounts(1))
            .predecessor_account_id(accounts(2))
            .attached_deposit(100000000000000000)
            .is_view(is_view)
            .build()
    }

    fn generate_category1() -> Categories {
        let mut lenguages = HashSet::new();
        lenguages.insert(ProgramingLenguages::Rust);
        lenguages.insert(ProgramingLenguages::Angular);

        let mut programing_area = HashSet::new();
        programing_area.insert(ProgrammerAreas::Blockchain);
        programing_area.insert(ProgrammerAreas::Backend);

        return Categories::Programmer(ProgrammerCategoryData {
            lenguages: lenguages,
            area: programing_area
        });
    }

    fn generate_category2() -> Categories {
        let mut lenguages = HashSet::new();
        lenguages.insert(ProgramingLenguages::C);
        lenguages.insert(ProgramingLenguages::Arduino);

        let mut programing_area = HashSet::new();
        programing_area.insert(ProgrammerAreas::Os);
        programing_area.insert(ProgrammerAreas::EmbeddedSystems);

        return Categories::Programmer(ProgrammerCategoryData {
            lenguages: lenguages,
            area: programing_area
        });
    }

    fn generate_category3() -> Categories {
        let mut lenguages = HashSet::new();
        lenguages.insert(ProgramingLenguages::C);
        lenguages.insert(ProgramingLenguages::Arduino);

        let mut programing_area = HashSet::new();
        programing_area.insert(ProgrammerAreas::Os);
        programing_area.insert(ProgrammerAreas::EmbeddedSystems);

        return Categories::Programmer(ProgrammerCategoryData {
            lenguages: lenguages,
            area: programing_area
        });
    }

    fn generate_category4() -> Categories {
        let mut art_area = HashSet::new();
        art_area.insert(ArtistAreas::Illustration);
        art_area.insert(ArtistAreas::Realism);

        return Categories::Artist(ArtistCategoryData{
            area: art_area
        });
    }

    fn generate_category5() -> Categories {
        let mut art_area = HashSet::new();
        art_area.insert(ArtistAreas::Anime);
        art_area.insert(ArtistAreas::Manga);

        return Categories::Artist(ArtistCategoryData{
            area: art_area
        });
    }

    #[test]
    fn test_basic() {
        let admin_id = accounts(1).to_string();
        let mut context = get_context(false);
        context.attached_deposit = 58700000000000000000000;
        testing_env!(context.clone());
        let marketplace = Marketplace::new(admin_id.clone());

        let admin: User = marketplace.get_user(admin_id.clone());

        // Verificar que el admin sea creado correctamente
        assert_eq!(
            (admin.mints == 0) &&
            (admin.account_id == admin_id.to_string()) &&
            (admin.roles.get(&UserRoles::Admin).is_some()) &&
            (marketplace.get_user_services_ids(admin_id.to_string()).len() == 0) // no minteo ningun token
            ,
            true
        );
    }
    #[test]

    fn test_mint() {
        let mut context = get_context(false);
        let admin_id = accounts(1).to_string();
        context.attached_deposit = 58700000000000000000000;
        context.predecessor_account_id = admin_id.clone();
        testing_env!(context);
        let mut marketplace = Marketplace::new(admin_id.clone());

        let jose_token = marketplace.mint_service(TokenMetadata {
            fullname: "Jose Antoio".to_string(),
            profile_photo_url: "Jose_Antoio.png".to_string(),
            price: 10,
            active: false,
        }, 3);

        let admin: User = marketplace.get_user(admin_id.clone());
        let actives_services = marketplace.get_user_services(admin.account_id, true);

        assert_eq!(
            (admin.roles.get(&UserRoles::Admin).is_some()) &&
            actives_services.len() == 3 &&
            admin.mints == 5
            ,
            true
        );  

        // let user2 = marketplace.add_user(
        //     "maria.testnet".to_string(),
        //     UserRoles::Professional, vec!(category2, category3)
        // );
        // context.attached_deposit = 58700000000000000000000;
        // testing_env!(context);
        // marketplace.mint_service(TokenMetadata {
        //     fullname: "Maria Jose".to_string(),
        //     profile_photo_url: "Maria_Jose.png".to_string(),
        //     price: 10,
        //     active: true,
        // }, 3);

        // let user3 = marketplace.add_user(
        //     "ed.testnet".to_string(),
        //     UserRoles::Professional, vec!(category4)
        // );
        // context.attached_deposit = 58700000000000000000000;
        // testing_env!(context);
        // marketplace.mint_service(TokenMetadata {
        //     fullname: "Ed Robet".to_string(),
        //     profile_photo_url: "Ed_Robet.png".to_string(),
        //     price: 10,
        //     active: true,
        // }, 1);
    }

    #[test]
    fn test_user() {
        let mut context = get_context(false);
        let admin_id = accounts(1).to_string();
        context.attached_deposit = 58700000000000000000000;
        context.predecessor_account_id = admin_id.clone();
        testing_env!(context);
        let mut marketplace = Marketplace::new(admin_id.clone());

        // let mut context = get_context(false);
        // context.attached_deposit = 58700000000000000000000;
        // context.predecessor_account_id = accounts(2).to_string();
        // testing_env!(context);

        let user_id = "andres.testnet";
        marketplace.add_user(
            user_id.to_string(),
            UserRoles::Professional,
            vec!(generate_category1())
        );

        assert_eq!(
            true,
            true
        );
    }

    #[test]
    fn test_roles() {

    }

    #[test]
    fn test_categories() {

    }
}