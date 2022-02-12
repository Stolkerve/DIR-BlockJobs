use crate::*;

// static DELIMETER: &str = "||";

trait FungibleTokenReceiver {
    fn ft_on_transfer(&mut self, sender_id: AccountId, amount: U128, msg: String) -> PromiseOrValue<U128>;
}

#[near_bindgen]
impl FungibleTokenReceiver for Marketplace {
    fn ft_on_transfer(&mut self, _sender_id: AccountId, _amount: U128, _msg: String) -> PromiseOrValue<U128> {
        PromiseOrValue::Value(U128(0))
    }
}

impl Marketplace {

    /// Callback luego de realizarse el pago que queda inicialmente bloqueado.
    pub fn on_buy_service(&mut self, service_id: u64) -> Service {
        match env::promise_result(0) {
            PromiseResult::Successful(_data) => {
                let mut service = self.get_service_by_id(service_id.clone());
                let sender = env::predecessor_account_id();
                let buyer = self.get_user(string_to_valid_account_id(&sender).clone());

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

                return service;
            }
            PromiseResult::Failed => env::panic(b"Callback faild"),
            PromiseResult::NotReady => env::panic(b"Callback faild"),
        };
    }

    /// Callback desde contrato mediador.
    /// 
    pub fn on_new_dispute(&mut self, service_id: u64) {
        if env::predecessor_account_id() != env::current_account_id() {
            env::panic(b"Only the contract can call its function")
        }
        assert_eq!(env::promise_results_count(), 1, "Contract expected a result on the callback");
        
        match env::promise_result(0) {
            PromiseResult::Successful(_data) => {
                let mut service = self.get_service_by_id(service_id.clone());

                service.on_dispute = true;
                self.service_by_id.insert(&service_id, &service);

            }
            PromiseResult::Failed => env::panic(b"Callback faild"),
            PromiseResult::NotReady => env::panic(b"Callback faild"),
        };
    }

    /// Callback por reclamo de un servicio por parte del profesional.
    /// 
    pub fn on_return_service(&mut self, service_id: u64) -> Service {
        if env::predecessor_account_id() != env::current_account_id() {
            env::panic(b"Only the contract can call its function")
        }
        assert_eq!(env::promise_results_count(), 1, "Contract expected a result on the callback");
        
        match env::promise_result(0) {
            PromiseResult::Successful(_data) => {
                let mut service = self.get_service_by_id(service_id.clone());

                self.delete_service(&service_id, &service.actual_owner);
                self.add_service(&service_id, &service.creator_id);

                // Modificar los datos del servicio.
                service.actual_owner = service.creator_id.clone();
                service.on_sale = true;
                service.buy_moment = 0;
                service.sold = false;
                self.service_by_id.insert(&service_id, &service);

                return service;
            }
            PromiseResult::Failed => env::panic(b"Callback faild"),
            PromiseResult::NotReady => env::panic(b"Callback faild"),
        };
    }
    

}


#[ext_contract(ext_token)]
pub trait Token {
    fn mint(receiver: ValidAccountId, quantity: U128);
    fn transfer_tokens(to: AccountId, amount: Balance);
}
#[ext_contract(ext_mediator)]
pub trait Mediator {
    fn new_dispute(service_id: u64, applicant: AccountId, accused: AccountId, proves: String, price: u128);
    fn pay_service(beneficiary: AccountId, amount: Balance) -> Balance;
}
#[ext_contract(ext_self)]
pub trait ExtSelf {
    fn on_new_dispute(service_id: u64);
    fn on_transfer_tokens(service_id: u64);
    fn on_buy_service(service_id: u64) -> Service;
    fn on_return_service(service_id: u64);
}
#[ext_contract(ext_contract)]
trait ExtContract {
    fn ft_transfer(&mut self, receiver_id: AccountId, amount: U128, memo: Option<String>);
    fn internal_transfer(&mut self, sender_id:AccountId, receiver_id: AccountId, amount: U128, memo: Option<String>);
}