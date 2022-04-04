#!/bin/bash

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

echo "Exportando dariofs.testnet a la variable ID"
ID=dariofs.testnet
echo "Exportando proofs333.testnet a la variable ID2"
ID2=proofs333.testnet

# echo "Exportando stolkerve.testnet a la variable ID"
# ID=stolkerve.testnet
# echo "Exportando stolkerve2.testnet a la variable ID2"
# ID2=stolkerve2.testnet

echo "inicializando el contrato de FT"
near call $FT new_default_meta '{"owner_id": "'$FT'", "initial_supply": "1000000000", "sales_contract": "'$SA'"}' --accountId $FT

echo "inicializando el contrato de Marketplace"
near call $MA new '{"owner_id": "'$MA'", "mediator": "'$ME'", "ft": "'$FT'", "usdc": "usdc.fakes.testnet"}' --accountId $MA --amount 0.03

echo "inicializando el contrato Mediator"
near call $ME new '{"marketplace_id": "'$MA'", "token_id": "'$FT'"}' --accountId $ME

echo "inicializando el contrato Sales"
near call $SA new '{"ft_address": "'$FT'", "admin_id": "'$SA'"}' --accountId $SA

# echo "Estableciendo a Mediator como Minter"
# near call $FT update_minter '{"account": "'$ME'"}' --accountId $FT

echo "Añadiendo FT"
near call $MA add_token '{"token": "'$FT'"}' --accountId $MA
near call $MA add_token '{"token": "usdc.fakes.testnet"}' --accountId $MA

# echo "Creando usuarios y servicios"
near call $MA add_user '{"roles": ["Professional"], "personal_data": "{\"legal_name\": \"Pepe Ramos\", \"education\": \"I am a smart contract, I dont need school\", \"email\": \"ramos@gmail.com\", \"links\": [], \"bio\": \"I live inside of a smart contract in the NEAR protocol\", \"picture\": \"foto.jpg\", \"country\": \"NEARland\", \"idioms\": [{\"idiom\": \"Spain\", \"level\": \"native\"}, {\"idiom\": \"English\", \"level\": \"medium\"}]}"}' --accountId $ID --amount 0.03
near call $MA add_user '{"roles": ["Employeer"], "personal_data": "{\"legal_name\": \"Mariano Ochoa\", \"education\": \"Im autodidactic\", \"email\": \"mariano@gmail.com\", \"links\": [\"marian.medium.com\"], \"bio\": \"I program in NEAR protocol\", \"picture\": \"foto.jpg\", \"country\": \"NEARland\", \"idioms\": [{\"idiom\": \"Spain\", \"level\": \"native\"}, {\"idiom\": \"English\", \"level\": \"medium\"}]}"}' --accountId $ID2 --amount 0.03
near view $MA get_user '{"account_id": "'$ID2'"}' --accountId $MA

near call $MA mint_service '{"metadata": {"title": "Near App NEAR", "description": "Trabajo part-time con Rust", "icon": "foto.png", "price": 1, "categories": "[\"Blockchain\"]", "token": "near"}, "quantity": 2, "duration": 1}' --accountId $ID --amount 0.029
near call $MA mint_service '{"metadata": {"title": "Near App USDC", "description": "Trabajo part-time con Rust", "icon": "foto.png", "price": 1, "categories": "[\"Blockchain\"]", "token": "usdc.fakes.testnet"}, "quantity": 2, "duration": 1}' --accountId $ID --amount 0.029
near call $MA mint_service '{"metadata": {"title": "Near App JOBS", "description": "Trabajo part-time con Rust", "icon": "foto.png", "price": 2, "categories": "[\"Blockchain\"]", "token": "'$FT'"}, "quantity": 2, "duration": 1}' --accountId $ID --amount 0.029

near call $MA buy_service '{"service_id": 1}' --accountId $ID2 --amount 1 --gas 10000000000000
near call $MA reclaim_dispute '{"service_id": 1, "proves": "none"}' --accountId $ID2 --amount 0.1 --gas 100000000000000

near call usdc.fakes.testnet storage_deposit '{"registration_only": true, "account_id": "'$MA'"}' --accountId $MA --depositYocto 1000000000000000000000000 --gas 10000000000000
near call $FT transfer_ft '{"to": "'$ID2'", "amount": "100000000000000000000"}' --accountId $FT
near view $FT get_balance_of '{"account": "'$ID2'"}' --accountId $FT


# near call $FT ft_transfer '{"receiver_id": "'$ID2'", "amount": "10000000000000000000000"}' --accountId $FT --depositYocto 1
near call $FT transfer_ft '{"to": "'$MA'", "amount": "1000000000000000000"}' --accountId $FT
near call $FT ft_transfer_call '{"receiver_id": "'$MA'", "amount": "80000000000000000000", "msg": "empty"}' --accountId $ID2 --depositYocto 1 --gas 100000000000000

# near call $FT transfer_ft '{"to": "'$ME'", "amount": "1000000000000000000"}' --accountId $FT
# near call $FT transfer_ft '{"to": "'$SA'", "amount": "1000000000000000000"}' --accountId $FT
# near call $SA buy_ft '{}' --accountId $ID --amount 1 --gas 260000000000000

# near call $MA buy_service '{"service_id": 0}' --accountId $ID2 --depositYocto 1 --gas 300000000000000
                                                                                    
# near call $FT block_tokens '{"amount": 10000}' --accountId $ME --depositYocto 1
# near call $FT block_tokens '{"amount": 10000}' --accountId $MA --depositYocto 1

# near call $ME pre_vote '{"dispute_id": 0}' --accountId $MA --gas 300000000000000
# near call $ME pre_vote '{"dispute_id": 0}' --accountId $ME --gas 300000000000000
                                                                                 
# near call $ME vote '{"dispute_id": 0, "vote": true}' --accountId $ME --gas 300000000000000                                                                                    
# near call $ME vote '{"dispute_id": 0, "vote": true}' --accountId $MA --gas 300000000000000

# near call $ME change_dispute_status '{"dispute_id": 0}' --accountId $ME --gas 30000000000000
# near call $ME update_dispute_status '{"dispute_id": 0}' --accountId $ME --gas 300000000000000


# 000000000000000000
