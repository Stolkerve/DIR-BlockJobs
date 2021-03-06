use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{LookupMap, UnorderedMap, UnorderedSet};
use near_sdk::json_types::{ValidAccountId, U128};
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::serde_json;
use near_sdk::{env, near_bindgen, AccountId, Balance, PanicOnDefault, Promise, 
    ext_contract, Gas, PromiseResult, PromiseOrValue};
use std::collections::{HashSet};
use std::convert::TryFrom;

use crate::user::*;
use crate::internal::*;
use crate::external::*;
pub use event::*;
mod internal; mod user; mod external; mod event;

near_sdk::setup_alloc!();

const NO_DEPOSIT: Balance = 0;
const BASE_GAS: Gas = 30_000_000_000_000;
const GAS_FT_TRANSFER: Gas = 10_000_000_000_000;
const ONE_DAY: u64 = 86400000000000;
const ONE_YOCTO: Balance = 1;
const DECIMALS: Balance = 1_000_000;

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct Service {
    pub id: u64,
    pub metadata: ServiceMetadata,
    pub creator_id: AccountId,
    pub actual_owner: AccountId,
    pub employers_account_ids: HashSet<AccountId>,
    // Dias que va a durar el trabajo ofrecido.
    pub duration: u16,
    // Uso de timestamp para fijar momento de compra.
    pub buy_moment: u64,
    // Determinar si esta en manos del profesional (false) o de un empleador (true).
    pub sold: bool,
    // Determinar si esta en venta.
    pub on_sale: bool,
    // Determinar si esta en disputa.
    pub on_dispute: bool,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct ServiceMetadata {
    pub title: String,
    pub description: String,
    pub categories: String,
    pub icon: String,
    pub price: u128,
    pub token: AccountId
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct Marketplace {
    pub service_by_id: UnorderedMap<u64, Service>,
    // Servicios de cada usuario.
    pub services_by_account: LookupMap<AccountId, UnorderedSet<u64>>,
    pub total_services: u64,
    // Usuarios del marketplace.
    pub users: UnorderedMap<AccountId, User>,
    pub owner: AccountId,
    pub admins: UnorderedSet<AccountId>,
    pub contract_me: AccountId,
    pub contract_ft: AccountId,
    // Tokens soportados.
    pub tokens: UnorderedSet<AccountId>,
    pub usdc_contract: AccountId,
    pub jobs_contract: AccountId,
    // Balance disponible de tokens de los usuarios.
    pub usdc_balances: LookupMap<AccountId, Balance>,
    pub jobs_balances: LookupMap<AccountId, Balance>,
    pub average_block_time: u64
}

#[near_bindgen]
impl Marketplace {
    /// Inicializa el contrato y asigna el owner. El cual sera el primer Admin.
    ///
    /// #Arguments
    /// * `owner_id`    - La cuenta de mainnet/testnet de quien sera el Owner del contrato.
    #[init]
    #[payable]
    pub fn new(
        owner_id: ValidAccountId, 
        mediator: ValidAccountId, 
        ft: ValidAccountId, 
        usdc: ValidAccountId,
        tokens: Option<Vec<ValidAccountId>>) 
        -> Self 
        {
        if env::state_exists() { env::panic("Contract already inicialized".as_bytes()); }

        let mut this = Self {
            total_services: 0,
            services_by_account: LookupMap::new(b"a".to_vec()),
            service_by_id: UnorderedMap::new(b"b".to_vec()),
            users: UnorderedMap::new(b"c".to_vec()),
            owner: owner_id.clone().into(),
            admins: UnorderedSet::new(b"c".to_vec()),
            contract_me: mediator.clone().into(),
            contract_ft: ft.clone().into(),
            tokens: UnorderedSet::new(b"d".to_vec()),
            usdc_contract: usdc.into(),
            jobs_contract: ft.into(),
            usdc_balances: LookupMap::new(b"e".to_vec()),
            jobs_balances: LookupMap::new(b"f".to_vec()),
            average_block_time: 121
        };
        // Agregar NEAR por default.
        this.tokens.insert(&"near".to_string());

        // Agregar otros tokens en caso de haberse indicado como parametro.
        if let Some(tokens) = tokens {
            for id in tokens {
                this.tokens.insert(id.as_ref());
            }
        }
        this
    }


    /*******************************/
    /****** SERVICES FUNCTIONS *****/
    /*******************************/

    /// Mintea uno o varios servicios.
    /// Solo ejecutable por profesionales. 
    ///
    /// #Arguments
    /// * `metadata`    - La metadata que el profesional asigna a su servicio.
    /// * `quantity`    - La cantidad de services que se desea mintear.
    /// * `duration`    - Duracion en dias estimada para realizarse el servicio.
    #[payable]
    pub fn mint_service(&mut self, metadata: ServiceMetadata, quantity: u16, duration: u16) -> Service {
        let sender = env::predecessor_account_id();

        if metadata.title.len() > 58 {
            env::panic(b"Title max 58 characters");
        }
        else if metadata.title.len() < 10 {
            env::panic(b"Title min 10 characters");
        }

        if metadata.description.len() > 180 {
            env::panic(b"Description max 180 characters");
        }
        else if metadata.description.len() > 180 {
            env::panic(b"Description min 10 characters");
        }

        let categories: Vec<String> = serde_json::from_str(&metadata.categories).unwrap();
        if categories.len() > 15 {
            env::panic(b"Max 15 categories");
        }
        else if categories.len() < 1 {
            env::panic(b"Min 1 categories");
        }

        let initial_storage_usage = env::storage_usage();

        //Verificar que sea un profesional
        let user = self.get_user(string_to_valid_account_id(&sender).clone()); // Cantidad de servicios
        assert_eq!(user.is_employee == true, b"Only professionals can mint a service");
        
        // env::log(format!("initial store usage: {}", initial_storage_usage).as_bytes());

        let mut service = Service {
            id: self.total_services.clone(),
            creator_id: sender.clone(),
            metadata: metadata,
            employers_account_ids: Default::default(),
            actual_owner: sender.clone(),
            duration: duration,
            buy_moment: 0,
            sold: false,
            on_sale: true,
            on_dispute: false,
        };
        
        let mut services_set = self
            .services_by_account
            .get(&sender)
            .unwrap_or_else(|| UnorderedSet::new(unique_prefix(&sender)));

        for _i in 0 .. quantity {
            self.total_services += 1;

            service.id = self.total_services.clone();
            service.on_sale = true;
            
            if self.service_by_id.insert(&self.total_services.clone(), &service).is_some() {
                env::panic(b"Service already exists");
            }
            
            services_set.insert(&self.total_services.clone());

            NearEvent::log_service_mint(
                service.id.clone().to_string(),
                service.actual_owner.clone().to_string(),
                service.metadata.title.clone(),
                service.metadata.description.clone(),
                service.metadata.categories.clone(),
                service.metadata.price.clone().to_string(),
                service.duration.clone().to_string(),
            );
        }

        self.services_by_account.insert(&sender, &services_set);

        // Manejo del storage.
        let required_storage_in_bytes = env::storage_usage() - initial_storage_usage;
        // env::log(format!("New services size in bytes: {}", new_services_size_in_bytes).as_bytes());

        deposit_refund(required_storage_in_bytes);
        service
    }


    /// Adquisicion de un servicio.
    /// Solo ejecutable por empleadores.
    #[payable]
    pub fn buy_service(&mut self, service_id: u64) {
        // Verificar que el servicio exista.
        self.assert_service_exists(&service_id);

        let mut service = self.get_service_by_id(service_id.clone());
        
        // Verificar que este en venta.
        if !service.on_sale {
            env::panic(b"The indicated service is not on sale")
        }

        let sender = env::predecessor_account_id();
        let buyer = self.get_user(string_to_valid_account_id(&sender).clone());

        // Verificar que no lo haya comprado ya.
        if buyer.account_id == service.actual_owner.clone() {
            env::panic(b"Already is the service owner");
        }
        
        let token = &service.metadata.token;
        // Realizar el pago en NEARs.
        if token == "near" {
            if env::attached_deposit() < service.metadata.price {
                env::panic(b"Insufficient NEARs balance");
            }

            Promise::new(self.contract_me.clone()).transfer(service.metadata.price);

            // Establecer como servicio vendido y no en venta.
            service.sold = true;
            service.on_sale = false;

            // Cambiar propiedad del servicio.
            service.actual_owner = sender.clone();
            self.delete_service(&service_id, &service.actual_owner);
            self.add_service(&service_id, &buyer.account_id);

            // Establecer tiempo de la compra.
            service.buy_moment = env::block_timestamp();

            self.service_by_id.insert(&service_id, &service);
        } else {
            let token = service.metadata.token;

            if token == self.usdc_contract {
                let buyer_balance = self.usdc_balances.get(&buyer.account_id).unwrap_or(0);
                assert!(buyer_balance >= service.metadata.price, "Insufficient USDC balance in the marketplace wallet");
            }
            else if token == self.jobs_contract {
                let buyer_balance = self.jobs_balances.get(&buyer.account_id).unwrap_or(0);
                assert!(buyer_balance >= service.metadata.price, "Insufficient JOBS balance in the marketplace wallet");
            } 
            else {
                env::panic(b"Token not soported");
            }        

            // Realizar el pago en el token indicado.
            ext_contract::ft_transfer(
                self.contract_me.clone(),
                (service.metadata.price).into(),
                None,
                &token, ONE_YOCTO, GAS_FT_TRANSFER
            ).then(ext_self::on_buy_service(
                service_id,
                &env::current_account_id(), NO_DEPOSIT, BASE_GAS)
            );
        };

        NearEvent::log_service_buy(
            service.id.clone().to_string(),
            sender.clone().to_string()
        );
    }


    /// Dar por aprobado un servicio por parte del empleador.
    /// 
    #[payable]
    pub fn approve_service(&mut self, service_id: u64, vote: u16) {
        let service = self.get_service_by_id(service_id.clone());
        let user = env::predecessor_account_id();

        assert!(service.actual_owner == user, "You aren't the owner");
        assert!(service.on_dispute == false, "You already have requested a dispute for this service");

        let mut creator = self.get_user(string_to_valid_account_id(&service.creator_id).clone());
        creator.reputation += vote;
        creator.votes += 1;

        let _res = ext_mediator::pay_service(
            env::signer_account_id(),
            (service.metadata.price*DECIMALS).into(),
            service.metadata.token.clone(),
            &self.contract_me,
            ONE_YOCTO,
            BASE_GAS,
        ).then(ext_self::on_return_service(
            service_id,
            &env::current_account_id(),
            NO_DEPOSIT,
            BASE_GAS,
        ));
    }

    
    /// Crear disputa en el contrato mediador.
    /// Solo ejecutable por el empleador que compro el servicio.
    ///
    #[payable]
    pub fn reclaim_dispute(&mut self, service_id: u64, proves: String) {
        // Verificar que no haya sido banneado quien solicita la disputa.
        let user_id = string_to_valid_account_id(&env::predecessor_account_id());
        if self.get_user(user_id).banned == true {
            env::panic(b"You are already banned for fraudulent disputes");
        }
        // Verificar que el servicio exista.
        self.assert_service_exists(&service_id);

        let service = self.get_service_by_id(service_id.clone());

        // Verificar que efectivamente haya comprado el servicio.
        if service.actual_owner != env::signer_account_id() || service.actual_owner == service.creator_id {
            env::panic(b"Only the employeer that buy the service can init a dispute");
        }
        // Verificar que no este ya solicitada la disputa.
        if service.on_dispute == true {
            env::panic(b"Actually the service is in dispute");
        };

        let _res = ext_mediator::new_dispute(
            service_id,
            env::signer_account_id(),
            service.creator_id.clone(),
            proves,
            service.metadata.price.clone(),
            &self.contract_me,
            env::attached_deposit(),
            BASE_GAS,
        ).then(ext_self::on_new_dispute(
            service_id,
            &env::current_account_id(),
            NO_DEPOSIT,
            BASE_GAS,
        ));
    }


    /// Retornar un servicio al creador.
    /// Solo ejecutable por el profesional creador del servicio una vez pasado el tiempo establecido.
    #[payable]
    pub fn reclaim_service(&mut self, service_id: u64) {
        // Verificar que el servicio exista.
        self.assert_service_exists(&service_id);

        let service = self.get_service_by_id(service_id.clone());

        // Verificar que haya pasado el tiempo establecido para poder hacer el reclamo.
        env::log(format!("Tiempo de liberacion {}", service.buy_moment + ONE_DAY * (service.duration as u64)).as_bytes());
        if env::block_timestamp() < service.buy_moment + ONE_DAY * (service.duration as u64) / (self.average_block_time/100) {
            env::panic("Insuficient time to reclame the service".as_bytes());
        }

        // Verificar que el empleador no haya solicitado una disputa.
        if service.on_dispute == true {
            env::panic(b"Actually the service is in dispute");
        }

        let sender_id = string_to_valid_account_id(&env::predecessor_account_id());
        env::log(sender_id.to_string().as_bytes());

        if service.creator_id != env::signer_account_id() {
            env::panic(b"Only the corresponding professional can reclaim the service");
        }

        let _res = ext_mediator::pay_service(
            env::signer_account_id(),
            (service.metadata.price*DECIMALS).into(),
            service.metadata.token.clone(),
            &self.contract_me,
            NO_DEPOSIT,
            BASE_GAS,
        ).then(ext_self::on_return_service(
            service_id,
            &env::current_account_id(),
            NO_DEPOSIT,
            BASE_GAS,
        ));

        NearEvent::log_service_reclaim(
            service.id.clone().to_string(),
            sender_id.clone().to_string()
        );
    }


    /// Retornar un servicio al creador.
    /// Ejecutable solo por el admin, previa aprobacion de ambas partes.
    /// 
    pub fn return_service_by_admin(&mut self, service_id: u64) {
        // Verificar que el servicio exista.
        self.assert_service_exists(&service_id);

        let service = self.get_service_by_id(service_id.clone());

        let sender_id = string_to_valid_account_id(&env::predecessor_account_id());
        env::log(sender_id.to_string().as_bytes());
        let sender = self.get_user(sender_id.clone());
        if !self.admins.contains(&sender.account_id) {
            env::panic("Only admins can give back the services".as_bytes());
        }

        let _res = ext_mediator::pay_service(
            env::signer_account_id(),
            (service.metadata.price*DECIMALS).into(),
            service.metadata.token.clone(),
            &self.contract_me,
            NO_DEPOSIT,
            BASE_GAS,
        ).then(ext_self::on_return_service(
            service_id,
            &env::current_account_id(),
            NO_DEPOSIT,
            BASE_GAS,
        ));

        NearEvent::log_service_return(
            service.id.clone().to_string(),
            service.creator_id.clone().to_string()
        );
    }



    /// Modificar la metadata de un servicio.
    /// Solo ejecutable por el profesional si es que lo posee.
    ///
    #[payable]
    pub fn update_service(&mut self, service_id: u64, metadata: ServiceMetadata, duration: u16) -> Service {
        if metadata.title.len() > 58 {
            env::panic(b"Title max 58 characters");
        }
        else if metadata.title.len() < 10 {
            env::panic(b"Title min 10 characters");
        }

        if metadata.description.len() > 180 {
            env::panic(b"Description max 180 characters");
        }
        else if metadata.description.len() > 180 {
            env::panic(b"Description min 10 characters");
        }

        let categories: Vec<String> = serde_json::from_str(&metadata.categories).unwrap();
        if categories.len() > 15 {
            env::panic(b"Max 15 categories");
        }
        else if categories.len() < 1 {
            env::panic(b"Min 1 categories");
        }

        let initial_storage_usage = env::storage_usage();
        env::log(format!("initial store usage: {}", initial_storage_usage).as_bytes());

        // Verificar que el servicio exista.
        self.assert_service_exists(&service_id);

        let mut service = self.get_service_by_id(service_id.clone());

        // Verificar que no este ya comprado.
        if service.sold == true {
            env::panic(b"You can't modify while the service is in hands of the employer")
        }

        // Verificar que sea el creador quien ejecuta la funcion.
        let sender_id = string_to_valid_account_id(&env::predecessor_account_id());
        let sender = self.get_user(sender_id.clone());
        let owner = service.creator_id.clone();
        let owner_id = string_to_valid_account_id(&owner);
        if !self.admins.contains(&sender.account_id) {
            env::panic("Only the creator or Admins can change metadata services".as_bytes());
        }

        // Insertar nueva metadata.
        service.metadata = metadata;
        service.duration = duration;

        self.service_by_id.insert(&service_id, &service);

        if initial_storage_usage <  env::storage_usage() {
            let required_storage_in_bytes = env::storage_usage() - initial_storage_usage;
            env::log(format!("New size in bytes: {}", required_storage_in_bytes).as_bytes());
            
            deposit_refund_to(required_storage_in_bytes, env::predecessor_account_id());
        }

        NearEvent::log_service_update_metadata(
            service.id.clone().to_string(),
            service.metadata.title.clone(),
            service.metadata.description.clone(),
            service.metadata.categories.clone(),
            service.metadata.price.clone().to_string(),
            service.duration.clone().to_string(),
        );  
        service
    }


    /// Cambiar el estado de un servicio segun este en venta o no.
    /// Solo para el profesional o administradores.
    /// 
    pub fn update_service_on_sale(&mut self, service_id: u64, on_sale: bool) -> Service {
        // Verificar que el servicio exista.
        self.assert_service_exists(&service_id);

        let mut service = self.get_service_by_id(service_id.clone());
        let sender = env::predecessor_account_id();
        let user = self.get_user(string_to_valid_account_id(&sender));

        let is_creator = service.creator_id == sender;

        // Verificar que sea el cleador.
        if !self.admins.contains(&user.account_id) && !is_creator {
            env::panic("Only the owner or admin can desactivate or activate the service".as_bytes());
        }

        // Verificar que no este ya comprado.
        if service.sold == true {
            env::panic(b"You can't modify while the service is in hands of the employer")
        }

        service.on_sale = on_sale;
        self.service_by_id.insert(&service_id, &service);

        NearEvent::log_service_update_on_sale(
            service_id.clone().to_string(),
            on_sale.clone().to_string()
        );

        service
    }


    /*******************************/
    /******** USERS FUNCTIONS ******/
    /*******************************/

    /// Registra usuarios, asignando su rol y a que se dedican por categorias.
    ///
    /// #Arguments
    /// * `account_id`  - La cuenta de mainnet/testnet de quien sera registrado.
    /// * `roles`        - El rol o roles que tendra el usuario. Solo los admin puenden decir quien es moderador.
    /// * `personal_data`    - Categories y areas las cuales el usuario puede decir a que se dedica.
    #[payable]
    pub fn add_user(&mut self, is_employee: bool, personal_data: Option<String>) -> User {
        let initial_storage_usage = env::storage_usage();
        env::log(format!("initial store usage: {}", initial_storage_usage).as_bytes());

        let account_id: AccountId = env::predecessor_account_id();

        if personal_data.is_some() {
            // Solo vereficar los nombre del json.
            let p: PersonalData = serde_json::from_str(personal_data.as_ref().unwrap()).unwrap();
            if p.legal_name.len() > 60 {
                env::panic(b"Legal name max 60 characters");
            }
            if p.education.len() > 60 {
                env::panic(b"Education max 60 characters");
            }
            if p.country.len() > 30 {
                env::panic(b"Country max 30 characters");
            }
            if p.email.len() > 60 {
                env::panic(b"Email max 60 characters");
            }
            if p.bio.len() > 400 {
                env::panic(b"Bio max 400 characters");
            }
            if p.idioms.len() > 15 {
                env::panic(b"Max 15 idioms");
            }
            if p.links.len() > 10 {
                env::panic(b"Max 10 links");
            }
        }
        
        let services_set = UnorderedSet::new(unique_prefix(&account_id));

        self.services_by_account.insert(&account_id, &services_set);

        let mut new_user = User{
            account_id: account_id.clone(),
            reputation: 40,
            votes: 1,
            is_employee: is_employee,
            is_company: false,
            personal_data: personal_data, 
            banned: false,
        };

        if self.users.insert(&account_id, &new_user).is_some() {
            env::panic(b"User account already added");
        }

        let required_storage_in_bytes = env::storage_usage() - initial_storage_usage;
        env::log(format!("New services size in bytes: {}", required_storage_in_bytes).as_bytes());

        deposit_refund_to(required_storage_in_bytes, account_id);

        NearEvent::log_user_new(
            new_user.account_id.clone().to_string(),
            is_employee,
            new_user.personal_data.clone(),
            new_user.reputation.clone().to_string(),
            new_user.banned.clone().to_string()
        );
        new_user
    }


    /// Eliminar un usuario.
    /// Solo ejecutable por el Admin.
    ///
    /// #Arguments
    /// * `account_id`  - La cuenta de mainnet/testnet de quien sera registrado.
    pub fn remove_user(&mut self, account_id: ValidAccountId) {
        self.assert_owner();
        
        let user = self.get_user(account_id.clone());

        self.services_by_account.remove(&user.account_id);
        self.users.remove(&account_id.into());
    }


    /// Reescribe las categorias del usuario.
    ///
    /// #Arguments
    /// * `account_id`  - La cuenta de mainnet/testnet de quien sera registrado.
    /// * `category`    - La categoria en la cual el usuario puede decir a que se dedica.
    #[payable]
    pub fn update_user_data(&mut self, data: String) -> User {
        let initial_storage_usage = env::storage_usage();
        env::log(format!("Initial store usage: {}", initial_storage_usage).as_bytes());
        
        // Solo vereficar los nombre del json.
        let _p: PersonalData = serde_json::from_str(&data).unwrap();
        
        let account_id: AccountId = env::predecessor_account_id();
        let mut user = self.get_user(string_to_valid_account_id(&account_id));
        
        if account_id.to_string() != user.account_id {
            env::panic(b"Only the user can modify this parameter");
        }
        
        user.personal_data = Some(data.clone());

        self.users.insert(&account_id.clone(), &user);

        env::log(format!("Second store usage: {}", env::storage_usage()).as_bytes());
        if initial_storage_usage <  env::storage_usage() {
            let required_storage_in_bytes = env::storage_usage() - initial_storage_usage;
            env::log(format!("New size in bytes: {}", required_storage_in_bytes).as_bytes());

            deposit_refund_to(required_storage_in_bytes, account_id);
        }

        NearEvent::log_user_update_data(
            user.account_id.clone(),
            data.clone()
        );
        user
    }

    /// Agregar o quitar un rol al usuario.
    ///
    pub fn set_user_role(&mut self, account_id: ValidAccountId, remove: bool) -> User {
        self.assert_admin();

        let mut user = self.get_user(account_id.clone());

        if !remove { user.is_company = true }
        else { user.is_company = false }

        self.users.insert(&account_id.clone().into(), &user);

        NearEvent::log_user_update_roles(
            account_id.clone().to_string(),
            remove
        );
        user
    }

    //////////////////////
    // * FT FUNCTIONS * //
    /////////////////////

    /// Hacer withdraw de los FT por parte del usuario.
    /// 
    pub fn withdraw_ft(&mut self, amount: U128, token: AccountId) -> Balance {
        let sender = env::predecessor_account_id();
        if token == self.usdc_contract {
            let actual_balance = self.usdc_balances.get(&sender).unwrap_or(0);
            assert!(actual_balance >= amount.into(), "Insufficient balance");

            let new_balance = actual_balance - amount.0;
            self.usdc_balances.insert(&sender, &new_balance);

            ext_contract::ft_transfer(
                sender.clone(),
                amount.clone(),
                None,
                &token, ONE_YOCTO, GAS_FT_TRANSFER
            );
            return new_balance;
        }
        else if token == self.jobs_contract {
            let actual_balance = self.jobs_balances.get(&sender).unwrap_or(0);
            assert!(actual_balance >= amount.into(), "Insufficient balance");

            let new_balance = actual_balance - amount.0;
            self.jobs_balances.insert(&sender, &new_balance);

            ext_contract::ft_transfer(
                sender.clone(),
                amount.clone(),
                None,
                &token, ONE_YOCTO, GAS_FT_TRANSFER
            );
            return new_balance;
        }
        else {
            env::panic(b"Token not soported");
        }
    }


    /*******************************/
    /****** ADMIN'S FUNCTIONS *****/
    /*******************************/

    /// Agregar nuevo token soportado.
    /// 
    pub fn add_token(&mut self, token: ValidAccountId) -> ValidAccountId {
        self.assert_owner();
        if self.tokens.contains(&token.to_string()) {
            env::panic(b"Token already added");
        }
        self.tokens.insert(token.as_ref());
        token
    }


    /// Agregar nuevo Admin.
    /// 
    pub fn add_admin(&mut self, account: ValidAccountId, add: bool) -> ValidAccountId {
        self.assert_owner();

        if add {
            assert!(!self.admins.contains(&account.to_string()), "Admin already added");
            self.admins.insert(account.as_ref());
        }
        else {
            assert!(self.admins.contains(&account.to_string()), "Account is not an Admin");
            self.admins.remove(account.as_ref());
        }
        account
    }
    

    /// Modificar las address de los contratos
    /// 
    pub fn change_address(&mut self, contract_name: String, new_address: AccountId) {
        self.assert_owner();
        if contract_name == "marketplace".to_string() {
            self.owner = new_address;
        } else if contract_name == "mediator".to_string() {
            self.contract_me = new_address;
        } else if contract_name == "ft".to_string() {
            self.contract_ft = new_address;
        } else {
            env::panic(b"Incorrect contract name");
        }
    }


    /// Modificar tiempo promedio de bloque
    /// 
    pub fn set_block_time(&mut self, new_time: u64) {
        self.assert_owner();
        self.average_block_time = new_time;
    }


    /********************************/
    /****** CALLBACK FUNCTIONS ******/
    /********************************/

    /// Verificar datos de usuario desde mediator
    /// 
    pub fn validate_user(&self, account_id: AccountId) -> bool {
        let user_id = string_to_valid_account_id(&account_id);
        let user = self.get_user(user_id);

        if user.reputation/user.votes < 30 {
            env::panic(b"Your reputation isn't sufficient");
        }
        true
    }
    

    /// Callback para retornar un servicio al creador.
    /// Ejecutable solo el contrator mediador una vez finalizada la disputa.
    /// 
    pub fn return_service_by_mediator(&mut self, service_id: &u64) -> Service {
        let mut service = self.get_service_by_id(service_id.clone());

        // Verificar que sea el contrator mediador quien ejecuta
        let sender_id = env::predecessor_account_id();
        if sender_id != self.contract_me  {
            env::panic(b"Only mediator contract can execute this function");
        }

        self.delete_service(&service_id, &service.actual_owner);
        self.add_service(&service_id, &service.creator_id);

        // Modificar la metadata del servicio
        service.actual_owner = service.creator_id.clone();
        service.on_sale = true;
        service.buy_moment = 0;
        service.on_dispute = false;
        self.service_by_id.insert(&service_id, &service);

        service
    }


    /// Banear un usuario ante fraude en una disputa
    /// Solo ejecutable por Admins del contrato mediadot
    /// 
    pub fn ban_user_by_mediator(&mut self, user_id: AccountId) -> User {
        // Verificar que sea el contrator mediador quien ejecuta
        if env::predecessor_account_id() != self.contract_me  {
            env::panic(b"Only mediator contract can execute this function");
        }

        let user_id = string_to_valid_account_id(&user_id);
        let mut user = self.get_user(user_id);

        user.banned = true;
        user
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
        let mut services_set = expect_value_found(self.services_by_account.get(account_id), "Service should be owned by the sender".as_bytes());
        services_set.remove(service_id);
        self.services_by_account.insert(&account_id, &services_set);
    }

}
