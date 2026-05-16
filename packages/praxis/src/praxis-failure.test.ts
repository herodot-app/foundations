import { describe, expect, test } from 'bun:test'
import { PraxisFailure } from './praxis-failure'

describe('PraxisFailure', () => {
  test('Aborted has correct name', () => {
    const failure = new PraxisFailure.Aborted()

    expect(failure.name).toBe('@herodot-app/praxis/praxis-failure/aborted')
  })

  test('Unknown has correct name', () => {
    const failure = new PraxisFailure.Unknown()

    expect(failure.name).toBe('@herodot-app/praxis/cerebrum/unknown-failure')
  })

  test('LiftRight has correct name', () => {
    const failure = new PraxisFailure.LiftRight()

    expect(failure.name).toBe('@herodot-app/praxis/cerebrum/lift-right-failure')
  })

  test('LiftLeft has correct name', () => {
    const failure = new PraxisFailure.LiftLeft()

    expect(failure.name).toBe('@herodot-app/praxis/cerebrum/lift-left-failure')
  })
})

