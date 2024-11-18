import React, { useCallback, useState } from 'react'
import { getHighNetworks, getLowNetworks } from '../../../../constants'
import styles from './WithdrawTransactions.module.css'
import { BridgeTransferStatus } from 'game7-bridge-sdk'
import IconArrowNarrowUp from '@/assets/IconArrowNarrowUp'
import IconLinkExternal02 from '@/assets/IconLinkExternal02'
import IconWithdrawalNodeCompleted from '@/assets/IconWithdrawalNodeCompleted'
import WithdrawalMobile from '@/components/bridge/history/WithdrawalMobile'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { useBridgeTransfer } from '@/hooks/useBridgeTransfer'
import { TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'
import { ETA, timeAgo } from '@/utils/timeFormat'
import { getBlockExplorerUrl } from '@/utils/web3utils'
import { ChildToParentMessageStatus } from '@arbitrum/sdk'
import { useMediaQuery } from '@mantine/hooks'

interface WithdrawalProps {
  withdrawal: TransactionRecord
}

export const getStatus = (withdrawal: TransactionRecord) => {
  const {
    completionTimestamp,
    claimableTimestamp,
    highNetworkChainId,
    lowNetworkChainId,
    highNetworkTimestamp,
    amount,
    highNetworkHash
  } = withdrawal
  const status = completionTimestamp
    ? ChildToParentMessageStatus.EXECUTED
    : claimableTimestamp
      ? ChildToParentMessageStatus.CONFIRMED
      : ChildToParentMessageStatus.UNCONFIRMED
  const lowNetwork = getLowNetworks().find((n) => n.chainId === lowNetworkChainId)
  const highNetwork = getHighNetworks().find((n) => n.chainId === highNetworkChainId)
  if (lowNetwork && highNetwork) {
    const data = {
      status,
      from: highNetwork.displayName,
      to: lowNetwork.displayName,
      timestamp: highNetworkTimestamp,
      lowNetworkTimeStamp: completionTimestamp,
      amount,
      highNetworkHash
    }
    return { isLoading: false, data }
  }
}
const Withdrawal: React.FC<WithdrawalProps> = ({ withdrawal }) => {
  const status = getStatus(withdrawal)
  const { connectedAccount, selectedNetworkType } = useBlockchainContext()
  const smallView = useMediaQuery('(max-width: 1199px)')
  const { claim, returnTransferData } = useBridgeTransfer()
  const [collapseExecuted, setCollapseExecuted] = useState(false)
  const [hovered, setHovered] = useState(false)
  const transferData = useCallback(() => returnTransferData({ txRecord: withdrawal }), [withdrawal, returnTransferData])
  const { data: transferStatus, isLoading } = transferData()
  const transactionsString = localStorage.getItem(`bridge-${connectedAccount}-transactions-${selectedNetworkType}`)
  let transactions = transactionsString ? JSON.parse(transactionsString) : []
  const localStorageTransaction = transactions.find(
    (t: TransactionRecord) => t.type === 'WITHDRAWAL' && t.highNetworkHash === withdrawal.highNetworkHash
  )
  const withdrawalCompletedData = withdrawal?.lowNetworkHash ? withdrawal : localStorageTransaction
  return (
    <>
      {isLoading && smallView ? (
        <div className={styles.gridItem}>
          <div className={styles.loading}>Loading</div>
        </div>
      ) : (
        <>
          {smallView ? (
            <WithdrawalMobile withdrawal={withdrawal} claim={claim} status={status} transferStatus={transferStatus} />
          ) : (
            <>
              {isLoading || transferStatus?.status === undefined ? (
                <>
                  <div className={styles.gridItem} title={withdrawal.highNetworkHash}>
                    <div className={styles.typeWithdrawal}>
                      <IconArrowNarrowUp className={styles.arrowUp} />
                      Withdraw
                    </div>
                  </div>
                  <div className={styles.gridItem}>{timeAgo(withdrawal.highNetworkTimestamp)}</div>
                  <div
                    className={styles.gridItem}
                  >{`${status?.data?.amount} ${localStorageTransaction?.symbol ?? ''}`}</div>
                  <div className={styles.gridItem}>{status?.data?.from ?? ''}</div>
                  <div className={styles.gridItem}>{status?.data?.to ?? ''}</div>
                  <div className={styles.gridItem}>
                    <div className={styles.loading}>Loading</div>
                  </div>
                  <div className={styles.gridItem}>
                    <div className={styles.loading}>Loading</div>
                  </div>
                </>
              ) : (
                <>
                  {transferStatus && transferStatus?.status === BridgeTransferStatus.WITHDRAW_EXECUTED && (
                    <>
                      <div
                        className={styles.gridItem}
                        title={withdrawal.highNetworkHash}
                        onClick={() => setCollapseExecuted(!collapseExecuted)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: hovered ? '#393939' : 'initial'
                        }}
                        onMouseEnter={() => setHovered(true)}
                        onMouseLeave={() => setHovered(false)}
                      >
                        {collapseExecuted && <IconWithdrawalNodeCompleted className={styles.gridNodeCompleted} />}
                        <div className={styles.typeWithdrawal} onClick={() => setCollapseExecuted(!collapseExecuted)}>
                          <IconArrowNarrowUp className={styles.arrowUp} />
                          Withdraw
                        </div>
                      </div>
                      <div
                        className={styles.gridItem}
                        onClick={() => setCollapseExecuted(!collapseExecuted)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: hovered ? '#393939' : 'initial'
                        }}
                        onMouseEnter={() => setHovered(true)}
                        onMouseLeave={() => setHovered(false)}
                      >
                        {timeAgo(withdrawal?.highNetworkTimestamp)}
                      </div>
                      <div
                        className={styles.gridItem}
                        onClick={() => setCollapseExecuted(!collapseExecuted)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: hovered ? '#393939' : 'initial'
                        }}
                        onMouseEnter={() => setHovered(true)}
                        onMouseLeave={() => setHovered(false)}
                      >{`${status?.data?.amount} ${localStorageTransaction?.symbol ?? ''}`}</div>
                      <div
                        className={styles.gridItem}
                        onClick={() => setCollapseExecuted(!collapseExecuted)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: hovered ? '#393939' : 'initial'
                        }}
                        onMouseEnter={() => setHovered(true)}
                        onMouseLeave={() => setHovered(false)}
                      >
                        {status?.data?.from ?? ''}
                      </div>
                      <div
                        className={styles.gridItem}
                        onClick={() => setCollapseExecuted(!collapseExecuted)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: hovered ? '#393939' : 'initial'
                        }}
                        onMouseEnter={() => setHovered(true)}
                        onMouseLeave={() => setHovered(false)}
                      >
                        {status?.data?.to ?? ''}
                      </div>
                      <div
                        className={styles.gridItem}
                        onClick={() => setCollapseExecuted(!collapseExecuted)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: hovered ? '#393939' : 'initial'
                        }}
                        onMouseEnter={() => setHovered(true)}
                        onMouseLeave={() => setHovered(false)}
                      >
                        <a
                          href={`${getBlockExplorerUrl(withdrawalCompletedData.lowNetworkChainId)}/tx/${withdrawalCompletedData.lowNetworkHash}`}
                          target={'_blank'}
                          className={styles.explorerLink}
                        >
                          <div className={styles.settled} onClick={() => setCollapseExecuted(!collapseExecuted)}>
                            Completed
                            <IconLinkExternal02 stroke={'#fff'} />
                          </div>
                        </a>
                      </div>
                      <div
                        className={styles.gridItemImportant}
                        onClick={() => setCollapseExecuted(!collapseExecuted)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: hovered ? '#393939' : 'initial'
                        }}
                        onMouseEnter={() => setHovered(true)}
                        onMouseLeave={() => setHovered(false)}
                      >
                        <div>{timeAgo(withdrawalCompletedData?.completionTimestamp)}</div>
                      </div>
                      {collapseExecuted && (
                        <>
                          <div className={styles.gridItemChild} title={withdrawal.highNetworkHash}>
                            <div className={styles.typeCompleted}>Initiate</div>
                          </div>
                          <div className={styles.gridItemInitiate}>{timeAgo(withdrawal?.highNetworkTimestamp)}</div>
                          <div
                            className={styles.gridItemInitiate}
                          >{`${status?.data?.amount} ${localStorageTransaction?.symbol ?? ''}`}</div>
                          <div className={styles.gridItemInitiate}>{status?.data?.from ?? ''}</div>
                          <div className={styles.gridItemInitiate}>{status?.data?.to ?? ''}</div>
                          <div className={styles.gridItemInitiate}>
                            <a
                              href={`${getBlockExplorerUrl(withdrawal.highNetworkChainId)}/tx/${withdrawal.highNetworkHash}`}
                              target={'_blank'}
                              className={styles.explorerLink}
                            >
                              <div className={styles.settled}>
                                Completed
                                <IconLinkExternal02 stroke={'#fff'} />
                              </div>
                            </a>
                          </div>
                          <div className={styles.gridItemInitiate}>
                            <div className={styles.timeCenter}>
                              {timeAgo(withdrawalCompletedData?.completionTimestamp)}
                            </div>
                          </div>
                          <div className={styles.gridItemChild} title={withdrawal.highNetworkHash}>
                            <div className={styles.typeCompleted}>Finalize</div>
                          </div>
                          <div className={styles.gridItemInitiate}>
                            {timeAgo(withdrawalCompletedData?.completionTimestamp)}
                          </div>
                          <div
                            className={styles.gridItemInitiate}
                          >{`${status?.data?.amount} ${localStorageTransaction?.symbol ?? ''}`}</div>
                          <div className={styles.gridItemInitiate}>{status?.data?.from ?? ''}</div>
                          <div className={styles.gridItemInitiate}>{status?.data?.to ?? ''}</div>
                          <div className={styles.gridItemInitiate}>
                            <a
                              href={`${getBlockExplorerUrl(withdrawalCompletedData.lowNetworkChainId)}/tx/${withdrawalCompletedData.lowNetworkHash}`}
                              target={'_blank'}
                              className={styles.explorerLink}
                            >
                              <div className={styles.settled}>
                                Completed
                                <IconLinkExternal02 stroke={'#fff'} />
                              </div>
                            </a>
                          </div>
                          <div className={styles.gridItemInitiate}>
                            <div className={styles.timeCenter}>
                              {timeAgo(withdrawalCompletedData?.completionTimestamp)}
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}
                  {transferStatus && transferStatus.status != BridgeTransferStatus.WITHDRAW_EXECUTED && (
                    <>
                      <div className={styles.gridItem} title={withdrawal.highNetworkHash}>
                        <div className={styles.typeWithdrawal}>
                          <IconArrowNarrowUp className={styles.arrowUp} />
                          Withdraw
                        </div>
                      </div>
                      <div className={styles.gridItem}>{timeAgo(status?.data?.timestamp)}</div>
                      <div
                        className={styles.gridItem}
                      >{`${status?.data?.amount} ${localStorageTransaction?.symbol ?? ''}`}</div>
                      <div className={styles.gridItem}>{status?.data?.from ?? ''}</div>
                      <div className={styles.gridItem}>{status?.data?.to ?? ''}</div>
                      {transferStatus && transferStatus.status === BridgeTransferStatus.WITHDRAW_CONFIRMED && (
                        <>
                          <div className={styles.gridItem}>
                            <a
                              href={`${getBlockExplorerUrl(withdrawal.highNetworkChainId)}/tx/${withdrawal.highNetworkHash}`}
                              target={'_blank'}
                              className={styles.explorerLink}
                            >
                              <div className={styles.claimable}>
                                Claimable
                                <IconLinkExternal02 className={styles.arrowUp} />
                              </div>
                            </a>
                          </div>
                          <div className={styles.gridItem}>
                            <button className={styles.claimButton} onClick={() => claim.mutate(withdrawal)}>
                              {claim.isLoading && !claim.isSuccess ? 'Claiming...' : 'Claim Now'}
                            </button>
                          </div>
                        </>
                      )}
                      {transferStatus && transferStatus.status === BridgeTransferStatus.WITHDRAW_UNCONFIRMED && (
                        <>
                          <div className={styles.gridItem}>
                            <a
                              href={`${getBlockExplorerUrl(withdrawal.highNetworkChainId)}/tx/${withdrawal.highNetworkHash}`}
                              target={'_blank'}
                              className={styles.explorerLink}
                            >
                              <div className={styles.pending}>
                                Pending
                                <IconLinkExternal02 className={styles.arrowUp} />
                              </div>
                            </a>
                          </div>

                          <div className={styles.gridItemImportant}>
                            <div>{ETA(withdrawal?.highNetworkTimestamp, withdrawal.challengePeriod)} left</div>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
    </>
  )
}

export default Withdrawal
