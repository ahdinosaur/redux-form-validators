import React from 'react'
import { FormattedMessage } from 'react-intl'
import { formatMessage, prepare, memoize, DEFAULT_ALLOW_BLANK } from './helpers'


const DEFAULT_CASE_SENSITIVE = true


let inclusion = memoize(function (options) {
  return inclusionExclusion(true, options)
})

export default inclusion

export function inclusionExclusion (inclusion, {
      'in': inc, within,
      caseSensitive,
      message, msg,
      'if': ifCond, unless,
      allowBlank=DEFAULT_ALLOW_BLANK
    }) {
  msg = formatMessage(msg || message)

  caseSensitive = (null != caseSensitive ? caseSensitive : DEFAULT_CASE_SENSITIVE)

  within = [].concat(within || inc).map(function(val) {
    return caseSensitive ? ('' + val) : ('' + val).toLowerCase()
  })

  return prepare(ifCond, unless, allowBlank, function (value) {
    if (!caseSensitive) {
      value = value.toLowerCase()
    }
    if (inclusion) {
      if (within.indexOf(value) < 0) {
        return msg || (<FormattedMessage id="form.errors.inclusion" defaultMessage="is not included in the list" />)
      }
    } else {
      if (within.indexOf(value) >= 0) {
        return msg || (<FormattedMessage id="form.errors.exclusion" defaultMessage="is reserved" />)
      }
    }
  })
}