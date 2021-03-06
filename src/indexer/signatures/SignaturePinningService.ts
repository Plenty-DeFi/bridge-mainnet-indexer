import { Logger } from 'tslog';
import Knex from 'knex';
import { IpfsClient } from '../../infrastructure/ipfsClient';
import { AppState } from '../state/AppState';
import { TezosSigner } from '../../domain/TezosSigner';
import { TezosQuorumRepository } from '../../repository/TezosQuorumRepository';
import { Dependencies } from '../../bootstrap';

export class SignaturePinningService {
  constructor({ logger, ipfsClient, dbClient }: Dependencies) {
    this._logger = logger;
    this._ipfsClient = ipfsClient;
    this._dbClient = dbClient;
    this._appState = new AppState(this._dbClient);
  }

  async index(): Promise<void> {
    this._logger.debug(`Pinning signatures`);
    const signers = await new TezosQuorumRepository(
      this._dbClient
    ).getActiveSigners();
    for (const signer of signers) {
      this._logger.debug(`Pinning signatures of ${signer.ipnsKey}`);
      try {
        await this._pinSignatureOf(signer);
      } catch (e) {
        this._logger.error(
          `Can't pin signatures of ${signer.ipnsKey} ${e.message}`
        );
      }
    }
  }

  private async _pinSignatureOf(signer: TezosSigner): Promise<void> {
    const cid = await this._appState.getLastIndexedSignature(signer.ipnsKey);
    if (cid != null) {
      await this._ipfsClient.pin.add(cid);
    }
  }

  private _logger: Logger;
  private _ipfsClient: IpfsClient;
  private _dbClient: Knex;
  private _appState: AppState;
}
