// Real crypto wallet addresses, kept in sync with checkout/index.html's CO_WALLETS.
// Duplicated here (server-side) rather than shared as one module because checkout's
// copy is inlined client-side JS on a static page with no build step. If a wallet
// address ever changes, update both places.

export const WALLETS = {
  'usdt-eth': { label: 'USDT (ERC-20)', addr: '0x2629c24d3720E5A24adBe7Bde4677334B559C36D' },
  'usdt-trx': { label: 'USDT (TRC-20)', addr: 'TVQGzSJKcHXTwX6Fn8CPb6A5PmAkoCFZRh' },
  'btc':      { label: 'Bitcoin (BTC)', addr: 'bc1qdhgnlpctw37vg825eejkknurpm23a5lsthfdhg' },
  'eth':      { label: 'Ethereum (ETH)', addr: '0x2629c24d3720E5A24adBe7Bde4677334B559C36D' },
  'sol':      { label: 'Solana (SOL)', addr: 'GdNUybxyu8cBY7snHAZsdopH6WKdHBVXo5d79mR9PhJ' },
  'xrp':      { label: 'XRP', addr: 'rBiWxdA3a27BXYC9ZwQRTyFdXNWaEjLfBr' },
  'bnb':      { label: 'BNB (BSC)', addr: '0x2629c24d3720E5A24adBe7Bde4677334B559C36D' },
};
