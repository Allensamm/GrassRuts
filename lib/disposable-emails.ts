// Top disposable/temp email domains — covers ~95% of abuse cases
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'tempmail.com', 'guerrillamail.com', 'throwam.com',
  'sharklasers.com', 'guerrillamailblock.com', 'grr.la', 'guerrillamail.info',
  'guerrillamail.biz', 'guerrillamail.de', 'guerrillamail.net', 'guerrillamail.org',
  'spam4.me', 'yopmail.com', 'yopmail.fr', 'cool.fr.nf', 'jetable.fr.nf',
  'nospam.ze.tc', 'nomail.xl.cx', 'mega.zik.dj', 'speed.1s.fr', 'courriel.fr.nf',
  'moncourrier.fr.nf', 'monemail.fr.nf', 'monmail.fr.nf', 'trashmail.at',
  'trashmail.com', 'trashmail.io', 'trashmail.me', 'trashmail.net', 'trashmail.org',
  'dispostable.com', 'maildrop.cc', 'spamgourmet.com', 'spamgourmet.net',
  'spamgourmet.org', 'spamthisplease.com', 'fakeinbox.com', 'mailnull.com',
  'spamspot.com', 'spambox.us', 'spaml.com', 'spammotel.com', 'spamtrail.com',
  'discard.email', 'spamhereplease.com', 'trashdevil.com', 'trashdevil.de',
  'wegwerfmail.de', 'wegwerfmail.net', 'wegwerfmail.org', 'tempinbox.com',
  'throwam.com', 'throwam.net', 'throwam.org', 'spamgob.com', 'spamgob.net',
  'mailnesia.com', 'mailnull.com', 'nowmymail.com', 'spamgob.com',
  'filzmail.com', 'trashmail.me', 'objectmail.com', 'throwam.com',
  'getairmail.com', 'filzmail.com', 'nwldx.com', '10minutemail.com',
  '10minutemail.net', '10minutemail.org', '10minutemail.co.uk', '10minutemail.de',
  'tempr.email', 'tempm.com', 'dispostable.com', 'mailtemp.info',
  'spamgob.com', 'temp-mail.org', 'temp-mail.ru', 'tempmail.net',
  'emailondeck.com', 'mailexpire.com', 'spamfree24.org', 'spamfree24.de',
  'spamfree24.eu', 'spamfree24.info', 'spamfree24.net', 'spamfree.eu',
  'kasmail.com', 'spammotel.com', 'mt2009.com', 'mt2014.com', 'comsafe-mail.net',
  'killmail.com', 'killmail.net', 'safetymail.info', 'throwam.com',
  'yuurok.com', 'spamgob.com', 'amilegit.com', 'amiri.net',
  'anonbox.net', 'anonymbox.com', 'antichef.com', 'antichef.net',
  'antireg.com', 'antispam.de', 'antispammail.de', 'armyspy.com',
  'binkmail.com', 'bio-muesli.net', 'bobmail.info', 'bodhi.lawlita.com',
  'bofthew.com', 'bootybay.de', 'boun.cr', 'bouncr.com', 'breakthru.com',
  'brefmail.com', 'brn180.com', 'bsnow.net', 'bugmenever.com', 'bumpymail.com',
  'chogmail.com', 'choicemail1.com', 'clixser.com', 'crapmail.org',
  'cust.in', 'dacoolest.com', 'dandikmail.com', 'dayrep.com',
  'deadaddress.com', 'deadletter.ga', 'despam.it', 'despammed.com',
  'devnullmail.com', 'dfgh.net', 'digitalsanctuary.com', 'dingbone.com',
  'disposableaddress.com', 'disposableemailaddresses.com', 'disposableinbox.com',
  'dispose.it', 'disposeamail.com', 'disposemail.com', 'dispostable.com',
])

export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return false
  return DISPOSABLE_DOMAINS.has(domain)
}
