// Payment provider abstraction.
//
// Only a mock/sandbox provider exists today, per the site owner's choice to
// stay in test mode while the rest of the backend gets wired up — no real
// money moves through this build. The shape below (a `charge()` call that
// resolves to { ok, reference, provider } or throws) is deliberately close
// to what a real gateway's client SDK looks like, so swapping in a real
// provider later is mostly a drop-in replacement of this one class — see
// SETUP.md for the steps (e.g. YooKassa, CloudPayments, Stripe).

export class MockPaymentProvider {
  constructor({ failureRate = 0, delayMs = 900 } = {}) {
    this.failureRate = failureRate
    this.delayMs = delayMs
  }

  // Simulates handing a card/SBP payment to a sandbox gateway and waiting
  // for it to settle. Resolves with a fake payment reference; set
  // `failureRate` above 0 to also exercise the failure path in the UI.
  async charge({ amount, method, orderNumber }) {
    await new Promise((resolve) => setTimeout(resolve, this.delayMs))

    if (Math.random() < this.failureRate) {
      const err = new Error('Оплата отклонена банком. Проверьте данные карты или выберите другой способ оплаты.')
      err.code = 'card_declined'
      throw err
    }

    return {
      ok: true,
      reference: `mock_${method}_${orderNumber}_${Date.now().toString(36)}`,
      provider: 'mock',
      amount,
    }
  }
}

export const paymentProvider = new MockPaymentProvider()
