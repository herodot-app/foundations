import { Ptoma } from '@herodot-app/ptoma'

export type PraxisFailure =
  | PraxisFailure.Aborted
  | PraxisFailure.LiftRight
  | PraxisFailure.LiftLeft
  | PraxisFailure.Unknown

export namespace PraxisFailure {
  export class Aborted extends Ptoma.create(
    '@herodot-app/praxis/praxis-failure/aborted',
    'The current experience has been aborted',
  ) {}

  export class LiftRight extends Ptoma.create(
    '@herodot-app/praxis/cerebrum/lift-right-failure',
    'unable to lift the right value of a cerebrum thought zygonc',
  ) {}

  export class LiftLeft extends Ptoma.create(
    '@herodot-app/praxis/cerebrum/lift-left-failure',
    'unable to lift the right value of a cerebrum thought zygonc',
  ) {}

  export class Unknown extends Ptoma.create(
    '@herodot-app/praxis/cerebrum/unknown-failure',
    'unknown failure during a cerebrum thought',
  ) {}
}
