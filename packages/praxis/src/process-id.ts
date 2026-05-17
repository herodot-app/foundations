import { Idion } from '@herodot-app/idion'

export type ProcessId = Idion<ProcessId.Identifier, { id: string }>

export namespace ProcessId {
  export const identifier = Symbol.for('@herodot-app/pracis/process-id')

  export type Identifier = typeof identifier

  export function create(): ProcessId {
    const firstDigits = Array(7)
      .fill(null)
      .reduce(
        acc => acc + generateHexaDecimalDigit(),
        generateHexaDecimalDigit(),
      )
    const secondDigits = Array(3)
      .fill(null)
      .reduce(
        acc => acc + generateHexaDecimalDigit(),
        generateHexaDecimalDigit(),
      )
    const thirdDigits = `4${Array(2)
      .fill(null)
      .reduce(
        acc => acc + generateHexaDecimalDigit(),
        generateHexaDecimalDigit(),
      )}`
    const fourthDigits = Array(3)
      .fill(null)
      .reduce(
        acc => acc + generateHexaDecimalDigit(),
        (Math.floor(Math.random() * 4) + 8).toString(16),
      )
    const fithDigits = Array(11)
      .fill(null)
      .reduce(
        acc => acc + generateHexaDecimalDigit(),
        generateHexaDecimalDigit(),
      )

    const id = [
      firstDigits,
      secondDigits,
      thirdDigits,
      fourthDigits,
      fithDigits,
    ].join('-')

    return Idion.create({
      id: identifier,
      value: { id },
    })
  }

  function generateHexaDecimalDigit(): string {
    return Math.floor(Math.random() * 16).toString(16)
  }
}
