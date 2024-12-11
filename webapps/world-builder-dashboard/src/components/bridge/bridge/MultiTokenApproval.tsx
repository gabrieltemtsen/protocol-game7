import React, { useState } from 'react';
import styles from './MultiTokenApproval.module.css';
import { Modal } from 'summon-ui/mantine';
import AllowanceSelector from '../allowance/AllowanceSelector';
import { ethers } from 'ethers';
import { useQueryClient } from 'react-query';
import { useMutation } from 'react-query';
import { Bridger } from 'game7-bridge-sdk';
import { useBlockchainContext } from '@/contexts/BlockchainContext';
import { getNetworks } from '../../../../constants';
import { Token } from '@/utils/tokens';
import IconCheck from '@/assets/IconCheck';

interface MultiTokenApprovalProps {
  showApproval: boolean
  setShowApproval: (showApproval: boolean) => void
  balance: string | undefined
  nativeBalance: string | undefined
  amount: string
  bridger: Bridger | undefined
  decimals: number | undefined
  tokens: Token[]
  startingTokenIndex: number
  onApprovalComplete: () => void;
}

export const MultiTokenApproval: React.FC<MultiTokenApprovalProps> = ({ showApproval, setShowApproval, bridger, amount, balance, nativeBalance, decimals, tokens, startingTokenIndex, onApprovalComplete }) => {
  const { selectedNetworkType, getProvider } = useBlockchainContext()
  const queryClient = useQueryClient()
  const networks = getNetworks(selectedNetworkType)
  const [newAllowance, setNewAllowance] = useState(ethers.utils.parseUnits(amount || '0', decimals || 18))
  
  // Initialize approvedTokens with already approved tokens
  const initialApprovedTokens = new Set(
    tokens
      .filter((_, index) => index < startingTokenIndex)
      .map(token => token.symbol)
  );
  const [approvedTokens, setApprovedTokens] = useState<Set<string>>(initialApprovedTokens)
  const [currentTokenIndex, setCurrentTokenIndex] = useState(startingTokenIndex)

  const approve = useMutation(
    async (amount: ethers.BigNumber) => {
      const currentToken = tokens[currentTokenIndex];
      const network = networks?.find((n) => n.chainId === bridger?.originNetwork.chainId)
      if (!network) throw new Error('Network not found')
      const provider = await getProvider(network)
      const signer = provider.getSigner()

      console.log('Approving token:', {
        currentIndex: currentTokenIndex,
        tokenSymbol: currentToken.symbol,
        isNative: currentTokenIndex === 1
      });

      const txApprove = currentTokenIndex === 0
        ? await bridger?.approve(amount, signer)
        : await bridger?.approveNative(newAllowance, signer);

      await txApprove?.wait()
      return { tx: txApprove, tokenSymbol: currentToken.symbol }
    },
    {
      onSuccess: ({ tokenSymbol }) => {
        setApprovedTokens(prev => new Set([...prev, tokenSymbol]))
        
        // Log the current state
        console.log('Approval success:', {
          tokenSymbol,
          currentIndex: currentTokenIndex,
          totalTokens: tokens.length,
          approvedTokens: Array.from(approvedTokens)
        });

        if (currentTokenIndex < tokens.length - 1) {
          console.log('Moving to next token');
          setCurrentTokenIndex(prev => prev + 1)
        } else {
          console.log('All tokens approved');
          handleAllApprovalsComplete()
        }
        queryClient.refetchQueries(['ERC20Balance'])
      },
      onError: (e) => {
        console.error('Approval error:', e)
      }
    }
  )

  const handleAllApprovalsComplete = () => {
    setShowApproval(false)
    onApprovalComplete()
  }

  return (
    <Modal
      opened={showApproval}
      radius={'12px'}
      onClose={() => setShowApproval(false)}
      withCloseButton={false}
      padding={'0px'}
      overlayProps={{
        color: 'rgba(57, 57, 57)',
        backgroundOpacity: 0.7,
        blur: 8
      }}
    >
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>Approve Tokens</div>
          <div className={styles.modalSubtitle}>Approve the tokens you want to bridge</div>
        </div>
        <div className={styles.space} />
        <div className={styles.tokenApprovalBarContainer}>
          <div className={styles.barContainer}>
            {tokens.map((token) => (
              <div
                key={token.symbol}
                className={`${styles.bar} ${approvedTokens.has(token.symbol) ? styles.barApproved : ''}`}
              >
                <div className={styles.barTitleContainer}>
                  <div className={`${styles.barTitle} ${approvedTokens.has(token.symbol) ? styles.barTitleApproved : ''}`}>
                    Approve {token.symbol}
                  </div>
                  {approvedTokens.has(token.symbol) && <IconCheck stroke="#F04438" />}
                </div>
                {approve.isLoading && currentTokenIndex === tokens.indexOf(token) && (
                  <div className={styles.loadingBar} />
                )}
              </div>
            ))}
          </div>
        </div>
        <div className={styles.allowanceSection}>
          <div className={styles.allowanceContainer}>
            <div className={styles.allowanceTitle}>Allowance {currentTokenIndex === 0 ? `(${balance} available)` : `(${nativeBalance} available)`}</div>
            <AllowanceSelector
              token={tokens[currentTokenIndex]}
              balance={currentTokenIndex === 0 
                ? ethers.utils.parseUnits(balance || '0', decimals || 18)
                : ethers.utils.parseUnits(nativeBalance || '0', 18)
              }
              amount={currentTokenIndex === 0
                ? ethers.utils.parseUnits(amount || '0', decimals || 18)
                : ethers.utils.parseUnits(amount || '0', 18)
              }
              onChange={(value) => setNewAllowance(value)}
              allowance={newAllowance}
              disabled={approve.isLoading}
            />
          </div>
          <div className={styles.hintText}>
            Set token limit to allow the bridge contract to perform token transfers on your behalf. It cannot move funds without your permission.
          </div>
          <div className={styles.hintBadge}>
            <div className={styles.hintBadgeText}>
              ~0.0001 Arbitrum One ETH will be used for gas
            </div>
          </div>
        </div>
        <div className={styles.buttonSpacer} />
        <div className={styles.buttonSection}>
          <div onClick={() => approve.mutate(newAllowance)} className={`${styles.button} ${approve.isLoading ? styles.buttonLoading : ''}`}>
            <div className={`${styles.buttonText} ${approve.isLoading ? styles.buttonLoadingText : ''}`}>
              {approve.isLoading ? 'Approving...' : 'Approve'}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
