import test from 'node:test'
import assert from 'node:assert/strict'
import { paymentPresentation, hostedPaymentUrl, paymentIdValid } from '../src/lib/payments.js'
test('only a server-confirmed payment is presented as paid', () => {
  assert.equal(paymentPresentation(null), 'unverified')
  assert.equal(paymentPresentation({ status: 'succeeded' }), 'unverified')
  assert.equal(paymentPresentation({ status: 'succeeded', paidAt: '2026-11-09', verifiedAt: '2026-11-09' }), 'succeeded')
  for (const status of ['failed','cancelled','pending','unknown','creating','expired']) assert.equal(paymentPresentation({ status }),status)
  assert.equal(paymentPresentation({ status: 'success' }), 'unverified')
})
test('hosted checkout URL requires HTTPS without userinfo or fragment', () => {
  assert.equal(hostedPaymentUrl('https://bank.example/pay?ref=fixture'),'https://bank.example/pay?ref=fixture')
  for (const url of ['javascript:alert(1)','http://bank.example','https://user:pass@bank.example','https://bank.example/#fake']) assert.throws(()=>hostedPaymentUrl(url))
  assert.equal(paymentIdValid('a992bdc7-670d-442b-b0cf-d8532a5a63a8'),true)
  assert.equal(paymentIdValid('paid=true'),false)
})
