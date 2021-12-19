use crate::*;
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{LookupMap, TreeMap, UnorderedSet};
use near_sdk::json_types::ValidAccountId;
use near_sdk::{
    assert_one_yocto, env, log, AccountId, Balance, BorshStorageKey, CryptoHash,
    IntoStorageKey, StorageUsage,ext_contract, Gas, PromiseResult
};
use std::collections::HashMap;

const GAS_FOR_RESOLVE_TRANSFER: Gas = 10_000_000_000_000;
const GAS_FOR_NFT_TRANSFER_CALL: Gas = 25_000_000_000_000 + GAS_FOR_RESOLVE_TRANSFER;
const NO_DEPOSIT: Balance = 0;

#[derive(BorshDeserialize, BorshSerialize)]
pub struct NonFungibleToken {
    // owner of contract; this is the only account allowed to call `mint`
    pub owner_id: AccountId,
    // The storage size in bytes for each new token
    pub extra_storage_in_bytes_per_token: StorageUsage,
    // always required
    pub owner_by_id: TreeMap<TokenId, AccountId>,
    // required by metadata extension
    pub token_metadata_by_id: Option<LookupMap<TokenId, TokenMetadata>>,
    // required by enumeration extension
    pub services_by_account: Option<LookupMap<AccountId, UnorderedSet<TokenId>>>,
    // required by approval extension
    pub approvals_by_id: Option<LookupMap<TokenId, HashMap<AccountId, u64>>>,
    pub next_approval_id_by_id: Option<LookupMap<TokenId, u64>>,
}

#[derive(BorshStorageKey, BorshSerialize)]
pub enum StorageKey {
    TokensPerOwner { account_hash: Vec<u8> },
    TokenPerOwnerInner { account_id_hash: CryptoHash },
}

pub trait NonFungibleTokenCore {
    fn nft_transfer(
        &mut self,
        receiver_id: ValidAccountId,
        token_id: TokenId,
        enforce_approval_id: Option<u64>,
        memo: Option<String>,
    );

    /// Returns `true` if the token was transferred from the sender's account.
    fn nft_transfer_call(
        &mut self,
        receiver_id: ValidAccountId,
        token_id: TokenId,
        enforce_approval_id: Option<u64>,
        memo: Option<String>,
        msg: String,
    ) -> Promise;

    fn nft_approve(&mut self, token_id: TokenId, account_id: ValidAccountId, msg: Option<String>) -> bool;

    fn nft_revoke(&mut self, token_id: TokenId, account_id: ValidAccountId) -> bool;

    fn nft_revoke_all(&mut self, token_id: TokenId) -> bool;

    fn nft_token(&self, token_id: TokenId) -> Option<Token>;
}

#[ext_contract(ext_non_fungible_token_receiver)]
trait NonFungibleTokenReceiver {
    /// Returns `true` if the token should be returned back to the sender.
    /// TODO: Maybe make it inverse. E.g. true to keep it.
    fn nft_on_transfer(
        &mut self,
        sender_id: AccountId,
        previous_owner_id: AccountId,
        token_id: TokenId,
        msg: String,
    ) -> Promise;
}

#[ext_contract(ext_non_fungible_approval_receiver)]
trait NonFungibleTokenApprovalsReceiver {
    fn nft_on_approve(
        &mut self,
        token_contract_id: AccountId,
        token_id: TokenId,
        owner_id: AccountId,
        approval_id: u64,
        msg: Option<String>,
    ) -> Promise;
}

#[ext_contract(ext_self)]
trait NonFungibleTokenResolver {
    fn nft_resolve_transfer(
        &mut self,
        owner_id: AccountId,
        receiver_id: AccountId,
        approved_account_ids: HashSet<AccountId>,
        token_id: TokenId,
    ) -> bool;
}

trait NonFungibleTokenResolver {
    fn nft_resolve_transfer(
        &mut self,
        owner_id: AccountId,
        receiver_id: AccountId,
        approved_account_ids: HashSet<AccountId>,
        token_id: TokenId,
    ) -> bool;
}

#[near_bindgen]
impl NonFungibleTokenCore for Contract {
    #[payable]
    fn nft_transfer(
        &mut self,
        receiver_id: ValidAccountId,
        token_id: TokenId,
        enforce_approval_id: Option<u64>,
        memo: Option<String>,
    ) {
        assert_one_yocto();

        let sender_id = env::predecessor_account_id();
        let (previous_owner_id, approved_account_ids) = self.internal_transfer(
            &sender_id,
            receiver_id.as_ref(),
            &token_id,
            enforce_approval_id,
            memo,
        );

        refund_approved_account_ids(previous_owner_id, &approved_account_ids);
    }

    #[payable]
    fn nft_transfer_call(
        &mut self,
        receiver_id: ValidAccountId,
        token_id: TokenId,
        enforce_approval_id: Option<u64>,
        memo: Option<String>,
        msg: String,
    ) -> Promise {
        assert_one_yocto();
        let sender_id = env::predecessor_account_id();
        let (owner_id, approved_account_ids) = self.internal_transfer(
            &sender_id,
            receiver_id.as_ref(),
            &token_id,
            enforce_approval_id,
            memo,
        );
        // Initiating receiver's call and the callback
        ext_non_fungible_token_receiver::nft_on_transfer(
            sender_id.clone(),
            owner_id.clone(),
            token_id.clone(),
            msg,
            receiver_id.as_ref(),
            NO_DEPOSIT,
            env::prepaid_gas() - GAS_FOR_NFT_TRANSFER_CALL,
        )
        .then(ext_self::nft_resolve_transfer(
            owner_id,
            receiver_id.into(),
            approved_account_ids,
            token_id,
            &env::current_account_id(),
            NO_DEPOSIT,
            GAS_FOR_RESOLVE_TRANSFER,
        ))
    }

    #[payable]
    fn nft_approve(
        &mut self,
        token_id: TokenId,
        account_id: ValidAccountId,
        msg: Option<String>,
    ) -> bool {
        let mut deposit = env::attached_deposit();
        let account_id: AccountId = account_id.into();
        let storage_required = bytes_for_approved_account_id(&account_id);
        assert!(deposit >= storage_required as u128, "Deposit doesn't cover storage of account_id: {}", account_id.clone());

        let mut token = self.services_by_id.get(&token_id).expect("Token not found");
        assert_eq!(&env::predecessor_account_id(), &token.owner_id);

        if token.approved_account_ids.insert(account_id.clone()) {
            deposit -= storage_required as u128;

            token.approval_id += 1;

            self.services_by_id.insert(&token_id, &token);
            ext_non_fungible_approval_receiver::nft_on_approve(
                env::current_account_id(),
                token_id,
                token.owner_id,
                token.approval_id,
                msg,
                &account_id,
                deposit,
                env::prepaid_gas() - GAS_FOR_NFT_TRANSFER_CALL,
            );
            true
        } else {
            false
        }
    }

    #[payable]
    fn nft_revoke(
        &mut self,
        token_id: TokenId,
        account_id: ValidAccountId,
    ) -> bool {
        assert_one_yocto();
        let mut token = self.services_by_id.get(&token_id).expect("Token not found");
        let predecessor_account_id = env::predecessor_account_id();
        assert_eq!(&predecessor_account_id, &token.owner_id);
        if token.approved_account_ids.remove(account_id.as_ref()) {
            let storage_released = bytes_for_approved_account_id(account_id.as_ref());
            Promise::new(env::predecessor_account_id())
                .transfer(Balance::from(storage_released) * STORAGE_PRICE_PER_BYTE);
            self.services_by_id.insert(&token_id, &token);
            true
        } else {
            false
        }
    }

    #[payable]
    fn nft_revoke_all(
        &mut self,
        token_id: TokenId,
    ) -> bool {
        assert_one_yocto();
        let mut token = self.services_by_id.get(&token_id).expect("Token not found");
        let predecessor_account_id = env::predecessor_account_id();
        assert_eq!(&predecessor_account_id, &token.owner_id);
        if !token.approved_account_ids.is_empty() {
            refund_approved_account_ids(predecessor_account_id, &token.approved_account_ids);
            token.approved_account_ids.clear();
            self.services_by_id.insert(&token_id, &token);
            true
        } else {
            false
        }
    }

    fn nft_token(&self, token_id: TokenId) -> Option<Token> {
        self.services_by_id.get(&token_id)
    }
}

#[near_bindgen]
impl NonFungibleTokenResolver for Contract {
    fn nft_resolve_transfer(
        &mut self,
        owner_id: AccountId,
        receiver_id: AccountId,
        approved_account_ids: HashSet<AccountId>,
        token_id: TokenId,
    ) -> bool {
        assert_self();

        // Whether receiver wants to return token back to the sender, based on `nft_on_transfer`
        // call result.
        if let PromiseResult::Successful(value) = env::promise_result(0) {
            if let Ok(return_token) = near_sdk::serde_json::from_slice::<bool>(&value) {
                if !return_token {
                    // Token was successfully received.
                    refund_approved_account_ids(owner_id, &approved_account_ids);
                    return true;
                }
            }
        }

        let mut token = if let Some(token) = self.services_by_id.get(&token_id) {
            if &token.owner_id != &receiver_id {
                // The token is not owner by the receiver anymore. Can't return it.
                refund_approved_account_ids(owner_id, &approved_account_ids);
                return true;
            }
            token
        } else {
            // The token was burned and doesn't exist anymore.
            refund_approved_account_ids(owner_id, &approved_account_ids);
            return true;
        };

        env::log(format!("Return {} from @{} to @{}", token_id, receiver_id, owner_id).as_bytes());

        self.internal_remove_token_from_owner(&receiver_id, &token_id);
        self.internal_add_token_to_owner(&owner_id, &token_id);
        token.owner_id = owner_id;
        refund_approved_account_ids(receiver_id, &token.approved_account_ids);
        token.approved_account_ids = approved_account_ids;
        self.services_by_id.insert(&token_id, &token);

        false
    }
}

impl NonFungibleToken {
    pub fn new<Q, R, S, T>(
        owner_by_id_prefix: Q,
        owner_id: ValidAccountId,
        token_metadata_prefix: Option<R>,
        enumeration_prefix: Option<S>,
        approval_prefix: Option<T>,
    ) -> Self
    where
        Q: IntoStorageKey,
        R: IntoStorageKey,
        S: IntoStorageKey,
        T: IntoStorageKey,
    {
        let (approvals_by_id, next_approval_id_by_id) = if let Some(prefix) = approval_prefix {
            let prefix: Vec<u8> = prefix.into_storage_key();
            (
                Some(LookupMap::new(prefix.clone())),
                Some(LookupMap::new([prefix, "n".into()].concat())),
            )
        } else {
            (None, None)
        };

        let mut this = Self {
            owner_id: owner_id.into(),
            extra_storage_in_bytes_per_token: 0,
            owner_by_id: TreeMap::new(owner_by_id_prefix),
            token_metadata_by_id: token_metadata_prefix.map(LookupMap::new),
            services_by_account: enumeration_prefix.map(LookupMap::new),
            approvals_by_id,
            next_approval_id_by_id,
        };
        this
    }


    /// Transfer token_id from `from` to `to`
    ///
    /// Do not perform any safety checks or do any logging
    pub fn internal_transfer_unguarded(
        &mut self,
        token_id: &TokenId,
        from: &AccountId,
        to: &AccountId,
    ) {
        // update owner
        self.owner_by_id.insert(token_id, to);

        // if using Enumeration standard, update old & new owner's token lists
        if let Some(services_by_account) = &mut self.services_by_account {
            // owner_tokens should always exist, so call `unwrap` without guard
            let mut owner_tokens = services_by_account
                .get(from)
                .expect("Unable to access tokens per owner in unguarded call.");
            owner_tokens.remove(&token_id);
            if owner_tokens.is_empty() {
                services_by_account.remove(from);
            } else {
                services_by_account.insert(&from, &owner_tokens);
            }

            let mut receiver_tokens = services_by_account.get(to).unwrap_or_else(|| {
                UnorderedSet::new(StorageKey::TokensPerOwner {
                    account_hash: env::sha256(to.as_bytes()),
                })
            });
            receiver_tokens.insert(&token_id);
            services_by_account.insert(&to, &receiver_tokens);
        }
    }

    /// Transfer from current owner to receiver_id, checking that sender is allowed to transfer.
    /// Clear approvals, if approval extension being used.
    /// Return previous owner and approvals.
    pub fn internal_transfer(
        &mut self,
        sender_id: &AccountId,
        receiver_id: &AccountId,
        token_id: &TokenId,
        approval_id: Option<u64>,
        memo: Option<String>,
    ) -> (AccountId, Option<HashMap<AccountId, u64>>) {
        let owner_id = self.owner_by_id.get(token_id).expect("Token not found");

        // clear approvals, if using Approval Management extension
        // this will be rolled back by a panic if sending fails
        let approved_account_ids =
            self.approvals_by_id.as_mut().and_then(|by_id| by_id.remove(&token_id));

        // check if authorized
        if sender_id != &owner_id {
            // if approval extension is NOT being used, or if token has no approved accounts
            if approved_account_ids.is_none() {
                env::panic(b"Unauthorized")
            }

            // Approval extension is being used; get approval_id for sender.
            let actual_approval_id = approved_account_ids.as_ref().unwrap().get(sender_id);

            // Panic if sender not approved at all
            if actual_approval_id.is_none() {
                env::panic(b"Sender not approved");
            }

            // If approval_id included, check that it matches
            if let Some(enforced_approval_id) = approval_id {
                let actual_approval_id = actual_approval_id.unwrap();
                assert_eq!(
                    actual_approval_id, &enforced_approval_id,
                    "The actual approval_id {} is different from the given approval_id {}",
                    actual_approval_id, enforced_approval_id,
                );
            }
        }

        assert_ne!(&owner_id, receiver_id, "Current and next owner must differ");

        self.internal_transfer_unguarded(&token_id, &owner_id, &receiver_id);

        log!("Transfer {} from {} to {}", token_id, sender_id, receiver_id);
        if let Some(memo) = memo {
            log!("Memo: {}", memo);
        }

        // return previous owner & approvals
        (owner_id, approved_account_ids)
    }
}