import test from 'node:test'
import assert from 'node:assert/strict'
import messages from '../src/i18n/messages.json' with { type: 'json' }
import { defaultLanguage, languages, localeFor, readLanguage, storageKey, translate } from '../src/i18n/language.js'

test('Uzbek is the default for new visitors and invalid or unavailable storage', () => {
  assert.equal(defaultLanguage, 'uz')
  for (const value of [null, '', 'fr', 'undefined']) {
    assert.equal(readLanguage({ getItem: () => value }), 'uz')
  }
  assert.equal(readLanguage({ getItem() { throw new Error('Storage blocked') } }), 'uz')
})

test('existing choices are restored for all supported languages', () => {
  for (const { code } of languages) {
    assert.equal(readLanguage({ getItem(key) { assert.equal(key, storageKey); return code } }), code)
  }
  assert.deepEqual(languages.map(item => item.code), ['uz', 'ru', 'en'])
})

test('each message has a nonempty translation for every supported language', () => {
  for (const [key, translations] of Object.entries(messages)) {
    for (const { code } of languages) {
      assert.equal(typeof translations[code], 'string', `${key}: missing ${code}`)
      assert.ok(translations[code].trim(), `${key}: empty ${code}`)
    }
  }
})

test('navigation, search, errors, and placeholders are localized', () => {
  for (const key of ['HOME', 'Search', 'City or Airport', 'Book Flight', 'Unable to load flights. Please try again later.']) {
    assert.notEqual(translate('uz', key), key)
    assert.notEqual(translate('ru', key), key)
    assert.equal(translate('en', key), key)
  }
  for (const { code } of languages) {
    assert.ok(translate(code, 'Passengers: {count}').includes('{count}'))
  }
  assert.equal(translate('en', 'Xatolik'), 'Error')
  assert.equal(translate('uz', 'An external airline name'), 'An external airline name')
})

test('calendar locale follows the language without changing stored ISO dates', () => {
  const date = new Date(2026, 9, 24)
  for (const { code } of languages) {
    const formatter = new Intl.DateTimeFormat(localeFor(code), { month: 'long' })
    assert.ok(formatter.resolvedOptions().locale.startsWith(code))
  }
  assert.equal(new Intl.DateTimeFormat(localeFor('ru'), { month: 'long' }).format(date), 'октябрь')
})
