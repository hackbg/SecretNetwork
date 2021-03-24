/// <reference types="node" />
import { SecretJSError } from "./error";
import { Log } from "./logs";
import { BroadcastMode, PostTxsResponse, RestClient } from "./restclient";
import { Coin, CosmosSdkTx, JsonObject, PubKey, StdTx } from "./types";
export interface GetNonceResult {
  readonly accountNumber: number;
  readonly sequence: number;
}
export interface Account {
  /** Bech32 account address */
  readonly address: string;
  readonly balance: ReadonlyArray<Coin>;
  readonly pubkey: PubKey | undefined;
  readonly accountNumber: number;
  readonly sequence: number;
}
export interface PostTxResult {
  readonly logs: readonly Log[];
  readonly rawLog: string;
  readonly data: any;
  /** Transaction hash (might be used as transaction ID). Guaranteed to be non-empty upper-case hex */
  readonly transactionHash: string;
}
export interface SearchByIdQuery {
  readonly id: string;
}
export interface SearchByHeightQuery {
  readonly height: number;
}
export interface SearchBySentFromOrToQuery {
  readonly sentFromOrTo: string;
}
/**
 * This query type allows you to pass arbitrary key/value pairs to the backend. It is
 * more powerful and slightly lower level than the other search options.
 */
export interface SearchByTagsQuery {
  readonly tags: readonly {
    readonly key: string;
    readonly value: string;
  }[];
}
export declare type SearchTxQuery =
  | SearchByIdQuery
  | SearchByHeightQuery
  | SearchBySentFromOrToQuery
  | SearchByTagsQuery;
export interface SearchTxFilter {
  readonly minHeight?: number;
  readonly maxHeight?: number;
}
export interface Code {
  readonly id: number;
  /** Bech32 account address */
  readonly creator: string;
  /** Hex-encoded sha256 hash of the code stored here */
  readonly checksum: string;
  readonly source?: string;
  readonly builder?: string;
}
export interface CodeDetails extends Code {
  /** The original wasm bytes */
  readonly data: Uint8Array;
}
export interface Contract {
  readonly address: string;
  readonly codeId: number;
  /** Bech32 account address */
  readonly creator: string;
  readonly label: string;
}
export interface ContractDetails extends Contract {
  /** Argument passed on initialization of the contract */
  readonly initMsg: object;
}
/** A transaction that is indexed as part of the transaction history */
export interface IndexedTx {
  readonly height: number;
  /** Transaction hash (might be used as transaction ID). Guaranteed to be non-empty upper-case hex */
  readonly hash: string;
  /** Transaction execution error code. 0 on success. */
  readonly code: number;
  readonly rawLog: string;
  readonly logs: readonly Log[];
  readonly tx: CosmosSdkTx;
  /** The gas limit as set by the user */
  readonly gasWanted?: number;
  /** The gas used by the execution */
  readonly gasUsed?: number;
  /** An RFC 3339 time string like e.g. '2020-02-15T10:39:10.4696305Z' */
  readonly timestamp: string;
}
export interface BlockHeader {
  readonly version: {
    readonly block: string;
    readonly app: string;
  };
  readonly height: number;
  readonly chainId: string;
  /** An RFC 3339 time string like e.g. '2020-02-15T10:39:10.4696305Z' */
  readonly time: string;
}
export interface Block {
  /** The ID is a hash of the block header (uppercase hex) */
  readonly id: string;
  readonly header: BlockHeader;
  /** Array of raw transactions */
  readonly txs: ReadonlyArray<Uint8Array>;
}
/** Use for testing only */
export interface PrivateCosmWasmClient {
  readonly restClient: RestClient;
}
export declare class CosmWasmClientError extends SecretJSError {}
export declare const CosmWasmClientErrors: {
  ChainIDEmpty: {
    new (): {
      name: string;
      message: string;
      stack?: string | undefined;
    };
    captureStackTrace(targetObject: object, constructorOpt?: Function | undefined): void;
    prepareStackTrace?: ((err: Error, stackTraces: NodeJS.CallSite[]) => any) | undefined;
    stackTraceLimit: number;
  };
  AccountDoesNotExist: {
    new (address: string): {
      name: string;
      message: string;
      stack?: string | undefined;
    };
    captureStackTrace(targetObject: object, constructorOpt?: Function | undefined): void;
    prepareStackTrace?: ((err: Error, stackTraces: NodeJS.CallSite[]) => any) | undefined;
    stackTraceLimit: number;
  };
  UnknownQueryType: {
    new (): {
      name: string;
      message: string;
      stack?: string | undefined;
    };
    captureStackTrace(targetObject: object, constructorOpt?: Function | undefined): void;
    prepareStackTrace?: ((err: Error, stackTraces: NodeJS.CallSite[]) => any) | undefined;
    stackTraceLimit: number;
  };
  IllFormattedTXHash: {
    new (txhash: string): {
      name: string;
      message: string;
      stack?: string | undefined;
    };
    captureStackTrace(targetObject: object, constructorOpt?: Function | undefined): void;
    prepareStackTrace?: ((err: Error, stackTraces: NodeJS.CallSite[]) => any) | undefined;
    stackTraceLimit: number;
  };
  PostTXError: {
    new (tx: StdTx, response: PostTxsResponse): {
      decrypt(decryptor: import("./enigmautils").SecretUtils, nonce: Uint8Array): Promise<string>;
      name: string;
      message: string;
      stack?: string | undefined;
    };
    MessageNotFound: {
      new (otherMessage: string, otherError?: Error | undefined): {
        name: string;
        message: string;
        stack?: string | undefined;
      };
      captureStackTrace(targetObject: object, constructorOpt?: Function | undefined): void;
      prepareStackTrace?: ((err: Error, stackTraces: NodeJS.CallSite[]) => any) | undefined;
      stackTraceLimit: number;
    };
    FailedToDecrypt: {
      new (encrypted: string, decryptionError: Error): {
        name: string;
        message: string;
        stack?: string | undefined;
      };
      captureStackTrace(targetObject: object, constructorOpt?: Function | undefined): void;
      prepareStackTrace?: ((err: Error, stackTraces: NodeJS.CallSite[]) => any) | undefined;
      stackTraceLimit: number;
    };
    captureStackTrace(targetObject: object, constructorOpt?: Function | undefined): void;
    prepareStackTrace?: ((err: Error, stackTraces: NodeJS.CallSite[]) => any) | undefined;
    stackTraceLimit: number;
  };
  NoContractFound: {
    new (address: string): {
      name: string;
      message: string;
      stack?: string | undefined;
    };
    captureStackTrace(targetObject: object, constructorOpt?: Function | undefined): void;
    prepareStackTrace?: ((err: Error, stackTraces: NodeJS.CallSite[]) => any) | undefined;
    stackTraceLimit: number;
  };
  TooManyResults: {
    new (total: string, limit: number): {
      name: string;
      message: string;
      stack?: string | undefined;
    };
    captureStackTrace(targetObject: object, constructorOpt?: Function | undefined): void;
    prepareStackTrace?: ((err: Error, stackTraces: NodeJS.CallSite[]) => any) | undefined;
    stackTraceLimit: number;
  };
};
export declare class CosmWasmClient {
  protected readonly restClient: RestClient;
  /** Any address the chain considers valid (valid bech32 with proper prefix) */
  protected anyValidAddress: string | undefined;
  private readonly codesCache;
  private chainId;
  /**
   * Creates a new client to interact with a CosmWasm blockchain.
   *
   * This instance does a lot of caching. In order to benefit from that you should try to use one instance
   * for the lifetime of your application. When switching backends, a new instance must be created.
   *
   * @param apiUrl The URL of a Cosmos SDK light client daemon API (sometimes called REST server or REST API)
   * @param broadcastMode Defines at which point of the transaction processing the postTx method (i.e. transaction broadcasting) returns
   */
  constructor(apiUrl: string, seed?: Uint8Array, broadcastMode?: BroadcastMode);
  getChainId(): Promise<string>;
  getHeight(): Promise<number>;
  /**
   * Returns a 32 byte upper-case hex transaction hash (typically used as the transaction ID)
   */
  getIdentifier(tx: CosmosSdkTx): Promise<string>;
  /**
   * Returns account number and sequence.
   *
   * Throws if the account does not exist on chain.
   *
   * @param address returns data for this address. When unset, the client's sender adddress is used.
   */
  getNonce(address: string): Promise<GetNonceResult>;
  getAccount(address: string): Promise<Account | undefined>;
  /**
   * Gets block header and meta
   *
   * @param height The height of the block. If undefined, the latest height is used.
   */
  getBlock(height?: number): Promise<Block>;
  searchTx(query: SearchTxQuery, filter?: SearchTxFilter): Promise<readonly IndexedTx[]>;
  postTx(tx: StdTx, nonce?: Uint8Array): Promise<PostTxResult>;
  getCodes(): Promise<readonly Code[]>;
  getCodeDetails(codeId: number): Promise<CodeDetails>;
  getContracts(codeId: number): Promise<readonly Contract[]>;
  /**
   * Throws an error if no contract was found at the address
   */
  getContract(address: string): Promise<ContractDetails>;
  /**
   * Returns the data at the key if present (raw contract dependent storage data)
   * or null if no data at this key.
   *
   * Promise is rejected when contract does not exist.
   */
  queryContractRaw(address: string, key: Uint8Array): Promise<Uint8Array | null>;
  /**
   * Makes a smart query on the contract, returns the parsed JSON document.
   *
   * Promise is rejected when contract does not exist.
   * Promise is rejected for invalid query format.
   * Promise is rejected for invalid response format.
   */
  queryContractSmart(address: string, queryMsg: object): Promise<JsonObject>;
  private txsQuery;
  getCodeHashByCodeId(id: number): Promise<string>;
  getCodeHashByContractAddr(addr: string): Promise<string>;
}
