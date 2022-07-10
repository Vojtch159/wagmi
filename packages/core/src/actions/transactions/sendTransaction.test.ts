import { BigNumber } from 'ethers/lib/ethers'
import { parseEther } from 'ethers/lib/utils'

import { getSigners, setupClient } from '../../../test'
import { Client } from '../../client'
import { connect } from '../accounts'
import { prepareSendTransaction } from './prepareSendTransaction'
import { sendTransaction } from './sendTransaction'

describe('sendTransaction', () => {
  let client: Client
  beforeEach(() => {
    client = setupClient()
  })

  describe('args', () => {
    it('"prepared" request', async () => {
      await connect({ connector: client.connectors[0]! })

      const signers = getSigners()
      const to = signers[1]
      const toAddress = await to?.getAddress()

      const request = await prepareSendTransaction({
        request: {
          to: toAddress as string,
          value: parseEther('10'),
        },
      })
      const { blockNumber, hash, gasLimit, gasPrice } = await sendTransaction({
        request,
      })
      expect(blockNumber).toBeDefined()
      expect(hash).toBeDefined()
      expect(gasPrice).toBeDefined()
      expect(gasLimit).toMatchInlineSnapshot(`
        {
          "hex": "0x5209",
          "type": "BigNumber",
        }
      `)
    })

    it('"dangerously prepared" request', async () => {
      await connect({ connector: client.connectors[0]! })

      const signers = getSigners()
      const to = signers[1]
      const toAddress = await to?.getAddress()

      const { blockNumber, hash, gasLimit, gasPrice } = await sendTransaction({
        dangerouslyPrepared: true,
        request: {
          to: toAddress as string,
          value: parseEther('10'),
        },
      })
      expect(blockNumber).toBeDefined()
      expect(hash).toBeDefined()
      expect(gasPrice).toBeDefined()
      expect(gasLimit).toMatchInlineSnapshot(`
        {
          "hex": "0x5209",
          "type": "BigNumber",
        }
      `)
    })
  })

  describe('errors', () => {
    it('signer is on different chain', async () => {
      await connect({ connector: client.connectors[0]! })

      const signers = getSigners()
      const to = signers[1]
      const toAddress = (await to?.getAddress()) || ''

      const request = await prepareSendTransaction({
        request: {
          to: toAddress,
          value: parseEther('10'),
        },
      })

      expect(() =>
        sendTransaction({
          chainId: 420,
          request,
        }),
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `"Chain mismatch: Expected \\"Chain 420\\", received \\"Ethereum."`,
      )
    })

    it('insufficient balance', async () => {
      await connect({ connector: client.connectors[0]! })

      const request = await prepareSendTransaction({
        request: {
          to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
          value: BigNumber.from('10000000000000000000000'), // 100,000 ETH
        },
      })

      try {
        await sendTransaction({
          request,
        })
      } catch (error) {
        expect((<Error>error).message).toContain(
          "sender doesn't have enough funds to send tx",
        )
      }
    })

    it('`to` undefined', async () => {
      await connect({ connector: client.connectors[0]! })

      const request = await prepareSendTransaction({
        request: {
          to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
          value: parseEther('10'),
        },
      })

      expect(() =>
        // @ts-expect-error - testing for JS consumers
        sendTransaction({
          request: {
            ...request,
            to: undefined,
          },
        }),
      ).rejects.toThrowErrorMatchingInlineSnapshot(`"\`to\` is required"`)
    })

    it('`gasLimit` undefined', async () => {
      await connect({ connector: client.connectors[0]! })

      const request = await prepareSendTransaction({
        request: {
          to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
          value: parseEther('10'),
        },
      })

      expect(() =>
        // @ts-expect-error - testing for JS consumers
        sendTransaction({
          request: {
            ...request,
            gasLimit: undefined,
          },
        }),
      ).rejects.toThrowErrorMatchingInlineSnapshot(`"\`gasLimit\` is required"`)
    })
  })
})