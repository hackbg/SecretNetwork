/// This contains all the user-facing functions. In these functions we will be using
/// the consensus_io_exchange_keypair and a user-generated key to create a symmetric key
/// that is unique to the user and the enclave
///
use super::types::{IoNonce, SecretMessage};

use crate::cosmwasm::encoding::Binary;
use crate::cosmwasm::types::{CosmosMsg, WasmMsg};
use crate::crypto::{AESKey, Ed25519PublicKey, Kdf, SIVEncryptable, KEY_MANAGER};
use enclave_ffi_types::EnclaveError;
use log::*;
use serde::Serialize;
use serde_json::{json, Value};
use std::io::Read;

pub fn calc_encryption_key(nonce: &IoNonce, user_public_key: &Ed25519PublicKey) -> AESKey {
    let enclave_io_key = KEY_MANAGER.get_consensus_io_exchange_keypair().unwrap();

    let tx_encryption_ikm = enclave_io_key.diffie_hellman(user_public_key);

    let tx_encryption_key = AESKey::new_from_slice(&tx_encryption_ikm).derive_key_from_this(nonce);

    debug!("rust tx_encryption_key {:?}", tx_encryption_key.get());

    tx_encryption_key
}

fn encrypt_serializeable<T>(key: &AESKey, val: &T) -> Result<Value, EnclaveError>
where
    T: ?Sized + Serialize,
{
    let serialized: String = serde_json::to_string(val).map_err(|err| {
        error!(
            "got an error while trying to encrypt output error {:?}: {}",
            err, err
        );
        EnclaveError::EncryptionError
    })?;

    // todo: think about if we should just move this function to handle only serde_json::Value::Strings
    // instead of removing the extra quotes like this
    let trimmed = serialized.trim_start_matches('"').trim_end_matches('"');

    let encrypted_data = key.encrypt_siv(trimmed.as_bytes(), None).map_err(|err| {
        error!(
            "got an error while trying to encrypt output error {:?}: {}",
            err, err
        );
        EnclaveError::EncryptionError
    })?;

    Ok(encode(encrypted_data.as_slice()))
}

fn encode(data: &[u8]) -> Value {
    Value::String(base64::encode(data))
}

pub fn encrypt_output(
    output: Vec<u8>,
    nonce: IoNonce,
    user_public_key: Ed25519PublicKey,
) -> Result<Vec<u8>, EnclaveError> {
    let key = calc_encryption_key(&nonce, &user_public_key);

    debug!(
        "Output before encryption: {:?}",
        String::from_utf8_lossy(&output)
    );

    // Because output is conditionally in totally different structures without useful methods
    // I'm not sure there's a better way to parse this (I mean, there probably is, but whatever)
    let mut v: Value = serde_json::from_slice(&output).map_err(|err| {
        error!(
            "got an error while trying to deserialize output bytes into json {:?}: {}",
            output, err
        );
        EnclaveError::FailedToDeserialize
    })?;

    if v["Err"].is_object() {
        if let Value::Object(err) = &mut v["Err"] {
            let mut new_value: Value = json!({"generic_err":{"msg":""}});
            new_value["generic_err"]["msg"] = encrypt_serializeable(&key, &err)?;
            v["Err"] = new_value;
        }
    } else if v["Ok"].is_string() {
        // query
        if let Value::String(ok) = &v["Ok"] {
            v["Ok"] = encrypt_serializeable(&key, &ok)?;
        }
    } else if v["Ok"].is_object() {
        // init or handle or migrate
        if let Value::Object(ok) = &mut v["Ok"] {
            if ok["messages"].is_array() {
                let mut new_msgs: Vec<CosmosMsg> = vec![];

                let msgs: Vec<CosmosMsg> =
                    serde_json::from_value(ok["messages"].clone()).map_err(|err| {
                        error!(
                            "got an error while trying to deserialize messages {:?}: {}",
                            ok["messages"], err
                        );
                        EnclaveError::FailedToDeserialize
                    })?;

                for msg in msgs {
                    let mut new_msg: CosmosMsg = msg.clone();

                    match msg {
                        CosmosMsg::Wasm(wasm_msg) => match wasm_msg {
                            WasmMsg::Execute {
                                contract_addr,
                                code_hash,
                                msg,
                                send,
                            } => {
                                let mut hash_appended_msg = code_hash.as_bytes().to_vec();
                                hash_appended_msg.extend_from_slice(&msg.0);

                                let mut msg_to_pass = SecretMessage::from_base64(
                                    Binary(hash_appended_msg).to_base64(),
                                    nonce,
                                    user_public_key,
                                )?;
                                msg_to_pass.encrypt_in_place()?;

                                let encoded_msg = Binary::from(msg_to_pass.to_vec().as_slice());

                                new_msg = CosmosMsg::Wasm(WasmMsg::Execute {
                                    contract_addr,
                                    code_hash,
                                    msg: encoded_msg,
                                    send,
                                });
                            }
                            WasmMsg::Instantiate {
                                code_id,
                                msg,
                                code_hash,
                                send,
                                label,
                            } => {
                                let mut hash_appended_msg = code_hash.as_bytes().to_vec();
                                hash_appended_msg.extend_from_slice(&msg.0);

                                let mut msg_to_pass = SecretMessage::from_base64(
                                    Binary(hash_appended_msg).to_base64(),
                                    nonce,
                                    user_public_key,
                                )?;
                                msg_to_pass.encrypt_in_place()?;

                                let encoded_msg = Binary::from(msg_to_pass.to_vec().as_slice());

                                new_msg = CosmosMsg::Wasm(WasmMsg::Instantiate {
                                    code_id,
                                    code_hash,
                                    msg: encoded_msg,
                                    send,
                                    label,
                                });
                            }
                        },
                        _ => {}
                    }

                    new_msgs.push(new_msg);
                }

                ok["messages"] = serde_json::to_value(new_msgs).map_err(|err| {
                    error!("got an error while trying to serialize messages: {}", err);
                    EnclaveError::FailedToSerialize
                })?;
            }

            if ok["log"].is_array() {
                if let Value::Array(events) = &mut ok["log"] {
                    for e in events {
                        if e["key"].is_string() {
                            if let Value::String(k) = &mut e["key"] {
                                e["key"] = encrypt_serializeable(&key, k)?;
                            }
                        }
                        if e["value"].is_string() {
                            if let Value::String(v) = &mut e["value"] {
                                e["value"] = encrypt_serializeable(&key, v)?;
                            }
                        }
                    }
                }
            }

            if v["Ok"]["data"].is_string() {
                if let Value::String(data) = &mut v["Ok"]["data"] {
                    v["Ok"]["data"] = encrypt_serializeable(&key, data)?;
                }
            }
        }
    }

    let output = serde_json::ser::to_vec(&v).map_err(|err| {
        error!(
            "got an error while trying to serialize output json into bytes {:?}: {}",
            v, err
        );
        EnclaveError::FailedToSerialize
    })?;

    debug!(
        "Output after encryption: {:?}",
        String::from_utf8_lossy(&output)
    );

    Ok(output)
}
