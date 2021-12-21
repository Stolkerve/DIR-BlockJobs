use near_env::PanicMessage;
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{LookupMap, UnorderedMap, UnorderedSet};
use near_sdk::json_types::{ValidAccountId};
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{env, near_bindgen, AccountId, Balance, PanicOnDefault, Promise, StorageUsage};

use std::collections::{HashSet};
use std::convert::TryFrom;

use crate::internal::*;
use crate::user::*;

mod internal;
mod user;

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

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct Service {
    pub owner_id: AccountId,
    pub metadata: ServiceMetadata,
    pub actual_employer_account_id: Option<AccountId>,
    pub employers_account_ids: HashSet<AccountId>,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct ServiceMetadata {
    pub fullname: String,
    pub profile_photo_url: String,
    pub price: u16,
    pub active: bool,
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct Marketplace {
    pub services_by_id: UnorderedMap<u64, Service>,
    pub services_by_account: LookupMap<AccountId, UnorderedSet<u64>>,
    pub total_supply: u64,
    
    pub users: UnorderedMap<AccountId, User>,
    pub contract_owner: AccountId,

    // The storage size in bytes for one account.
    pub extra_storage_in_bytes_per_service: StorageUsage,
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
    pub fn new(owner_id: ValidAccountId) -> Self {
        assert!(!env::state_exists(), "Contract already inicialized");
        let mut this = Self {
            total_supply: 0,
            services_by_account: LookupMap::new(b"a".to_vec()),
            services_by_id: UnorderedMap::new(b"t".to_vec()),
            users: UnorderedMap::new(b"u".to_vec()),
            contract_owner: owner_id.clone().into(),
            extra_storage_in_bytes_per_service: 0,
        };

        this.add_user(owner_id, UserRoles::Admin, "Categories { Programer: {Lenguajes: } }".to_string());

        this.measure_min_service_storage_cost();
        return this;
    }
    
    /*** SERVICES FUNCTIONS ***/

    /// Mintea uno o varios servios de un usuario que sea un profesional (tambien si eres un admin)
    ///
    /// #Arguments
    /// * `metadata`             - La metadata que el profesional asigna a su servicio.
    /// * `active_services`      - La cantidad de services que se desea mintear.
    #[payable]
    pub fn mint_service(&mut self, metadata: ServiceMetadata, mut _active_services: u8) -> Service {
        let sender_id = env::predecessor_account_id();
        let user = self.update_user_mint(); // cantidad de servicios
        let owner_id = user.account_id;

        let is_professional = user.roles.get(&UserRoles::Professional).is_none();
        let is_admin = user.roles.get(&UserRoles::Admin).is_none();
        assert_eq!(is_professional || is_admin, true, "Only professional can mint a service");

        let initial_storage_usage = env::storage_usage();
        env::log(format!("initial store usage: {}", initial_storage_usage).as_bytes());

        let mut service = Service {
            owner_id: owner_id.clone(),
            metadata: metadata,
            employers_account_ids: Default::default(),
            actual_employer_account_id: None
        };
        
        let mut services_set = self
            .services_by_account
            .get(&sender_id)
            .unwrap_or_else(|| UnorderedSet::new(unique_prefix(&sender_id)));

        for _i in 0 .. USER_MINT_LIMIT {
            service.metadata.active = false;
            if _active_services != 0 {
                service.metadata.active = true;
                _active_services -= 1;
            }
            assert!(
                self.services_by_id.insert(&self.total_supply, &service).is_none(),
                "Service already exists"
            );

            services_set.insert(&self.total_supply);
            
            // self.internal_add_service_to_owner(&service.owner_id, &self.total_supply.to_string());
            self.total_supply += 1;
        }

        self.services_by_account.insert(&sender_id, &services_set);

        let new_services_size_in_bytes = env::storage_usage() - initial_storage_usage;
        env::log(format!("New services size in bytes: {}", new_services_size_in_bytes).as_bytes());

        let required_storage_in_bytes = self.extra_storage_in_bytes_per_service + new_services_size_in_bytes;
        env::log(format!("Required storage in bytes: {}", required_storage_in_bytes).as_bytes());

        deposit_refund(required_storage_in_bytes);

        return service
    }

    #[payable]
    // Adquisición de un servicio
    pub fn buy_service(&mut self, service_id: u64) -> Service {
        // Verificar que el servicio exista
        let _service_id = service_id;
        assert_eq!(
            _service_id < self.total_supply, true,
            "The indicated ServiceID doesn't exist"
        );
        let mut service = self.get_service_by_id(service_id.clone());
        // Si no cuenta con los fondos se hace rollback
        assert_eq!(
            service.metadata.active, true,
            "The service is not on sale"
        );
        let amount = env::attached_deposit() / YOCTO_NEAR;
        assert_eq!(
            service.metadata.price as u128, amount,
            "Fondos insuficientes"
        );
        
        let buyer_id = string_to_valid_account_id(&env::predecessor_account_id());
        let buyer = self.get_user(buyer_id.clone());

        assert_eq!(
            buyer.roles.get(&UserRoles::Admin).is_some() || buyer.roles.get(&UserRoles::Employeer).is_some(),
            true,
            "Only employers can buy services"
        );
        
        let owner_id = service.owner_id.clone();
        assert_eq!(buyer.account_id == owner_id, false, "Already is the service owner");

        env::log(
            format!(
                "Transfer {} from @{} to @{}",
                service_id, &owner_id, &buyer.account_id
            )
            .as_bytes(),
        );

        //TODO: transfer the tokens to mediator contract
        // Transferir los nears
        //Promise::new(service.owner_id.clone()).transfer(service.metadata.price as u128 * YOCTO_NEAR);

        // Quitarle el servicio al owner
        self.delete_service(&service_id, &owner_id);

        // Anadirle el servicio al comprador
        self.add_service(&service_id, &buyer.account_id);

        // Modificar la metadata del service
        service.actual_employer_account_id = Some(buyer.account_id.clone());
        service.employers_account_ids.insert(buyer.account_id.clone());
        self.services_by_id.insert(&service_id, &service);

        // if let Some(memo) = memo {
        //     env::log(format!("Memo: {}", memo).as_bytes());
        // }

        return self.get_service_by_id(service_id)
    }


    /// Modificar la metadata de u servicio
    /// 
    pub fn update_service_metadata(&self, service_id: u64, metadata: ServiceMetadata) -> Service {
        // Verificar que el servicio exista
        let _service_id = service_id;
        assert_eq!( _service_id < self.total_supply, true,
            "The indicated ServiceID doesn't exist"
        );

        let mut service = self.get_service_by_id(service_id.clone());

        // Verificar que sea el creador quien ejecuta la funcion
        let sender_id = string_to_valid_account_id(&env::predecessor_account_id());
        let sender = self.get_user(sender_id.clone());
        let owner = service.owner_id.clone();
        let owner_id = string_to_valid_account_id(&owner);
        assert_eq!(
            (sender_id == owner_id) || sender.roles.get(&UserRoles::Admin).is_some(), true,
            "Only the creator or admins can change metadata services"
        );

        // Insertar nueva metadata
        service.metadata = metadata;

        service
    }

    // Cambiar el estado de un servicio activo o no
    pub fn set_service_status(&mut self, service_id: u64, active: bool) -> Service {
        // Verificar que el servicio exista
        assert_eq!(
            service_id < self.total_supply,
            true,
            "The indicated ServiceID doesn't exist"
        );

        let mut service = self.get_service_by_id(service_id.clone());
        let sender = env::predecessor_account_id();
        let user = self.get_user(string_to_valid_account_id(&sender));
        let is_admin = user.roles.get(&UserRoles::Admin).is_some();
        let is_owner = service.owner_id == sender;

        assert_eq!(
            is_admin || is_owner, true,
            "Only the owner or admin can desactivate the service"
        );

        service.metadata.active = active;
        self.services_by_id.insert(&service_id, &service);

        return service
    }

    /// Retornar un servicio
    /// 
    pub fn give_back_service(&mut self, service_id: u64) -> Service {
        // Verificar que el servicio exista
        let _service_id = service_id;
        assert_eq!(
            _service_id < self.total_supply, true,
            "The indicated ServiceID doesn't exist"
        );

        let mut service = self.get_service_by_id(service_id.clone());

        let sender_id = string_to_valid_account_id(&env::predecessor_account_id());
        let sender = self.get_user(sender_id.clone());
        assert_eq!(
            sender.roles.get(&UserRoles::Admin).is_some(), true,
            "Only admins can give back the services"
        );

        self.delete_service(&service_id, &sender.account_id);
        self.add_service(&service_id, &service.owner_id);

        // Modificar la metadata del servicio
        service.actual_employer_account_id = None;
        self.services_by_id.insert(&service_id, &service);

        return service
    }

    #[private]
    fn add_service(&mut self, service_id: &u64, account_id: &String) {
        let mut services_set = self
            .services_by_account
            .get(account_id)
            .unwrap_or_else(|| UnorderedSet::new(unique_prefix(&account_id)));
        services_set.insert(service_id);
        self.services_by_account.insert(account_id, &services_set);
    }

    #[private]
    fn delete_service(&mut self, service_id: &u64, account_id: &String) {
        let mut services_set = self.services_by_account.get(account_id).expect("Service should be owned by the sender");
        services_set.remove(service_id);
        self.services_by_account.insert(&account_id, &services_set);
    }

    /// #Arguments
    /// * `service_id`
    pub fn get_service_by_id(&self, service_id: u64) -> Service {
        return self.services_by_id.get(&service_id.into()).expect("No users found. Register the user first");
    }

    // TODO(Sebas): Optimizar con colocar un limite
    /// Obtener los service y sus metadata de un usuario
    ///
    /// #Arguments
    /// * `account_id`  - La cuenta de mainnet/testnet del usuario.
    pub fn get_service_by_ids(&self, ids: HashSet<u64>) -> Vec<Service> {
        if ids.len() > self.services_by_id.len() as usize {
            env::panic(b"The amounts of ids supere the amount of services");
        }
        let mut services: Vec<Service> = Vec::new();
        for id in ids.iter() {
            services.push(self.services_by_id.get(&id).expect("Service id dont match"));
        }
        return services
    }


    /*** USERS FUNCTIONS ***/

    /// Registra usuarios! Asignandoles un role y a que se dedican por categorias
    ///
    /// #Arguments
    /// * `account_id`  - La cuenta de mainnet/testnet de quien sera registrado.
    /// * `role`        - El role que tendra el usuario. Solo los admin puenden decir quien es moderador.
    /// * `category`    - La categoria en la cual el usuario puede decir a que se dedica.
    #[payable]
    pub fn add_user(&mut self, account_id: ValidAccountId, role: UserRoles, categories: String) -> User {
        self.admin_assert(&env::predecessor_account_id());

        if self.users.len() >= USERS_LIMIT as u64 {
            env::panic(b"Users amount over limit");
        }

        let s_account_id: AccountId = account_id.into();
        let services_set = UnorderedSet::new(unique_prefix(&s_account_id));
        self.services_by_account.insert(&s_account_id, &services_set);

        let initial_storage_usage = env::storage_usage();
        env::log(format!("initial store usage: {}", initial_storage_usage).as_bytes());

        let mut new_user = User{
            account_id: s_account_id.clone(),
            mints: false,
            roles: HashSet::new(),
            rep: 0,
            categories: categories,
            links: None,
            education: None, 
        };
        new_user.roles.insert(role);

        if self.users.insert(&s_account_id, &new_user).is_some() {
            env::panic(b"User account already added");
        }

        let new_services_size_in_bytes = env::storage_usage() - initial_storage_usage;
        env::log(format!("New services size in bytes: {}", new_services_size_in_bytes).as_bytes());

        let required_storage_in_bytes = self.extra_storage_in_bytes_per_service + new_services_size_in_bytes;
        env::log(format!("Required storage in bytes: {}", required_storage_in_bytes).as_bytes());

        deposit_refund_to(required_storage_in_bytes, s_account_id);

        return new_user
    }

    /// Elimina un usuarios y sus services
    ///
    /// #Arguments
    /// * `account_id`  - La cuenta de mainnet/testnet de quien sera registrado.
    // pub fn remove_user(&mut self, account_id: AccountId) {
    //     assert_eq!(env::predecessor_account_id(), self.owner_id, "must be owner_id");
    //     let guest = self.users.get(&account_id.clone().into()).expect("Could not find the user");
    //     // TODO transfer NFTs
    //     self.services_by_account.remove(&guest.account_id);
    //     self.users.remove(&account_id.into());

    // }

    /// Reescribe las categorias del usuario
    ///
    /// #Arguments
    /// * `account_id`  - La cuenta de mainnet/testnet de quien sera registrado.
    /// * `category`    - La categoria en la cual el usuario puede decir a que se dedica.
    pub fn update_user_categories(&mut self, account_id: ValidAccountId, categories: String) -> User {
        if env::predecessor_account_id() == account_id.to_string() {
            env::panic(b"Only the user cant modify it self");
        }

        let mut user = self.get_user(account_id.clone());
        user.categories = categories;
        self.users.insert(&account_id.into(), &user);

        return user;
    }

    /// Agrega un rol mas al usuario
    ///
    /// #Arguments
    /// * `account_id`  - La cuenta de mainnet/testnet de quien sera registrado.
    /// * `role`        - El role que tendra el usuario. Solo los admin puenden decir quien es moderador.
    pub fn set_user_role(&mut self, account_id: ValidAccountId, role: UserRoles, remove: bool) -> User {
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
        
        return user
    }

    /// #Arguments
    /// * `account_id`  - La cuenta de mainnet/testnet del usuario.
    pub fn get_user(&self, account_id: ValidAccountId) -> User {
        self.users.get(&account_id.into()).expect("No users found. Register the user first")
    }

    // TODO(Sebas): Optimizar con paginacion
    /// #Arguments
    /// * `account_id`  - La cuenta de mainnet/testnet del usuario.
    pub fn get_users_by_role(&self, role: UserRoles) -> Vec<User> {

        let mut users: Vec<User> = Vec::new();
        for (_account_id, user) in self.users.iter() {
            if user.roles.get(&role).is_some() {
                users.push(user);
            }
        }

        return users
    }


    /// Obtener id de los services de un usuario
    ///
    /// #Arguments
    /// * `account_id`  - La cuenta de mainnet/testnet del usuario.
    pub fn get_user_services_id(&self, account_id: ValidAccountId) -> Vec<u64> {
        return self.services_by_account.get(&account_id.into()).expect("No users found or dont have any service").to_vec();
    }

    /// Obtener los service y sus metadata de un usuario
    ///
    /// #Arguments
    /// * `account_id`  - La cuenta de mainnet/testnet del usuario.
    /// * `only_active`  - Retornar solo los services activos.
    pub fn get_user_services(&self, account_id: ValidAccountId, only_active: bool) -> Vec<Service> {
        let mut services: Vec<Service> = Vec::new();
        let services_id = self.get_user_services_id(account_id.clone());
        for i in 0 .. services_id.len() {
            let service = self.services_by_id.get(&services_id[i]).expect("Service id dont match");
            if only_active {
                if service.metadata.active {
                    services.push( service ); 
                }
            }
            else {
                services.push( service );
            }
        }
        return services
    }

    #[private]
    fn measure_min_service_storage_cost(&mut self) {
        let initial_storage_usage = env::storage_usage();
        let tmp_account_id = "a".repeat(64);
        let u = UnorderedSet::new(unique_prefix(&tmp_account_id));
        self.services_by_account.insert(&tmp_account_id, &u);

        let services_by_account_entry_in_bytes = env::storage_usage() - initial_storage_usage;
        let owner_id_extra_cost_in_bytes = (tmp_account_id.len() - self.contract_owner.len()) as u64;

        self.extra_storage_in_bytes_per_service =
            services_by_account_entry_in_bytes + owner_id_extra_cost_in_bytes;

        self.services_by_account.remove(&tmp_account_id);
    }

    #[private]
    fn update_user_mint(&mut self) -> User {
        let sender_id = env::predecessor_account_id();
        let mut user = self.users.get(&sender_id).expect("Before mint a nft, create an user");
        assert!(
            user.mints == false,
            "Exceeded user mint limit {}", USER_MINT_LIMIT
        );
        user.mints = true;
        self.users.insert(&sender_id, &user);
        return user
    }


    /*** ASSERTS  ***/

    /// Verificar que sea el admin
    #[private]
    fn admin_assert(&self, account_id: &AccountId) {
        assert_eq!(*account_id, self.contract_owner, "Must be owner_id how call its function");
    }

    // #[private]
    // fn string_to_json(&self, service_id: ServiceId) -> Category {
    //     let example = Category {
    //         category: "Programmer".to_string(),
    //         subcategory: "Backend".to_string(),
    //         areas: "Python, SQL".to_string()
    //     };
    //     let serialized = serde_json::to_string(&example).unwrap();

    //     let string = format!("String: {}", &serialized);
    //     env::log(string.as_bytes());

    // // pub fn string_to_json(&self, service_id: ServiceId) -> Category {
    // pub fn string_to_json(&self) -> Category {
    //     let example = Category {
    //         category: "Programmer".to_string(),
    //         subcategory: "Backend".to_string(),
    //         areas: "Python, SQL".to_string()
    //     };
    //     let serialized = serde_json::to_string(&example).unwrap();

    //     let string = format!("String: {}", &serialized);
    //     env::log(string.as_bytes());

    //     let deserialized: Category = serde_json::from_str(&serialized).unwrap();
    //     deserialized
    // }
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

    #[panic_msg = "Service ID must have a positive quantity and less than 10"]
    InvalidMintAmount { },

    #[panic_msg = "Service ID `{:?}` was not found"]
    ServiceIdNotFound { service_id: u64 },

    /*
    #[panic_msg = "Operation is allowed only for admin"]
    AdminRestrictedOperation,
    #[panic_msg = "Unable to delete Account ID `{}`"]
    NotAuthorized { account_id: AccountId },
    
    #[panic_msg = "Service ID `{:?}` does not belong to account `{}`"]
    ServiceIdNotOwnedBy { service_id: u64, owner_id: AccountId },
    #[panic_msg = "Sender `{}` is not authorized to make transfer"]
    SenderNotAuthToTransfer { sender_id: AccountId },
    #[panic_msg = "The service owner and the receiver should be different"]
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

    #[test]
    fn test_basic() {
        let admin_id = string_to_valid_account_id(&accounts(1).to_string());
        let mut context = get_context(false);
        context.attached_deposit = 58700000000000000000000;
        testing_env!(context.clone());
        let marketplace = Marketplace::new(admin_id.clone());

        let admin: User = marketplace.get_user(admin_id.clone());

        // Verificar que el admin sea creado correctamente
        assert_eq!(
            (admin.mints == false) &&
            (admin.account_id == admin_id.to_string()) &&
            (admin.roles.get(&UserRoles::Admin).is_some()) &&
            (marketplace.get_user_services_id(admin_id).len() == 0) // no minteo ningun service
            ,
            true
        );
    }
    #[test]

    fn test_mint() {
        let mut context = get_context(false);
        let admin_id = string_to_valid_account_id(&accounts(1).to_string());
        context.attached_deposit = 58700000000000000000000;
        context.predecessor_account_id = accounts(1).to_string();
        testing_env!(context);
        let mut marketplace = Marketplace::new(admin_id.clone());

        let jose_service = marketplace.mint_service(ServiceMetadata {
            fullname: "Jose Antoio".to_string(),
            profile_photo_url: "Jose_Antoio.png".to_string(),
            price: 10,
            active: false,
        }, 3);

        let admin: User = marketplace.get_user(admin_id.clone());
        let actives_services = marketplace.get_user_services(admin_id, true);

        assert_eq!(
            (admin.roles.get(&UserRoles::Admin).is_some()) &&
            actives_services.len() == 3 &&
            admin.mints == true
            ,
            true
        );  

        // let user2 = marketplace.add_user(
        //     "maria.testnet".to_string(),
        //     UserRoles::Professional, vec!(category2, category3)
        // );
        // context.attached_deposit = 58700000000000000000000;
        // testing_env!(context);
        // marketplace.mint_service(ServiceMetadata {
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
        // marketplace.mint_service(ServiceMetadata {
        //     fullname: "Ed Robet".to_string(),
        //     profile_photo_url: "Ed_Robet.png".to_string(),
        //     price: 10,
        //     active: true,
        // }, 1);
    }

    // #[test]
    // fn test_user() {
    //     let mut context = get_context(false);
    //     let admin_id = accounts(1).to_string();
    //     context.attached_deposit = 58700000000000000000000;
    //     context.predecessor_account_id = admin_id.clone();
    //     testing_env!(context);
    //     let mut marketplace = Marketplace::new(admin_id.clone());

    //     // let mut context = get_context(false);
    //     // context.attached_deposit = 58700000000000000000000;
    //     // context.predecessor_account_id = accounts(2).to_string();
    //     // testing_env!(context);

    //     let user_id = "andres.testnet";
    //     marketplace.add_user(
    //         user_id.to_string(),
    //         UserRoles::Professional,
    //         vec!(generate_category1())
    //     );

    //     assert_eq!(
    //         true,
    //         true
    //     );
    // }

    #[test]
    fn test_roles() {

    }

    #[test]
    fn test_categories() {

    }
}