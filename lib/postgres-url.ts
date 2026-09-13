const LEGACY_SSL_MODE = /([?&])sslmode=(prefer|require|verify-ca)(?=&|$)/i
const LIBPQ_COMPAT = /([?&])uselibpqcompat=true(?=&|$)/i

/**
 * pg currently treats prefer/require/verify-ca like verify-full, but pg@9 will
 * adopt weaker libpq semantics for those names. Make the current secure behavior
 * explicit without changing an intentionally opted-in libpq compatibility URL.
 */
export function hardenPostgresSslMode(connectionString: string): string {
  if (LIBPQ_COMPAT.test(connectionString)) return connectionString
  return connectionString.replace(LEGACY_SSL_MODE, "$1sslmode=verify-full")
}
