import { describe, expect, it } from 'bun:test'
import { Idion } from '@herodot-app/idion'
import { Zygon } from '@herodot-app/zygon'
import { Ptoma } from '@herodot-app/ptoma'
import { Processor } from './processor'
import { Process } from './process'

describe('Processor', () => {
  describe('Processor.create', () => {
    it('creates an empty processor', () => {
      const processor = Processor.create()

      expect(Idion.is(processor, Processor.identifier)).toBe(true)
      expect(Processor.length(processor)).toBe(0)
    })

    it('creates a processor with initial stack', () => {
      const process1 = Process.create({ thought: x => x })
      const process2 = Process.create({ thought: (x: number) => x + 1 })

      const processor = Processor.create([process1, process2])

      expect(Processor.length(processor)).toBe(2)
    })

    it('has correct identifier', () => {
      expect(Processor.identifier.description).toBe(
        '@herodot-app/praxis/processor',
      )
    })
  })

  describe('Processor.get', () => {
    it('returns left with process when found', () => {
      const process = Process.create({ thought: x => x * 2, input: 5 })
      const processor = Processor.create([process])

      const result = Processor.get(processor, process.id)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(process)
    })

    it('returns right with UnregisteredFailure when not found', () => {
      const processor = Processor.create()

      const result = Processor.get(processor, 'nonexistent')

      expect(Zygon.isRight(result)).toBe(true)

      expect(Ptoma.is(result.right)).toBe(true)
      expect(result.right?.message).toContain('nonexistent')
    })

    it('returns right when process was unregistered', () => {
      const process = Process.create({ thought: x => x })
      const processor = Processor.create([process])
      const unregistered = Processor.unregister(processor, process.id)

      const result = Processor.get(unregistered, process.id)

      expect(Zygon.isRight(result)).toBe(true)
    })
  })

  describe('Processor.has', () => {
    it('returns true when process exists', () => {
      const process = Process.create({ thought: x => x })
      const processor = Processor.create([process])

      expect(Processor.has(processor, process.id)).toBe(true)
    })

    it('returns false when process does not exist', () => {
      const processor = Processor.create()

      expect(Processor.has(processor, 'fake-id')).toBe(false)
    })
  })

  describe('Processor.register', () => {
    it('adds a new process to the processor', () => {
      const processor = Processor.create()
      const process = Process.create({ thought: x => x })

      const updated = Processor.register(processor, process)

      expect(Processor.length(updated)).toBe(1)
      expect(Processor.has(updated, process.id)).toBe(true)
    })

    it('adds process at the beginning of the stack', () => {
      const process1 = Process.create({ thought: x => x })
      const process2 = Process.create({ thought: (x: number) => x + 1 })

      const processor = Processor.create([process1])

      const updated = Processor.register(processor, process2)

      expect(Processor.length(updated)).toBe(2)

      const result = Processor.get(updated, process2.id)

      expect(Zygon.isLeft(result)).toBe(true)
    })

    it('does not modify original processor', () => {
      const processor = Processor.create()
      const process = Process.create({ thought: x => x })

      Processor.register(processor, process)

      expect(Processor.length(processor)).toBe(0)
    })
  })

  describe('Processor.unregister', () => {
    it('removes process by id', () => {
      const process = Process.create({ thought: x => x })
      const processor = Processor.create([process])

      const updated = Processor.unregister(processor, process.id)

      expect(Processor.length(updated)).toBe(0)
      expect(Processor.has(updated, process.id)).toBe(false)
    })

    it('removes process by process object', () => {
      const process = Process.create({ thought: x => x })
      const processor = Processor.create([process])

      const updated = Processor.unregister(processor, process)

      expect(Processor.length(updated)).toBe(0)
    })

    it('removes only the matching process', () => {
      const p1 = Process.create({ thought: x => x })
      const p2 = Process.create({ thought: x => x })
      const processor = Processor.create([p1, p2])

      const updated = Processor.unregister(processor, p1.id)

      expect(Processor.length(updated)).toBe(1)
      expect(Processor.has(updated, p1.id)).toBe(false)
      expect(Processor.has(updated, p2.id)).toBe(true)
    })
  })

  describe('Processor.length', () => {
    it('returns 0 for empty processor', () => {
      const processor = Processor.create()

      expect(Processor.length(processor)).toBe(0)
    })

    it('returns correct count', () => {
      const p1 = Process.create({ thought: x => x })
      const p2 = Process.create({ thought: x => x })
      const p3 = Process.create({ thought: x => x })
      const processor = Processor.create([p1, p2, p3])

      expect(Processor.length(processor)).toBe(3)
    })
  })

  describe('Processor.each', () => {
    it('iterates over all processes', () => {
      const p1 = Process.create({ thought: (x: number) => x + 1 })
      const p2 = Process.create({ thought: (x: number) => x + 2 })
      const processor = Processor.create([p1, p2])

      const results: string[] = []
      Processor.each(processor, process => {
        results.push(process.id)
      })

      expect(results).toHaveLength(2)
    })

    it('calls fn for each process', () => {
      const process = Process.create({ thought: x => x })
      const processor = Processor.create([process])
      let callCount = 0

      Processor.each(processor, () => {
        callCount++
      })

      expect(callCount).toBe(1)
    })
  })

  describe('Processor.unstack', () => {
    it('keeps only the newest process (first in stack)', () => {
      const p1 = Process.create({ thought: x => x })
      const p2 = Process.create({ thought: x => x })
      const processor = Processor.create([p1, p2])

      const updated = Processor.unstack(processor)

      expect(Processor.length(updated)).toBe(1)
      expect(Processor.has(updated, p2.id)).toBe(false)
      expect(Processor.has(updated, p1.id)).toBe(true)
    })

    it('returns empty processor when stack has one element', () => {
      const process = Process.create({ thought: x => x })
      const processor = Processor.create([process])

      const updated = Processor.unstack(processor)

      expect(Processor.length(updated)).toBe(0)
    })

    it('returns empty processor when stack is empty', () => {
      const processor = Processor.create()

      const updated = Processor.unstack(processor)

      expect(Processor.length(updated)).toBe(0)
    })
  })

  describe('Processor types', () => {
    it('handles Process.Any type', () => {
      const process = Process.create({ thought: x => x, input: 42 })
      const processor = Processor.create([process])

      const result = Processor.get(processor, process.id)

      expect(Zygon.isLeft(result)).toBe(true)
    })
  })
})

