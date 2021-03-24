import { Encoding } from "@iov/encoding";

import { SecretUtils } from "./enigmautils";

export class SecretJSError extends Error {
  constructor(
    message: string, // message is enumerable/serializable
    data: object = {}, // custom data can be added
  ) {
    super(message);
    Object.defineProperty(this, "message", { enumerable: true, writable: true, value: message });
    Object.assign(this, { name: this.constructor.name }, data);
  }
}

const RE_ERR = /contract failed: encrypted: (.+?): failed to execute message; message index: 0/;

export function containsEncryptedErrorMessage(message: string): boolean {
  return RE_ERR.test(message);
}

export function extractEncryptedErrorMessage(message: string, error?: Error): string {
  const rgxMatches = RE_ERR.exec(message);
  if (Array.isArray(rgxMatches) && rgxMatches.length === 2) {
    return rgxMatches[1]; // errorCipherB64
  } else {
    throw new EncryptedSecretJSError.MessageNotFound(message, error);
  }
}

export async function decryptB64asUTF8(
  decryptor: SecretUtils,
  encrypted: string,
  nonce: Uint8Array
): Promise<string> {
  return Encoding.fromUtf8(await decryptor.decrypt(Encoding.fromBase64(encrypted), nonce));
}

export async function decryptErrorMessage(
  decryptor: SecretUtils,
  encrypted: string,
  nonce: Uint8Array,
): Promise<string> {
  try {
    return await decryptB64asUTF8(decryptor, encrypted, nonce);
  } catch (decryptionError) {
    throw new EncryptedSecretJSError.FailedToDecrypt(encrypted, decryptionError);
  }
}

export class EncryptedSecretJSError extends SecretJSError {
  async decrypt(decryptor: SecretUtils, nonce: Uint8Array): Promise<string> {
    const encrypted = extractEncryptedErrorMessage(this.message, this);
    const decrypted = await decryptErrorMessage(decryptor, encrypted, nonce);
    this.message.replace(encrypted, decrypted);
    Object.assign(this, { log: decrypted });
    return decrypted;
  }

  static MessageNotFound = class EncryptedMessageNotFound extends SecretJSError {
    constructor(otherMessage: string, otherError?: Error) {
      super(`Failed to extract an encrypted error from the following message:\n  ` + otherMessage, {
        otherError,
      });
    }
  };

  static FailedToDecrypt = class FailedToDecryptMessage extends SecretJSError {
    constructor(encrypted: string, decryptionError: Error) {
      super(
        `Failed to decrypt the following error message:\n  ${encrypted}\n` +
          `Decryption error:\n  ${decryptionError.message}`,
        { encrypted, decryptionError },
      );
    }
  };
}
