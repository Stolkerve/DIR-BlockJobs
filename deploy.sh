#!/bin/bash

# compilar el contrato y desplogarlo a la testnet
echo "Compilando el contrato y desplegandolo a la testnet"

cd contract
./build.sh

cd marketplace

echo "Deployando el contrato de marketplace"
near dev-deploy ../out/marketplace.wasm
echo "Exportanto la cuenta del contrato marketplace en MA_ID"
source neardev/dev-account.env
export MA_ID=$CONTRACT_NAME

cd ../mediator

echo "Deployando el contrato de mediator"
near dev-deploy ../out/mediator.wasm
echo "Exportanto la cuenta del contrato mediador en ME_ID"
source neardev/dev-account.env
export ME_ID=$CONTRACT_NAME

cd ../ft

echo "Deployando el contrato del token"
near dev-deploy ../out/ft.wasm
echo "Exportanto la cuenta del contrato mediador en FT_ID"
source neardev/dev-account.env
export FT_ID=$CONTRACT_NAME

cd ../../

echo "Exportando dariofs.testnet a la variable ID"
ID=dariofs.testnet
echo "Exportando proofs333.testnet a la variable ID2"
ID2=proofs333.testnet
# echo "Exportando stolkerve.testnet a la variable ID"
# ID=stolkerve.testnet
# echo "Exportando stolkerve2.testnet a la variable ID2"
# ID2=stolkerve2.testnet

echo "inicializando el contrato de FT"
near call $FT_ID new_default_meta '{"owner_id": "'$FT_ID'", "initial_supply": "100000"}' --accountId $FT_ID

echo "inicializando el contrato de Marketplace"
near call $MA_ID new '{"owner_id": "'$MA_ID'", "mediator": "'$ME_ID'", "ft": "'$FT_ID'"}' --accountId $MA_ID --amount 0.03

echo "inicializando el contrato Mediator"
near call $ME_ID new '{"marketplace_contract": "'$MA_ID'"}' --accountId $ME_ID

echo "Creando usuarios y servicios"
near call $MA_ID add_user '{"roles": ["Professional"], "categories": "hola"}' --accountId $ID --amount 0.03
near call $MA_ID add_user '{"roles": ["Employeer"], "categories": "hola"}' --accountId $ID2 --amount 0.03
near call $MA_ID mint_service '{"metadata": {"title": "Desarrollo web", "description": "Trabajo part-time con React", "icon": "foto.png", "price": 1}, "quantity": 3, "duration": 30}' --accountId $ID --amount 0.029
near call $MA_ID buy_service '{"service_id": 0}' --accountId $ID2 --amount 1 --gas 300000000000000
