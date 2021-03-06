import React from 'react'
import { FormattedMessage } from 'react-intl'
import { formatMessage, prepare, trunc, memoize, DEFAULT_ALLOW_BLANK } from './helpers'


const DATE_RANGE_ERROR = (
  <FormattedMessage id="form.errors.dateRange" defaultMessage="shoud be {op} {date}" />
)

const DATE_METHODS = {
  y: function(d) { return d.getFullYear() },
  m: function(d) { return d.getMonth() + 1 },
  d: function(d) { return d.getDate() }
}

const PARSE_REG = /(y+|m+|d+)/g

const TO_STRING = ({}).toString;

let date = memoize(function ({
      format,
      ymd,
      '=': eq,
      '!=': diff,
      '>': gt,
      '>=': gte,
      '<': lt,
      '<=': lte,
      message, msg,
      'if': ifCond, unless,
      allowBlank=DEFAULT_ALLOW_BLANK
    }) {
  msg = formatMessage(msg || message)
  let normFormat = normalizeFormat(format, ymd)

  return prepare(ifCond, unless, allowBlank, function(value) {
    let date = normParseDate(value, normFormat, false)
    if ('wrongFormat' === date) {
      return msg || (
        <FormattedMessage id="form.errors.dateFormat"
            defaultMessage="expected format: {format}"
            values={{ format: format }} />
      )
    }
    if ('invalid' === date) {
      return msg || (<FormattedMessage id="form.errors.dateInvalid" defaultMessage="is not a valid date"/>)
    }
    if (date) {
      let date2
      if (eq && +date !== +(date2 = getDate(eq))) {
        return msg || dateRangeError({ op: '=', date: normFormatDate(date2, normFormat) })
      }
      if (diff && +date === +(date2 = getDate(diff))) {
        return msg || dateRangeError({ op: '!=', date: normFormatDate(date2, normFormat) })
      }
      if (gt && date <= (date2 = getDate(gt))) {
        return msg || dateRangeError({ op: '>', date: normFormatDate(date2, normFormat) })
      }
      if (gte && date < (date2 = getDate(gte))) {
        return msg || dateRangeError({ op: '>=', date: normFormatDate(date2, normFormat) })
      }
      if (lt && date >= (date2 = getDate(lt))) {
        return msg || dateRangeError({ op: '<', date: normFormatDate(date2, normFormat) })
      }
      if (lte && date > (date2 = getDate(lte))) {
        return msg || dateRangeError({ op: '<=', date: normFormatDate(date2, normFormat) })
      }
    }
  })
})

export default date

export function parseDate (strDate, format, ymd) {
  return normParseDate(strDate, normalizeFormat(format, ymd), true)
}

export function formatDate (date, format, ymd) {
  if (!(date instanceof Date) && '[object Date]' !== TO_STRING.call(date)) {
    return null;
  }
  let t = new Date(date).getTime();
  return t !== t ? null : normFormatDate(date, normalizeFormat(format, ymd))
}



function dateRangeError (values) {
  return formatMessage({ id: 'form.errors.dateRange', values })
}

function getDate (d) {
  if ('function' === typeof d) {
    return new Date(+d())
  }
  if (isNaN(d) && 'today' === ('' + d).toLowerCase()) {
    let today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  }
  return new Date(+d)
}


// FORMAT
function normFormatDate (date, format) {
  return format.replace(PARSE_REG, function(m) {
    let sym = m.charAt(0)
    let len = m.length
    let padded = padding(DATE_METHODS[sym](date), len)
    return 'y' === sym ? padded.slice(padded.length - len, padded.length) : padded;
  })
}
function normalizeFormat (format, ymd) {
  if (!ymd) {
    return format
  }
  let reverseMapping = { [ymd.charAt(0)]: 'y', [ymd.charAt(1)]: 'm', [ymd.charAt(2)]: 'd' }
  return format.replace(new RegExp(`[${ymd}]`, 'g'), function(sym) {
    return reverseMapping[sym]
  })
}
function padding (num, pad) {
  return '0'.repeat(Math.max(0, pad - ('' + num).length)) + num
}


// PARSE
function normParseDate (value, format, parse) {
  let order = []
  let reg = new RegExp('^' + format.replace(PARSE_REG, function(m) {
    order.push(m.charAt(0))
    return `([0-9]{${m.length}})`
  }) + '$')
  let match = value.match(reg)
  if (match) {
    let flags = {}
    order.forEach(function(token, index) {
      flags[token] = +match[index + 1]
    })
    let comparable = null != flags.y ? (null != flags.m ? true : null == flags.d) : false
    flags = Object.assign({ y: 1970, m: 1, d: 1 }, flags)
    if (flags.y < 100) {
      flags.y = currentCentury(flags.y >= 69 ? -1 : 0) * 100 + flags.y
    }
    let date = new Date(flags.y, flags.m - 1, flags.d)
    return checkFlags(date, flags) ? (comparable || parse ? date : null) : (parse ? new Date(NaN) : 'invalid')
  }
  return parse ? new Date(NaN) : 'wrongFormat'
}

function currentCentury (add) {
  let century = trunc(new Date().getFullYear() / 100)
  return century < 0 ? century - add : century + add
}

function checkFlags (date, flags) {
  let [year, month, day] = [date.getFullYear(), date.getMonth() + 1, date.getDate()]
  return year === flags.y && month === flags.m && day === flags.d
}