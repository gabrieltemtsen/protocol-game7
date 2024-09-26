import React, { useEffect, useState } from 'react'
import { L3_NATIVE_TOKEN_SYMBOL } from '../../../../constants'
import styles from './ValueToBridge.module.css'
import IconChevronDownSelector from '@/assets/IconChevronDownSelector'
import IconG7TSmall from '@/assets/IconG7TSmall'
import TokenSelector from '@/components/commonComponents/tokenSelector/TokenSelector'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { getTokensForNetwork, Token } from '@/utils/tokens'

const formatCurrency = (value: number) => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  return formatter.format(value)
}

interface ValueToBridgeProps {
  symbol: string
  value: string
  setValue: (value: string) => void
  balance: string | undefined
  rate: number
  isFetchingBalance?: boolean
  errorMessage: string
  setErrorMessage: (arg0: string) => void
}
const ValueToBridge: React.FC<ValueToBridgeProps> = ({
  setValue,
  value,
  balance,
  symbol,
  rate,
  isFetchingBalance,
  errorMessage,
  setErrorMessage
}) => {
  const { chainId } = useBlockchainContext()
  const [tokens, setTokens] = useState<Token[]>([])
  const [token, setToken] = useState<Token>()

  const fetchTokens = async () => {
    const _tokens = getTokensForNetwork(chainId)
    setToken(_tokens[0])
    setTokens(_tokens)
  }

  useEffect(() => {
    fetchTokens()
  }, [chainId])

  useEffect(() => {
    const num = Number(value)
    if (isNaN(num) || num < 0) {
      setErrorMessage('Invalid number')
      return
    }
    if (num > Number(balance)) {
      setErrorMessage('Insufficient funds')
      return
    }
    setErrorMessage('')
  }, [value, balance])

  const { connectedAccount } = useBlockchainContext()

  useEffect(() => {
    if (!connectedAccount) {
      setValue('0')
    }
  }, [connectedAccount])

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.label}>Amount</div>
        <div className={styles.errorMessage}>{errorMessage}</div>
      </div>
      <div className={errorMessage ? styles.inputWithError : styles.inputGroup}>
        <input
          className={styles.input}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={!connectedAccount}
        />
        <button className={styles.maxButton} onClick={() => setValue(String(balance))} disabled={!connectedAccount}>
          MAX
        </button>
        {tokens.length > 0 && token && (
          <TokenSelector tokens={tokens} selectedToken={token} onChange={(token: Token) => setToken(token)} />
        )}
        {/* <div className={styles.tokenGroup}>
          <IconG7TSmall />
          <div className={styles.tokenSymbol}>{L3_NATIVE_TOKEN_SYMBOL}</div>
          <IconChevronDownSelector />
        </div> */}
      </div>
      <div className={styles.header}>
        <div className={styles.label}>{rate > 0 ? formatCurrency(Number(value) * rate) : ' '}</div>
        <div className={styles.available}>
          <div className={`${styles.label} ${isFetchingBalance ? styles.blink : ''}`}>{balance ?? '0'}</div>{' '}
          {/*TODO how to display undefined balance */}
          <div className={styles.label}>{`${symbol} Available`}</div>
        </div>
      </div>
    </div>
  )
}

export default ValueToBridge
