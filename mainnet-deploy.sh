set -e
NETWORK=mainnet
export NODE_ENV=$NETWORK

OWNER=blockjobs.near
MARKETPLACE=market.blockjobs.near
MEDIATOR=mediator.blockjobs.near
TOKEN=ft.blockjobs.near
SALES=sales.blockjobs.near
ADMIN_ACC=admin1.blockjobs.near
TREASURY_ACC=blockjobs.near


# near create-account $ADMIN_ACC --masterAccount $MASTER_ACC --accountId $OWNER --initialBalance 0.5
# near create-account $TREASURY_ACC --masterAccount $MASTER_ACC --accountId $OWNER --initialBalance 0.5

set -ex
near deploy $MARKETPLACE ./res/blockjobs.wasm
#   --initFunction "new" \
#   --initArgs "{\"owner_account_id\":\"$OWNER\",\"treasury_account_id\":\"$TREASURY_ACC\",\"ADMIN_account_id\":\"$ADMIN_ACC\",\"meta_token_account_id\":\"$GOV_TOKEN\"}" \
#   --accountId $OWNER


# compilar el contrato y desplogarlo a la testnet
echo "Compilando el contrato y desplegandolo a la testnet"

cd contract
./build.sh

cd marketplace

echo "Deployando el contrato de marketplace"
near dev-deploy ../out/marketplace.wasm
echo "Exportanto la cuenta del contrato marketplace en MA"
source neardev/dev-account.env
export MA=$CONTRACT_NAME

cd ../mediator

echo "Deployando el contrato de mediator"
near dev-deploy ../out/mediator.wasm
echo "Exportanto la cuenta del contrato mediador en ME"
source neardev/dev-account.env
export ME=$CONTRACT_NAME

cd ../ft

echo "Deployando el contrato del token"
near dev-deploy ../out/ft.wasm
echo "Exportanto la cuenta del contrato mediador en FT"
source neardev/dev-account.env
export FT=$CONTRACT_NAME

cd ../sales

echo "Deployando el contrato de ventas y airdrop"
near dev-deploy ../out/sales.wasm
echo "Exportanto la cuenta del contrato mediador en SA"
source neardev/dev-account.env
export SA=$CONTRACT_NAME

cd ../../

# echo "Exportando dariofs.testnet a la variable ID"
# ID=dariofs.testnet
# echo "Exportando proofs333.testnet a la variable ID2"
# ID2=proofs333.testnet

echo "inicializando el contrato de FT"
near call $FT new_default_meta '{"owner_id": "'$FT'", "initial_supply": "1000000000", "sales_contract": "'$FT'"}' --accountId $FT

echo "inicializando el contrato de Marketplace"
near call $MA new '{"owner_id": "'$MA'", "mediator": "'$ME'", "ft": "'$FT'", "usdc": "a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.factory.bridge.near"}' --accountId $MA --amount 0.03

echo "inicializando el contrato Mediator"
near call $ME new '{"marketplace_id": "'$MA'", "token_id": "'$FT'"}' --accountId $ME

echo "inicializando el contrato Sales"
near call $SA new '{"ft_address": "'$FT'", "admin_id": "'$SA'"}' --accountId $SA

# echo "Estableciendo a Mediator como Minter"
# near call $FT update_minter '{"account": "'$ME'"}' --accountId $FT

echo "Añadiendo FT"
near call $MA add_token '{"token": "'$FT'"}' --accountId $MA
near call $MA add_token '{"token": "a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.factory.bridge.near"}' --accountId $MA


#save this deployment  (to be able to recover state/tokens)
set -ex
cp ./res/blockjobs.wasm ./res/mainnet/blockjobs.$CONTRACT_ACC.`date +%F.%T`.wasm
date +%F.%T



#meta --cliconf -c $CONTRACT_ACC -acc $OWNER
