import { describe, expect, it } from 'bun:test'
import { Agora } from '@herodot-app/agora'
import { Idion } from '@herodot-app/idion'
import { Ptoma } from '@herodot-app/ptoma'
import { Cognition } from './cognition'
import { Experience } from './experience'

describe('Experience', () => {
  describe('Experience.create', () => {
    it('creates an experience with a value', () => {
      const experience = Experience.create({ value: 42 })

      expect(experience.value).toBe(42)
    })

    it('creates an experience with a complex value', () => {
      const data = { name: 'test', items: [1, 2, 3] }
      const experience = Experience.create({ value: data })

      expect(experience.value).toEqual(data)
    })

    it('creates an experience with typed value', () => {
      const experience = Experience.create<string>({ value: 'hello' })

      expect(typeof experience.value).toBe('string')
      expect(experience.value).toBe('hello')
    })

    it('creates an experience with an AbortController', () => {
      const experience = Experience.create({ value: 42 })

      expect(experience.controller).toBeInstanceOf(AbortController)
    })

    it('creates an experience with an empty abortions agora by default', () => {
      const experience = Experience.create({ value: 42 })

      expect(experience.abortions).toBeDefined()
      expect(Agora.is(experience.abortions)).toBe(true)
    })

    it('creates an experience with a custom abortions agora', () => {
      const customAbortions = Agora.create<Experience.Abortion>()
      const experience = Experience.create({
        value: 42,
        abortions: customAbortions,
      })

      expect(experience.abortions).toBe(customAbortions)
    })
  })

  describe('Experience branding', () => {
    it('creates a branded experience', () => {
      const experience = Experience.create({ value: 42 })

      expect(Idion.is(experience, Experience.identifier)).toBe(true)
    })

    it('can distinguish between experiences and plain objects', () => {
      const experience = Experience.create({ value: 42 })
      const notExperience = { value: 42 }

      expect(Idion.is(experience, Experience.identifier)).toBe(true)
      expect(Idion.is(notExperience, Experience.identifier)).toBe(false)
    })

    it('has the correct identifier', () => {
      expect(Experience.identifier.description).toBe(
        '@herodot-app/praxis/experience',
      )
    })
  })

  describe('Experience.Abortion', () => {
    it('creates an abortion with no reason', () => {
      const abortion = Experience.abortion()

      expect(abortion).toBeInstanceOf(Error)
      expect(Ptoma.match(abortion, Experience.Abortion)).toBe(true)
      expect(abortion.name).toBe('@herodot-app/praxis/experience/abortion')
    })

    it('creates an abortion with a reason', () => {
      const abortion = Experience.abortion('user cancelled')

      expect(abortion.message).toBe('user cancelled')
    })

    it('is an instance of Ptoma', () => {
      const abortion = Experience.abortion()

      expect(Ptoma.is(abortion)).toBe(true)
    })

    it('matches the Abortion type', () => {
      const abortion = Experience.abortion('test')

      expect(Ptoma.match(abortion, Experience.Abortion)).toBe(true)
    })

    it('does not match other Ptoma types', () => {
      const abortion = Experience.abortion()
      const otherError = new Error('other')

      expect(Ptoma.match(abortion, Experience.Abortion)).toBe(true)
      expect(Ptoma.is(otherError)).toBe(false)
    })
  })

  describe('Experience.abort', () => {
    it('aborts an experience and publishes to abortions agora', () => {
      const experience = Experience.create({ value: 42 })
      let receivedAbortion: Experience.Abortion | undefined

      Agora.listen(experience.abortions, abortion => {
        receivedAbortion = abortion
      })

      Experience.abort(experience, 'timeout')

      expect(receivedAbortion).toBeDefined()
      expect(receivedAbortion?.message).toBe('timeout')
    })

    it('aborts without a reason', () => {
      const experience = Experience.create({ value: 42 })
      let receivedAbortion: Experience.Abortion | undefined

      Agora.listen(experience.abortions, abortion => {
        receivedAbortion = abortion
      })

      Experience.abort(experience)

      expect(receivedAbortion).toBeDefined()
      expect(receivedAbortion?.message).toContain('AbortError')
    })

    it('can abort only once', () => {
      const experience = Experience.create({ value: 42 })
      const abortions: Experience.Abortion[] = []

      Agora.listen(experience.abortions, abortion => {
        abortions.push(abortion)
      })

      Experience.abort(experience, 'first')
      Experience.abort(experience, 'second')

      expect(abortions.length).toBe(1)
      expect(abortions[0]?.message).toBe('first')
    })
  })

  describe('AbortController integration', () => {
    it('sets the AbortController signal when aborting', () => {
      const experience = Experience.create({ value: 42 })

      expect(experience.controller.signal.aborted).toBe(false)

      Experience.abort(experience, 'test')

      expect(experience.controller.signal.aborted).toBe(true)
    })

    it('sets the abort reason on the signal', () => {
      const experience = Experience.create({ value: 42 })

      Experience.abort(experience, 'timeout exceeded')

      expect(experience.controller.signal.aborted).toBe(true)
      expect(experience.controller.signal.reason).toBe('timeout exceeded')
    })

    it('triggers abortions agora when signal aborts', () => {
      const experience = Experience.create({ value: 42 })
      let receivedAbortion: Experience.Abortion | undefined

      Agora.listen(experience.abortions, abortion => {
        receivedAbortion = abortion
      })

      experience.controller.abort('controller abort')

      expect(receivedAbortion).toBeDefined()
      expect(receivedAbortion?.message).toBe('controller abort')
    })

    it('triggers abortions agora when Experience.abort is called', () => {
      const experience = Experience.create({ value: 42 })
      let receivedAbortion: Experience.Abortion | undefined

      Agora.listen(experience.abortions, abortion => {
        receivedAbortion = abortion
      })

      Experience.abort(experience, 'from Experience.abort')

      expect(receivedAbortion).toBeDefined()
      expect(receivedAbortion?.message).toBe('from Experience.abort')
    })
  })

  describe('Experience.Input type', () => {
    it('accepts value and optional abortions', () => {
      const input: Experience.Input<number> = {
        value: 42,
      }

      const experience = Experience.create(input)

      expect(experience.value).toBe(42)
    })

    it('accepts custom abortions in input', () => {
      const customAbortions = Agora.create<Experience.Abortion>()
      const input: Experience.Input<string> = {
        value: 'test',
        abortions: customAbortions,
      }

      const experience = Experience.create(input)

      expect(experience.abortions).toBe(customAbortions)
    })
  })

  describe('multiple experiences', () => {
    it('each experience has independent abortions', () => {
      const experience1 = Experience.create({ value: 1 })
      const experience2 = Experience.create({ value: 2 })

      let abortion1: Experience.Abortion | undefined
      let abortion2: Experience.Abortion | undefined

      Agora.listen(experience1.abortions, abortion => {
        abortion1 = abortion
      })

      Agora.listen(experience2.abortions, abortion => {
        abortion2 = abortion
      })

      Experience.abort(experience1, 'only first')

      expect(abortion1?.message).toBe('only first')
      expect(abortion2).toBeUndefined()
    })

    it('can share the same abortions agora', () => {
      const sharedAbortions = Agora.create<Experience.Abortion>()
      const experience1 = Experience.create({
        value: 1,
        abortions: sharedAbortions,
      })

      const abortionsReceived: Experience.Abortion[] = []

      Agora.listen(sharedAbortions, abortion => {
        abortionsReceived.push(abortion)
      })

      Experience.abort(experience1, 'first')

      expect(abortionsReceived.length).toBe(1)
      expect(abortionsReceived[0]?.message).toBe('first')
    })
  })

  describe('typed experiences', () => {
    it('works with number type', () => {
      const experience = Experience.create<number>({ value: 42 })

      const result: number = experience.value
      expect(result).toBe(42)
    })

    it('works with string type', () => {
      const experience = Experience.create<string>({ value: 'hello' })

      const result: string = experience.value
      expect(result).toBe('hello')
    })

    it('works with object type', () => {
      const experience = Experience.create<{ id: number; name: string }>({
        value: { id: 1, name: 'test' },
      })

      const result: { id: number; name: string } = experience.value
      expect(result.id).toBe(1)
      expect(result.name).toBe('test')
    })

    it('works with array type', () => {
      const experience = Experience.create<number[]>({ value: [1, 2, 3] })

      const result: number[] = experience.value
      expect(result).toEqual([1, 2, 3])
    })

    it('defaults to unknown type', () => {
      const experience = Experience.create({ value: 'unknown' })

      const result: unknown = experience.value
      expect(result).toBe('unknown')
    })
  })

  describe('Experience cognition', () => {
    it('creates an experience with a Cognition.Never by default', () => {
      const experience = Experience.create({ value: 42 })

      expect(Idion.is(experience.cognition, Cognition.identifier)).toBe(true)
    })

    it('creates an experience with a custom cognition', () => {
      const customCognition = Cognition.create<{ logger: string }>({
        logger: 'winston',
      })

      const experience = Experience.create({
        value: 42,
        cognition: customCognition,
      })

      expect(experience.cognition).toBe(customCognition)
      expect(Cognition.get(experience.cognition, 'logger')).toBe('winston')
    })
  })
})
