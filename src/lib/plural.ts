/**
 * Узгодження числівника з іменником.
 *
 * Українська має три форми, і вибір між ними не зводиться до «один чи багато»:
 * 1 знак · 2 знаки · 5 знаків · **11 знаків** · 21 знак. Останні два випадки й
 * ламають наївне `n === 1 ? одне : багато` — саме тому тут окремо перевіряється
 * другий десяток, де всі числа беруть форму множини незалежно від останньої цифри.
 */
export function plural(count: number, one: string, few: string, many: string): string {
  const n = Math.abs(Math.trunc(count))

  // 11…14 — цілком у множині: «одинадцять знаків», а не «одинадцять знак».
  if (n % 100 >= 11 && n % 100 <= 14) return many

  const last = n % 10
  if (last === 1) return one
  if (last >= 2 && last <= 4) return few
  return many
}

/** Число разом із узгодженим словом: `12 знаків`. */
export function counted(count: number, one: string, few: string, many: string): string {
  return `${count} ${plural(count, one, few, many)}`
}

/** English has only two forms — no second-decade exception to worry about. */
export function countedEn(count: number, one: string, many: string): string {
  return `${count} ${Math.abs(count) === 1 ? one : many}`
}
