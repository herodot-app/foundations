import { describe, expect, it } from 'bun:test'
import { Idion } from '@herodot-app/idion'
import { Ptoma } from '@herodot-app/ptoma'
import { Zygon } from '@herodot-app/zygon'
import { Task } from './task'
import { Rheon } from '@herodot-app/rheon'

describe('Task', () => {
  describe('Task.create', () => {
    it('creates a task from a synchronous function that succeeds', async () => {
      const task = Task.create({ runner: (x: number) => x * 2 })

      const result = await Task.run(task, 21)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(42)
    })

    it('creates a task from a synchronous function that throws', async () => {
      const task = Task.create({
        runner: (_x: number) => {
          throw new Error('fail')
        },
      })

      const result = await Task.run(task, 21)

      expect(Zygon.isRight(result)).toBe(true)
      expect(Ptoma.is(result.right)).toBe(true)
      expect(result.right?.cause).toBeInstanceOf(Error)
    })

    it('creates a task from an async function', async () => {
      const task = Task.create({
        runner: async (x: number) => {
          await Promise.resolve()

          return x + 1
        },
      })

      const result = await Task.run(task, 10)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(11)
    })

    it('preserves a Zygon returned from the raw function', async () => {
      const task = Task.create({
        runner: (_x: number) => {
          return Zygon.right(new Error('expected failure'))
        },
      })

      const result = await Task.run(task, 21)

      expect(Zygon.isRight(result)).toBe(true)
    })

    it('handles optional input for undefined input type', async () => {
      const task = Task.create({ runner: () => 42 })

      const result = await Task.run(task)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(42)
    })
  })

  describe('Task.run', () => {
    it('runs a task and lifts the result on success', async () => {
      const task = Task.create({ runner: (x: number) => x * 2 })

      const result = await Task.run(task, 21)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(42)
    })

    it('runs a task and lifts the result on failure', async () => {
      const task = Task.create({
        runner: (_x: number) => {
          throw new Error('fail')
        },
      })

      const result = await Task.run(task, 21)

      expect(Zygon.isRight(result)).toBe(true)
      expect(Ptoma.is(result.right)).toBe(true)
    })

    it('lifts nested Zygon results', async () => {
      const task = Task.create({
        runner: (_x: number) => {
          return Zygon.left(Zygon.left(42))
        },
      })

      const result = await Task.run(task, 21)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(42)
    })

    it('lifts nested Zygon failure results', async () => {
      const task = Task.create({
        runner: (_x: number) => {
          return Zygon.right(Zygon.right(new Error('nested fail')))
        },
      })

      const result = await Task.run(task, 21)

      expect(Zygon.isRight(result)).toBe(true)
      expect(Zygon.is(result.right)).toBe(false)
    })
  })

  describe('Task branding', () => {
    it('creates a branded task', () => {
      const task = Task.create({ runner: (x: number) => x })

      expect(Idion.is(task, Task.identifier)).toBe(true)
    })

    it('can distinguish between tasks and plain objects', () => {
      const task = Task.create({ runner: (x: number) => x })
      const notTask = { runner: () => Promise.resolve(Zygon.left(42)) }

      expect(Idion.is(task, Task.identifier)).toBe(true)
      expect(Idion.is(notTask, Task.identifier)).toBe(false)
    })
  })

  describe('Task.abort', () => {
    it('aborts a task and sets the signal to aborted', () => {
      const task = Task.create({ runner: () => 42 })

      expect(Task.isAborted(task)).toBe(false)

      Task.abort(task)

      expect(Task.isAborted(task)).toBe(true)
    })

    it('aborts a task with a custom reason', () => {
      const task = Task.create({ runner: () => 42 })

      Task.abort(task, 'timeout')

      expect(Task.isAborted(task)).toBe(true)
      expect(Rheon.read(task.controllerRef).signal.reason.message).toBe(
        'timeout',
      )
    })
  })

  describe('Task.aborted', () => {
    it('returns false for a task that has not been aborted', () => {
      const task = Task.create({ runner: () => 42 })

      expect(Task.isAborted(task)).toBe(false)
    })

    it('returns true for a task that has been aborted', () => {
      const task = Task.create({ runner: () => 42 })

      Task.abort(task)

      expect(Task.isAborted(task)).toBe(true)
    })
  })

  describe('Task abort during run', () => {
    it('returns an aborted RuntimePtoma when task is aborted during execution', async () => {
      const task = Task.create({
        runner: async () => {
          Task.abort(task, 'interrupted')

          await Promise.resolve()

          return 42
        },
      })

      const result = await Task.run(task)

      expect(Zygon.isRight(result)).toBe(true)
      expect(Ptoma.match(result.right, Task.Aborted)).toBe(true)
    })

    it('preserves the abort reason when aborted during execution', async () => {
      const task = Task.create({
        runner: async () => {
          Task.abort(task, 'timeout exceeded')

          await Promise.resolve()

          return 'success'
        },
      })

      const result = await Task.run(task)

      expect(Zygon.isRight(result)).toBe(true)
      expect(result.right?.message).toBe('timeout exceeded')
    })

    it('can be aborted from outside while task is running', async () => {
      let resolvePromise: () => void

      const blocker = new Promise<void>(resolve => {
        resolvePromise = resolve
      })

      const task = Task.create({
        runner: async () => {
          await blocker

          return 'completed'
        },
      })

      const runPromise = Task.run(task)

      Task.abort(task, 'external abort')

      // biome-ignore lint: it's okay here
      resolvePromise!()

      const result = await runPromise

      expect(Zygon.isRight(result)).toBe(true)
      expect(Ptoma.match(result.right, Task.Aborted)).toBe(true)
      expect(result.right?.message).toBe('external abort')
    })

    it('succeeds when not aborted', async () => {
      const task = Task.create({ runner: () => 'success' })

      const result = await Task.run(task)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe('success')
    })
  })

  describe('Task.link', () => {
    it('aborts second task when first is aborted', async () => {
      const first = Task.create({ runner: () => 'first' })
      const second = Task.create({ runner: () => 'second' })

      Task.link(first, second)

      Task.abort(first, 'first aborted')

      expect(Task.isAborted(first)).toBe(true)
      expect(Task.isAborted(second)).toBe(true)
    })

    it('aborts first task when second is aborted', async () => {
      const first = Task.create({ runner: () => 'first' })
      const second = Task.create({ runner: () => 'second' })

      Task.link(first, second)

      Task.abort(second, 'second aborted')

      expect(Task.isAborted(first)).toBe(true)
      expect(Task.isAborted(second)).toBe(true)
    })

    it('returns a cleanup function that unlinks the tasks', () => {
      const first = Task.create({ runner: () => 'first' })
      const second = Task.create({ runner: () => 'second' })

      const unlink = Task.link(first, second)

      unlink()

      Task.abort(first)

      expect(Task.isAborted(first)).toBe(true)
      expect(Task.isAborted(second)).toBe(false)
    })

    it('does not propagate abort after unlinking', () => {
      const first = Task.create({ runner: () => 'first' })
      const second = Task.create({ runner: () => 'second' })

      const unlink = Task.link(first, second)
      unlink()

      Task.abort(first, 'test')
      Task.abort(second, 'test')

      expect(Task.isAborted(first)).toBe(true)
      expect(Task.isAborted(second)).toBe(true)
    })
  })

  describe('Task.create linkedTo option', () => {
    it('automatically links task to another task on creation', () => {
      const parent = Task.create({ runner: () => 'parent' })
      const child = Task.create({ runner: () => 'child', linkedTo: parent })

      Task.abort(parent, 'parent aborted')

      expect(Task.isAborted(parent)).toBe(true)
      expect(Task.isAborted(child)).toBe(true)
    })

    it('aborts parent when linked child is aborted', () => {
      const parent = Task.create({ runner: () => 'parent' })
      const child = Task.create({ runner: () => 'child', linkedTo: parent })

      Task.abort(child, 'child aborted')

      expect(Task.isAborted(parent)).toBe(true)
      expect(Task.isAborted(child)).toBe(true)
    })

    it('allows running linked tasks without immediate abort', async () => {
      const parent = Task.create({ runner: () => 'parent' })
      const child = Task.create({ runner: () => 'child', linkedTo: parent })

      const parentResult = await Task.run(parent)
      const childResult = await Task.run(child)

      expect(Zygon.isLeft(parentResult)).toBe(true)
      expect(Zygon.isLeft(childResult)).toBe(true)
      expect(parentResult.left).toBe('parent')
      expect(childResult.left).toBe('child')
    })

    it('aborts child task when parent aborts during execution', async () => {
      let resolveBlocker: () => void

      const blocker = new Promise<void>(resolve => {
        resolveBlocker = resolve
      })

      const parent = Task.create({
        runner: async () => {
          await blocker
          return 'parent'
        },
      })

      const child = Task.create({
        runner: async () => {
          await blocker
          return 'child'
        },
        linkedTo: parent,
      })

      const parentRun = Task.run(parent)
      const childRun = Task.run(child)

      Task.abort(parent, 'parent aborted')

      // biome-ignore lint: it's okay here
      resolveBlocker!()

      const parentResult = await parentRun
      const childResult = await childRun

      expect(Zygon.isRight(parentResult)).toBe(true)
      expect(Ptoma.match(parentResult.right, Task.Aborted)).toBe(true)
      expect(Zygon.isRight(childResult)).toBe(true)
      expect(Ptoma.match(childResult.right, Task.Aborted)).toBe(true)
    })
  })
})
