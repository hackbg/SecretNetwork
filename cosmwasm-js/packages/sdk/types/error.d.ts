/// <reference types="node" />
import { SecretUtils } from "./enigmautils";
export declare class SecretJSError extends Error {
  constructor(
    message: string, // message is enumerable/serializable
    data?: object,
  );
}
export declare function containsEncryptedErrorMessage(message: string): boolean;
export declare function extractEncryptedErrorMessage(message: string): string;
export declare function decryptB64asUTF8(
  decryptor: SecretUtils,
  encrypted: string,
  nonce: Uint8Array,
): Promise<string>;
export declare function decryptErrorMessage(
  decryptor: SecretUtils,
  encrypted: string,
  nonce: Uint8Array,
): Promise<string>;
export declare class EncryptedSecretJSError extends SecretJSError {
  decrypt(decryptor: SecretUtils, nonce: Uint8Array): Promise<string>;
  static MessageNotFound: {
    new (otherMessage: string): {
      name: string;
      message: string;
      stack?: string | undefined;
    };
    captureStackTrace(targetObject: object, constructorOpt?: Function | undefined): void;
    prepareStackTrace?: ((err: Error, stackTraces: NodeJS.CallSite[]) => any) | undefined;
    stackTraceLimit: number;
  };
  static FailedToDecrypt: {
    new (encrypted: string, decryptionError: Error): {
      name: string;
      message: string;
      stack?: string | undefined;
    };
    captureStackTrace(targetObject: object, constructorOpt?: Function | undefined): void;
    prepareStackTrace?: ((err: Error, stackTraces: NodeJS.CallSite[]) => any) | undefined;
    stackTraceLimit: number;
  };
}
