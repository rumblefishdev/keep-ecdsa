#!/bin/sh
set -e

LOG_LEVEL="debug"

OPERATOR_DATA_DIR="/data"
OPERATOR_CONFIG_FILE="/config.toml"
OPERATOR_KEYFILE_PATH="/keyfile"

TMP_FOLDER="/tmp/tbtc"
TMP_KEYFILE_KEY_PATH="$TMP_FOLDER/tmp_key_keyfile"
TMP_KEYFILE_PASSWORD_PATH="$TMP_FOLDER/tmp_password_keyfile"
TMP_GETH_DATADIR="$TMP_FOLDER/gethdata"

function set_config_string() {
    sed -i "s/\(${1//\//\\/} *= *\).*/\1\"${2//\//\\/}\"/" $3
}

function set_config_object() {
    sed -i "s/\(${1//\//\\/} *= *\).*/\1${2//\//\\/}/" $3
}

if [[ ! -d "$OPERATOR_DATA_DIR" ]]; then
    echo "Persistent data dir at:$OPERATOR_DATA_DIR not mounted."
    exit 1
fi

if [[ -z "${RSK_NODE_URL}" ]]; then
    echo "RSK_NODE_URL env not set."
    exit 1
fi

if [[ -z "${RSK_NODE_PORT}" ]]; then
    echo "RSK_NODE_PORT env not set."
    exit 1
fi

if [[ -z "${P2P_PORT}" ]]; then
    echo "P2P_PORT env not set."
    exit 1
fi

if [[ -z "${P2P_PEERS_ARRAY}" ]]; then
    echo "P2P_PEERS_ARRAY env not set. Defaulting to empty."
    P2P_PEERS_ARRAY="[]"
fi


if [[ -z "${OPERATOR_KEY}" ]]; then
    echo "OPERATOR_KEY env not set. Fetching from AWS Secrets Manager..."
    AWS_INSTANCE_ID=$(curl --silent http://169.254.169.254/latest/meta-data/instance-id)
    AWS_REGION=$(curl --silent http://169.254.169.254/latest/dynamic/instance-identity/document | jq -r .region)
    OPERATOR_KEY_NAME=`aws ec2 describe-instances --filters Name=instance-id,Values=$AWS_INSTANCE_ID --query "Reservations[].Instances[].Tags[?Key == 'Name'].Value" --output text`
    OPERATOR_KEY=`aws secretsmanager get-secret-value --secret-id $OPERATOR_KEY_NAME --region $AWS_REGION | jq -r .SecretString`
fi

mkdir $TMP_FOLDER $TMP_GETH_DATADIR

echo $OPERATOR_KEY >> $TMP_KEYFILE_KEY_PATH
if [[ -z "${OPERATOR_KEYFILE_PASSWORD}" ]]; then
    OPERATOR_KEYFILE_PASSWORD=$(echo $OPERATOR_KEY | sha256sum | head -c 64)
fi
OPERATOR_KEY=""

echo $OPERATOR_KEYFILE_PASSWORD >> $TMP_KEYFILE_PASSWORD_PATH

geth account import $TMP_KEYFILE_KEY_PATH --password $TMP_KEYFILE_PASSWORD_PATH --datadir $TMP_GETH_DATADIR

GETH_ACCOUNT_INFO=$(geth account list --datadir $TMP_GETH_DATADIR | head -n 1)
OPERATOR_ADDRESS=0x$(echo $GETH_ACCOUNT_INFO | sed 's/.*{\([^]]*\)}.*/\1/')
TMP_GETH_KEYFILEPATH=$(echo $GETH_ACCOUNT_INFO | sed -n 's/^.*keystore:\/\///p')

cp $TMP_GETH_KEYFILEPATH $OPERATOR_KEYFILE_PATH

rm -rf $TMP_FOLDER

set_config_string "Address" $OPERATOR_ADDRESS $OPERATOR_CONFIG_FILE
set_config_string "KeyFile" $OPERATOR_KEYFILE_PATH $OPERATOR_CONFIG_FILE

set_config_string "DataDir" $OPERATOR_DATA_DIR $OPERATOR_CONFIG_FILE

set_config_object "Port" $P2P_PORT $OPERATOR_CONFIG_FILE
set_config_object "Peers" $P2P_PEERS_ARRAY $OPERATOR_CONFIG_FILE

cd proxy
TARGET_URL=$RSK_NODE_URL \
TARGET_PORT=$RSK_NODE_PORT \
PROXY_PORT=5050 \
HTTP_MODE=0 \
MATCH_REQUESTS=0 \
MUTE_LOGGING=0 \
pm2 start eth.js --name eth-rsk-proxy
cd ..

PM2_PUBLIC_KEY=$PM2_PUBLIC_KEY PM2_PRIVATE_KEY=$PM2_PRIVATE_KEY KEEP_ETHEREUM_PASSWORD=$OPERATOR_KEYFILE_PASSWORD LOG_LEVEL=$LOG_LEVEL keep-app --config $OPERATOR_CONFIG_FILE start